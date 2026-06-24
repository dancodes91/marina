from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import get_current_customer
from marina_service.config import get_settings
from marina_service.database import get_db
from marina_service.models.customer import Customer
from marina_service.models.payment_record import PaymentRecord
from marina_service.schemas.payments import (
    PaymentRecordOut,
    PaymentSessionCreate,
    PaymentSessionOut,
    PaymentWebhookIn,
)
from marina_service.services import payments as payment_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create-session", response_model=PaymentSessionOut)
async def create_session(
    body: PaymentSessionCreate,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> PaymentSessionOut:
    try:
        result = await payment_service.create_payment_session(
            db,
            marina_id=customer.marina_id,
            customer_id=customer.id,
            service_request_id=body.service_request_id,
            amount=body.amount,
        )
        await db.commit()
        return PaymentSessionOut(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/webhook")
async def payment_webhook(
    body: PaymentWebhookIn,
    db: AsyncSession = Depends(get_db),
    x_gravity_webhook_secret: str | None = Header(default=None, alias="X-Gravity-Webhook-Secret"),
) -> dict:
    settings = get_settings()
    secret = body.secret or x_gravity_webhook_secret or ""
    try:
        result = await payment_service.handle_payment_webhook(
            db,
            payload=body.model_dump(),
            webhook_secret=secret or settings.gravity_webhook_secret,
        )
        await db.commit()
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/history", response_model=list[PaymentRecordOut])
async def payment_history(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> list[PaymentRecord]:
    return await payment_service.list_payment_history(
        db,
        marina_id=customer.marina_id,
        customer_id=customer.id,
    )
