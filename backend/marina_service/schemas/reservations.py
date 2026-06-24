from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from marina_service.models.enums import PaymentStatus, ReservationStatus, ReservationType


class AvailabilitySlipOut(BaseModel):
    size: str
    length_ft: int | None = None
    beam_ft: int | None = None
    price_monthly: Decimal | None = None
    available: int = 0
    amenities: list[str] = Field(default_factory=list)


class AvailabilityStorageOut(BaseModel):
    type: str
    name: str
    max_loa_ft: int | None = None
    max_length_ft: int | None = None
    price_monthly: Decimal | None = None
    available: int = 0


class ReservationCreate(BaseModel):
    reservation_type: ReservationType
    boat_id: UUID | None = None
    requested_slip_size: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None
    # Guest fields when not authenticated
    guest_email: EmailStr | None = None
    guest_first_name: str | None = None
    guest_last_name: str | None = None
    guest_phone: str | None = None
    guest_boat_make: str | None = None
    guest_boat_model: str | None = None
    guest_boat_year: int | None = None


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    request_number: str
    reservation_type: ReservationType
    requested_slip_size: str | None
    start_date: date | None
    end_date: date | None
    assigned_slip_id: str | None
    status: ReservationStatus
    list_price: Decimal | None
    payment_status: PaymentStatus
    notes: str | None
    created_at: datetime


class ReservationManagerPatch(BaseModel):
    status: ReservationStatus | None = None
    assigned_slip_id: str | None = None
    list_price: Decimal | None = None
    payment_status: PaymentStatus | None = None
    contract_date: date | None = None
    notes: str | None = None
