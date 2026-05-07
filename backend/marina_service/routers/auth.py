import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth import jwt as jwt_util
from marina_service.auth.password import hash_password, verify_password
from marina_service.config import get_settings
from marina_service.database import get_db
from marina_service.models.customer import Customer
from marina_service.models.enums import UserRole
from marina_service.models.tokens import ClaimToken, PasswordResetToken, RefreshToken
from marina_service.models.staff_user import StaffUser
from marina_service.schemas.auth import (
    ClaimAccountIn,
    ForgotPasswordIn,
    LoginIn,
    LogoutIn,
    RefreshIn,
    ResetPasswordIn,
    TokenOut,
)
from marina_service.services import notifications as notif_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)) -> TokenOut:
    email = body.email.strip().lower()
    r = await db.execute(select(Customer).where(Customer.email == email))
    cust = r.scalar_one_or_none()
    if cust and cust.password_hash and verify_password(body.password, cust.password_hash):
        access = jwt_util.create_access_token(cust.id, "customer", UserRole.CUSTOMER.value)
        refresh_raw = jwt_util.create_refresh_token_value()
        await _store_refresh(db, "customer", cust.id, refresh_raw)
        return TokenOut(access_token=access, refresh_token=refresh_raw)

    r2 = await db.execute(select(StaffUser).where(StaffUser.email == email))
    staff = r2.scalar_one_or_none()
    if staff and verify_password(body.password, staff.password_hash):
        access = jwt_util.create_access_token(staff.id, "staff", staff.role)
        refresh_raw = jwt_util.create_refresh_token_value()
        await _store_refresh(db, "staff", staff.id, refresh_raw)
        return TokenOut(access_token=access, refresh_token=refresh_raw)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")


async def _store_refresh(db: AsyncSession, subject_type: str, subject_id: uuid.UUID, raw: str) -> None:
    settings = get_settings()
    exp = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    db.add(
        RefreshToken(
            token_hash=jwt_util.hash_refresh_token(raw),
            subject_type=subject_type,
            subject_id=subject_id,
            expires_at=exp,
            revoked=False,
        )
    )


@router.post("/refresh", response_model=TokenOut)
async def refresh_token(body: RefreshIn, db: AsyncSession = Depends(get_db)) -> TokenOut:
    h = jwt_util.hash_refresh_token(body.refresh_token)
    r = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == h, RefreshToken.revoked.is_(False)))
    row = r.scalar_one_or_none()
    if not row or row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    row.revoked = True
    if row.subject_type == "customer":
        access = jwt_util.create_access_token(row.subject_id, "customer", UserRole.CUSTOMER.value)
    else:
        st = await db.get(StaffUser, row.subject_id)
        role = st.role if st else UserRole.MANAGER.value
        access = jwt_util.create_access_token(row.subject_id, "staff", role)
    new_raw = jwt_util.create_refresh_token_value()
    await _store_refresh(db, row.subject_type, row.subject_id, new_raw)
    return TokenOut(access_token=access, refresh_token=new_raw)


@router.post("/logout")
async def logout(
    body: LogoutIn,
    db: AsyncSession = Depends(get_db),
) -> dict:
    h = jwt_util.hash_refresh_token(body.refresh_token)
    r = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == h))
    row = r.scalar_one_or_none()
    if row:
        row.revoked = True
    await db.commit()
    return {"ok": True}


@router.post("/claim-account")
async def claim_account(body: ClaimAccountIn, db: AsyncSession = Depends(get_db)) -> dict:
    h = jwt_util.hash_refresh_token(body.token)
    r = await db.execute(
        select(ClaimToken).where(ClaimToken.token_hash == h, ClaimToken.used.is_(False))
    )
    ct = r.scalar_one_or_none()
    if not ct or ct.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    cust = await db.get(Customer, ct.customer_id)
    if not cust:
        raise HTTPException(status_code=400, detail="Customer not found")
    cust.password_hash = hash_password(body.password)
    cust.account_claimed = True
    ct.used = True
    await db.commit()
    return {"ok": True}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordIn, db: AsyncSession = Depends(get_db)) -> dict:
    email = body.email.strip().lower()
    raw = secrets.token_urlsafe(32)
    exp = datetime.now(timezone.utc) + timedelta(hours=24)
    h = jwt_util.hash_refresh_token(raw)

    cust = (
        await db.execute(select(Customer).where(Customer.email == email))
    ).scalar_one_or_none()
    staff = (
        await db.execute(select(StaffUser).where(StaffUser.email == email))
    ).scalar_one_or_none()

    if cust:
        db.add(
            PasswordResetToken(
                email=email,
                user_kind="customer",
                token_hash=h,
                expires_at=exp,
                used=False,
            )
        )
        await db.commit()
        _send_reset_email(db, email, raw, "customer")
    elif staff:
        db.add(
            PasswordResetToken(
                email=email,
                user_kind="staff",
                token_hash=h,
                expires_at=exp,
                used=False,
            )
        )
        await db.commit()
        _send_reset_email(db, email, raw, "staff")
    # Always return success to avoid email enumeration
    return {"ok": True}


def _send_reset_email(db: AsyncSession, email: str, raw_token: str, kind: str) -> None:
    settings = get_settings()
    link = f"{settings.public_app_url}/reset-password?token={raw_token}"
    # Celery/offline: use sync session for notification in API - use async notif stub
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import create_engine

    sync_maker = sessionmaker(bind=create_engine(get_settings().database_url_sync))
    s = sync_maker()
    try:
        notif_service.send_email_sync(
            s,
            to_email=email,
            subject="Password reset",
            body_text=f"Reset your password: {link}",
            template_key="password_reset",
        )
        s.commit()
    finally:
        s.close()


@router.post("/reset-password")
async def reset_password(body: ResetPasswordIn, db: AsyncSession = Depends(get_db)) -> dict:
    h = jwt_util.hash_refresh_token(body.token)
    r = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == h, PasswordResetToken.used.is_(False))
    )
    row = r.scalar_one_or_none()
    if not row or row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if row.user_kind == "customer":
        u = (await db.execute(select(Customer).where(Customer.email == row.email))).scalar_one_or_none()
        if u:
            u.password_hash = hash_password(body.password)
    else:
        u = (await db.execute(select(StaffUser).where(StaffUser.email == row.email))).scalar_one_or_none()
        if u:
            u.password_hash = hash_password(body.password)
    row.used = True
    await db.commit()
    return {"ok": True}
