import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth import jwt as jwt_util
from marina_service.auth.password import hash_password, verify_password
from marina_service.auth.deps import get_current_marina
from marina_service.config import get_settings
from marina_service.database import get_db
from marina_service.models.boat import Boat
from marina_service.models.customer import Customer
from marina_service.models.enums import RequestStatus, UserRole
from marina_service.models.marina import Marina
from marina_service.models.service_request import RequestStatusEvent, ServiceRequest
from marina_service.models.tokens import ClaimToken, PasswordResetToken, RefreshToken
from marina_service.models.staff_user import StaffUser
from marina_service.schemas.auth import (
    ClaimAccountIn,
    ForgotPasswordIn,
    GuestSubmitIn,
    GuestSubmitOut,
    LoginIn,
    LogoutIn,
    RefreshIn,
    ResetPasswordIn,
    TokenOut,
)
from marina_service.services import notifications as notif_service
from marina_service.services.request_numbers import next_request_number

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
async def login(
    body: LoginIn,
    marina: Marina = Depends(get_current_marina),
    db: AsyncSession = Depends(get_db),
) -> TokenOut:
    email = body.email.strip().lower()
    r = await db.execute(
        select(Customer).where(Customer.marina_id == marina.id, Customer.email == email)
    )
    cust = r.scalar_one_or_none()
    if cust and cust.password_hash and verify_password(body.password, cust.password_hash):
        access = jwt_util.create_access_token(cust.id, "customer", UserRole.CUSTOMER.value)
        refresh_raw = jwt_util.create_refresh_token_value()
        await _store_refresh(db, "customer", cust.id, refresh_raw)
        await db.commit()
        return TokenOut(access_token=access, refresh_token=refresh_raw)

    r2 = await db.execute(
        select(StaffUser).where(StaffUser.marina_id == marina.id, StaffUser.email == email)
    )
    staff = r2.scalar_one_or_none()
    if staff and verify_password(body.password, staff.password_hash):
        access = jwt_util.create_access_token(staff.id, "staff", staff.role)
        refresh_raw = jwt_util.create_refresh_token_value()
        await _store_refresh(db, "staff", staff.id, refresh_raw)
        await db.commit()
        return TokenOut(access_token=access, refresh_token=refresh_raw)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")


@router.post("/guest-submit", response_model=GuestSubmitOut, status_code=status.HTTP_201_CREATED)
async def guest_submit(
    body: GuestSubmitIn,
    marina: Marina = Depends(get_current_marina),
    db: AsyncSession = Depends(get_db),
) -> GuestSubmitOut:
    email = body.customer.email.strip().lower()
    r = await db.execute(
        select(Customer).where(Customer.marina_id == marina.id, Customer.email == email)
    )
    cust = r.scalar_one_or_none()
    if not cust:
        cust = Customer(
            marina_id=marina.id,
            email=email,
            phone=body.customer.phone,
            first_name=body.customer.first_name,
            last_name=body.customer.last_name,
            street=body.customer.street,
            city=body.customer.city,
            state=body.customer.state,
            zip_code=body.customer.zip_code,
            account_claimed=False,
            is_active=True,
        )
        db.add(cust)
        await db.flush()

    boat = Boat(
        marina_id=marina.id,
        customer_id=cust.id,
        make=body.boat.make,
        model=body.boat.model,
        year=body.boat.year,
        loa_ft=body.boat.loa_ft,
        loa_in=body.boat.loa_in,
        beam_ft=body.boat.beam_ft,
        beam_in=body.boat.beam_in,
        registration=body.boat.registration,
        vin_number=body.boat.vin_number,
        photos=[],
    )
    db.add(boat)
    await db.flush()

    num = await next_request_number(db)
    req = ServiceRequest(
        marina_id=marina.id,
        request_number=num,
        customer_id=cust.id,
        boat_id=boat.id,
        form_type=body.form_type,
        status=RequestStatus.SUBMITTED,
        category=body.category,
        description=body.description,
        custom_description=body.custom_description,
        job_selections=body.job_selections or [],
        customer_notes=body.customer_notes,
        preferred_date=body.preferred_date,
        preferred_time_slot=body.preferred_time_slot,
        attachments=[],
    )
    db.add(req)
    await db.flush()
    db.add(RequestStatusEvent(request_id=req.id, status=RequestStatus.SUBMITTED))

    raw_token = secrets.token_urlsafe(32)
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    db.add(
        ClaimToken(
            customer_id=cust.id,
            token_hash=jwt_util.hash_refresh_token(raw_token),
            expires_at=exp,
            used=False,
        )
    )
    await db.commit()

    settings = get_settings()
    claim_url = f"{settings.public_app_url}/claim?token={raw_token}"
    _send_claim_email(db, email, claim_url, num)

    return GuestSubmitOut(request_number=num, request_id=req.id, claim_token=raw_token)


def _send_claim_email(db: AsyncSession, email: str, claim_url: str, request_number: str) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    sync_maker = sessionmaker(bind=create_engine(get_settings().database_url_sync))
    s = sync_maker()
    try:
        notif_service.send_email_sync(
            s,
            to_email=email,
            subject=f"Service request {request_number} submitted",
            body_text=(
                f"Your service request {request_number} has been submitted.\n\n"
                f"Create your account to track status: {claim_url}"
            ),
            template_key="guest_submit_claim",
        )
        s.commit()
    finally:
        s.close()


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
