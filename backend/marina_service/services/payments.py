"""Gravity payment gateway integration (stub mode)."""

from __future__ import annotations

import secrets
import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.config import get_settings
from marina_service.models.enums import PaymentStatus
from marina_service.models.payment_record import PaymentRecord
from marina_service.models.service_request import ServiceRequest


async def create_payment_session(
    db: AsyncSession,
    *,
    marina_id: uuid.UUID,
    customer_id: uuid.UUID,
    service_request_id: uuid.UUID,
    amount: Decimal,
) -> dict:
    """Create a Gravity checkout session (stub returns a fake redirect URL)."""
    settings = get_settings()
    req = await db.get(ServiceRequest, service_request_id)
    if not req or req.marina_id != marina_id or req.customer_id != customer_id:
        raise ValueError("Service request not found")

    session_id = f"stub_{secrets.token_hex(12)}"
    if settings.gravity_stub_mode:
        checkout_url = f"{settings.public_app_url}/pay/stub?session={session_id}&request={service_request_id}"
    else:
        # Real Gravity API integration would go here.
        checkout_url = f"{settings.public_app_url}/pay?session={session_id}"

    record = PaymentRecord(
        marina_id=marina_id,
        customer_id=customer_id,
        service_request_id=service_request_id,
        external_payment_id=session_id,
        amount=amount,
        status=PaymentStatus.UNPAID.value,
    )
    db.add(record)
    await db.flush()
    return {
        "session_id": session_id,
        "checkout_url": checkout_url,
        "payment_record_id": str(record.id),
    }


async def handle_payment_webhook(
    db: AsyncSession,
    *,
    payload: dict,
    webhook_secret: str,
) -> dict:
    """Process Gravity webhook callback (stub validates secret header)."""
    settings = get_settings()
    expected = settings.gravity_webhook_secret
    provided = payload.get("secret") or webhook_secret
    if expected and provided != expected:
        raise ValueError("Invalid webhook secret")

    session_id = payload.get("session_id") or payload.get("external_payment_id")
    status_raw = (payload.get("status") or "PAID").upper()
    if not session_id:
        raise ValueError("Missing session_id")

    r = await db.execute(
        select(PaymentRecord).where(PaymentRecord.external_payment_id == session_id)
    )
    record = r.scalar_one_or_none()
    if not record:
        raise ValueError("Payment record not found")

    try:
        payment_status = PaymentStatus(status_raw)
    except ValueError:
        payment_status = PaymentStatus.PAID

    record.status = payment_status.value
    if record.service_request_id and payment_status == PaymentStatus.PAID:
        req = await db.get(ServiceRequest, record.service_request_id)
        if req:
            req.payment_status = PaymentStatus.PAID
            if payload.get("amount"):
                req.invoice_amount = Decimal(str(payload["amount"]))

    return {"ok": True, "payment_record_id": str(record.id), "status": record.status}


async def list_payment_history(
    db: AsyncSession,
    *,
    marina_id: uuid.UUID,
    customer_id: uuid.UUID,
) -> list[PaymentRecord]:
    r = await db.execute(
        select(PaymentRecord)
        .where(PaymentRecord.marina_id == marina_id, PaymentRecord.customer_id == customer_id)
        .order_by(PaymentRecord.created_at.desc())
    )
    return list(r.scalars().all())
