from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LandingGallerySlideOut(BaseModel):
    id: str | None = None
    url: str
    alt_text: str | None = None


class LandingHeroOut(BaseModel):
    label: str
    title: str


class LandingHeroUpdateIn(BaseModel):
    label: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=500)


class LandingGalleryOut(BaseModel):
    slides: list[LandingGallerySlideOut]
    default_url: str
    using_fallback: bool
    total_count: int = 0
    hero_label: str
    hero_title: str


class LandingGalleryImageOut(BaseModel):
    id: UUID
    filename: str
    url: str
    alt_text: str | None
    sort_order: int
    is_active: bool
    created_at: datetime


class LandingGalleryStatsOut(BaseModel):
    active_count: int
    total_count: int


class LandingGalleryManageOut(BaseModel):
    images: list[LandingGalleryImageOut]
    stats: LandingGalleryStatsOut
    hero: LandingHeroOut


class LandingGalleryReorderIn(BaseModel):
    filenames: list[str] = Field(min_length=1)
