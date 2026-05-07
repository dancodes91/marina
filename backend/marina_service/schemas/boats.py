from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BoatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    wallace_stock_id: str | None
    make: str | None
    model: str | None
    year: int | None
    loa_ft: int | None
    loa_in: int | None
    beam_ft: int | None
    beam_in: int | None
    draft_ft: Decimal | None
    vin_number: str | None
    registration: str | None
    weight_lbs: int | None
    slip_id: str | None
    engine_make: str | None
    engine_model: str | None
    engine_hours: Decimal | None
    photos: list | None


class BoatCustomerPatch(BaseModel):
    engine_make: str | None = None
    engine_model: str | None = None
    engine_hours: Decimal | None = None


class BoatPhotoPresignIn(BaseModel):
    filename: str = "photo.jpg"
    content_type: str = "image/jpeg"


class PresignUploadOut(BaseModel):
    upload_url: str
    key: str
    public_url: str
