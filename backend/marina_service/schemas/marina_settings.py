from pydantic import BaseModel, EmailStr, Field


class MarinaSettingsOut(BaseModel):
    name: str
    slug: str
    subtitle: str
    contact_email: str | None = None
    contact_phone: str | None = None
    twilio_from_number: str | None = None
    sync_interval_mins: int


class MarinaSettingsUpdateIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    subtitle: str = Field(min_length=1, max_length=500)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=20)
    twilio_from_number: str | None = Field(default=None, max_length=20)
    sync_interval_mins: int = Field(ge=1, le=1440)


class MarinaBrandingOut(BaseModel):
    name: str
    subtitle: str
    slug: str
