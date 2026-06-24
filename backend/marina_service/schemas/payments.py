from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PaymentSessionCreate(BaseModel):
    service_request_id: UUID
    amount: Decimal


class PaymentSessionOut(BaseModel):
    session_id: str
    checkout_url: str
    payment_record_id: str


class PaymentWebhookIn(BaseModel):
    session_id: str | None = None
    external_payment_id: str | None = None
    status: str = "PAID"
    amount: Decimal | None = None
    secret: str | None = None


class PaymentRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    service_request_id: UUID | None
    external_payment_id: str | None
    amount: Decimal
    status: str
    created_at: datetime
