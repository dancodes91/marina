from pydantic import BaseModel

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import get_current_customer, get_manager_or_admin
from marina_service.database import get_db
from marina_service.models.customer import Customer
from marina_service.models.notification_log import NotificationLog
from marina_service.models.staff_user import StaffUser

router = APIRouter(tags=["notifications"])


class NotificationPrefs(BaseModel):
    email_opt_in: bool | None = None
    sms_opt_in: bool | None = None


@router.get("/notifications/preferences")
async def get_prefs(
    customer: Customer = Depends(get_current_customer),
) -> dict:
    return {"email_opt_in": customer.email_opt_in, "sms_opt_in": customer.sms_opt_in}


@router.get("/notifications")
async def list_notifications(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    r = await db.execute(
        select(NotificationLog)
        .where(NotificationLog.customer_id == customer.id)
        .order_by(NotificationLog.created_at.desc())
        .limit(100)
    )
    rows = r.scalars().all()
    return [
        {
            "id": str(x.id),
            "channel": x.channel,
            "status": x.status,
            "subject": x.subject,
            "created_at": x.created_at.isoformat(),
        }
        for x in rows
    ]


@router.patch("/notifications/preferences")
async def patch_prefs(
    body: NotificationPrefs,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if body.email_opt_in is not None:
        customer.email_opt_in = body.email_opt_in
    if body.sms_opt_in is not None:
        customer.sms_opt_in = body.sms_opt_in
    return {"email_opt_in": customer.email_opt_in, "sms_opt_in": customer.sms_opt_in}


@router.get("/manager/notifications/log")
async def manager_log(
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(get_manager_or_admin),
) -> list[dict]:
    r = await db.execute(select(NotificationLog).order_by(NotificationLog.created_at.desc()).limit(500))
    rows = r.scalars().all()
    return [
        {
            "id": str(x.id),
            "channel": x.channel,
            "status": x.status,
            "recipient": x.recipient,
            "subject": x.subject,
            "error_message": x.error_message,
            "created_at": x.created_at.isoformat(),
        }
        for x in rows
    ]
