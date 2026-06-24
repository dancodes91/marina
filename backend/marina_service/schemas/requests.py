from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from marina_service.models.enums import FormType, PaymentStatus, RequestStatus


class ServiceRequestCreate(BaseModel):
    boat_id: UUID
    form_type: FormType = FormType.GENERAL
    category: str | None = None
    description: str | None = None
    custom_description: str | None = None
    job_selections: list | None = None
    customer_notes: str | None = None
    preferred_date: date | None = None
    preferred_time_slot: str | None = Field(None, max_length=20)


class ServiceRequestSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    request_number: str
    status: RequestStatus
    form_type: FormType
    category: str | None
    created_at: datetime
    preferred_date: date | None
    payment_status: PaymentStatus


class ServiceRequestCustomerDetail(BaseModel):
    """Customer-facing detail: totals only, no labor breakdown."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    request_number: str
    status: RequestStatus
    form_type: FormType
    category: str | None
    description: str | None
    custom_description: str | None
    job_selections: list | None
    customer_notes: str | None
    preferred_date: date | None
    preferred_time_slot: str | None
    wallace_ro_number: str | None
    scheduled_date: date | None
    estimated_completion: date | None
    total_estimate_list: Decimal | None
    invoice_amount: Decimal | None
    payment_status: PaymentStatus
    attachments: list | None
    created_at: datetime
    updated_at: datetime


class ServiceRequestManagerDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    request_number: str
    status: RequestStatus
    form_type: FormType
    customer_id: UUID
    boat_id: UUID
    category: str | None
    description: str | None
    custom_description: str | None
    job_selections: list | None
    customer_notes: str | None
    manager_notes: str | None
    preferred_date: date | None
    preferred_time_slot: str | None
    wallace_ro_number: str | None
    assigned_mechanic_id: UUID | None
    scheduled_date: date | None
    estimated_completion: date | None
    total_estimate_list: Decimal | None
    total_estimate_cost: Decimal | None
    invoice_amount: Decimal | None
    payment_status: PaymentStatus
    pricing_approved_by_id: UUID | None
    attachments: list | None
    created_at: datetime
    updated_at: datetime


class StatusPatch(BaseModel):
    status: RequestStatus


class ManagerRequestPatch(BaseModel):
    manager_notes: str | None = None
    wallace_ro_number: str | None = None
    assigned_mechanic_id: UUID | None = None
    scheduled_date: date | None = None
    estimated_completion: date | None = None


class TimelineEventOut(BaseModel):
    status: RequestStatus
    note: str | None
    created_at: datetime


class AttachmentPresignIn(BaseModel):
    filename: str
    content_type: str = "application/octet-stream"
