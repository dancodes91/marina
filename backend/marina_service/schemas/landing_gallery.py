from pydantic import BaseModel, Field


class LandingGallerySlideOut(BaseModel):
    id: str | None = None
    url: str
    alt_text: str | None = None


class LandingGalleryOut(BaseModel):
    slides: list[LandingGallerySlideOut]
    default_url: str
    using_fallback: bool


class LandingGalleryImageOut(BaseModel):
    filename: str
    url: str
    alt_text: str | None
    sort_order: int


class LandingGalleryReorderIn(BaseModel):
    filenames: list[str] = Field(min_length=1)
