import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.jwt import decode_access_token
from marina_service.config import get_settings
from marina_service.database import get_db
from marina_service.models.customer import Customer
from marina_service.models.enums import UserRole
from marina_service.models.marina import Marina
from marina_service.models.staff_user import StaffUser
from marina_service.services.marina_context import get_marina_by_slug

security = HTTPBearer(auto_error=False)


async def get_current_marina(
    db: Annotated[AsyncSession, Depends(get_db)],
    x_marina_slug: Annotated[str | None, Header(alias="X-Marina-Slug")] = None,
) -> Marina:
    settings = get_settings()
    slug = (x_marina_slug or settings.default_marina_slug).strip().lower()
    marina = await get_marina_by_slug(db, slug)
    if not marina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Marina not found: {slug}")
    return marina


async def get_current_customer(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
    marina: Annotated[Marina, Depends(get_current_marina)],
) -> Customer:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_access_token(creds.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if payload.get("typ") != "customer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer access required")
    uid = uuid.UUID(payload["sub"])
    r = await db.execute(
        select(Customer).where(
            Customer.id == uid,
            Customer.marina_id == marina.id,
            Customer.is_active.is_(True),
        )
    )
    user = r.scalar_one_or_none()
    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    return user


async def get_optional_customer(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
    marina: Annotated[Marina, Depends(get_current_marina)],
) -> Customer | None:
    if not creds:
        return None
    try:
        payload = decode_access_token(creds.credentials)
    except ValueError:
        return None
    if payload.get("typ") != "customer":
        return None
    uid = uuid.UUID(payload["sub"])
    r = await db.execute(
        select(Customer).where(
            Customer.id == uid,
            Customer.marina_id == marina.id,
            Customer.is_active.is_(True),
        )
    )
    return r.scalar_one_or_none()


async def get_current_staff(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
    marina: Annotated[Marina, Depends(get_current_marina)],
) -> StaffUser:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_access_token(creds.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if payload.get("typ") != "staff":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    uid = uuid.UUID(payload["sub"])
    r = await db.execute(
        select(StaffUser).where(
            StaffUser.id == uid,
            StaffUser.marina_id == marina.id,
            StaffUser.is_active.is_(True),
        )
    )
    user = r.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    return user


async def get_manager_or_admin(
    staff: Annotated[StaffUser, Depends(get_current_staff)],
) -> StaffUser:
    if staff.role not in (UserRole.MANAGER.value, UserRole.ADMIN.value):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager access required")
    return staff


async def get_admin(
    staff: Annotated[StaffUser, Depends(get_current_staff)],
) -> StaffUser:
    if staff.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return staff


async def get_customer_or_staff_for_logout(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple[str, uuid.UUID]:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_access_token(creds.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    typ = payload.get("typ")
    if typ not in ("customer", "staff"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return typ, uuid.UUID(payload["sub"])
