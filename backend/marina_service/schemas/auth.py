from datetime import date
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from marina_service.models.enums import FormType


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class LogoutIn(BaseModel):
    refresh_token: str


class ClaimAccountIn(BaseModel):
    token: str
    password: str = Field(min_length=8)


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=8)


class GuestCustomerIn(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = Field(None, max_length=2)
    zip_code: str | None = None


class GuestBoatIn(BaseModel):
    make: str | None = None
    model: str | None = None
    year: int | None = None
    loa_ft: int | None = None
    loa_in: int | None = None
    beam_ft: int | None = None
    beam_in: int | None = None
    registration: str | None = None
    vin_number: str | None = None


class GuestSubmitIn(BaseModel):
    customer: GuestCustomerIn
    boat: GuestBoatIn
    form_type: FormType = FormType.GENERAL
    category: str | None = None
    description: str | None = None
    custom_description: str | None = None
    job_selections: list | None = None
    customer_notes: str | None = None
    preferred_date: date | None = None
    preferred_time_slot: str | None = Field(None, max_length=20)


class GuestSubmitOut(BaseModel):
    ok: bool = True
    request_number: str
    request_id: UUID
    claim_token: str
