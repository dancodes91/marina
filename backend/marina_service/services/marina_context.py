"""Marina tenant resolution and seeding."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.config import get_settings
from marina_service.models.marina import Marina, MarinaAvailability

DEFAULT_SLIPS = [
    {"size": "30ft", "length_ft": 30, "beam_ft": 10, "price_monthly": 450, "available": 3, "amenities": ["water", "power"]},
    {"size": "35ft", "length_ft": 35, "beam_ft": 12, "price_monthly": 550, "available": 2, "amenities": ["water", "power", "wifi"]},
    {"size": "40ft", "length_ft": 40, "beam_ft": 14, "price_monthly": 650, "available": 1, "amenities": ["water", "power", "wifi"]},
]

DEFAULT_STORAGE = [
    {"type": "DRY_RACK", "name": "Dry Rack — up to 28ft", "max_loa_ft": 28, "price_monthly": 320, "available": 4},
    {"type": "INDOOR_STORAGE", "name": "Indoor Storage", "max_loa_ft": 35, "price_monthly": 480, "available": 2},
    {"type": "OUTDOOR_STORAGE", "name": "Outdoor Storage", "max_loa_ft": 40, "price_monthly": 280, "available": 6},
    {"type": "TRAILER", "name": "Trailer Storage", "max_length_ft": 24, "price_monthly": 120, "available": 8},
]


async def get_marina_by_slug(db: AsyncSession, slug: str) -> Marina | None:
    r = await db.execute(select(Marina).where(Marina.slug == slug, Marina.is_active.is_(True)))
    return r.scalar_one_or_none()


async def ensure_marina(
    db: AsyncSession,
    *,
    slug: str | None = None,
    name: str | None = None,
    contact_email: str | None = None,
    contact_phone: str | None = None,
) -> Marina:
    settings = get_settings()
    slug = slug or settings.default_marina_slug
    name = name or settings.default_marina_name
    contact_email = contact_email or settings.default_marina_contact_email
    contact_phone = contact_phone or settings.default_marina_contact_phone

    existing = await get_marina_by_slug(db, slug)
    if existing:
        return existing

    marina = Marina(
        slug=slug,
        name=name,
        contact_email=contact_email,
        contact_phone=contact_phone,
        timezone="America/New_York",
        sync_interval_mins=15,
        is_active=True,
    )
    db.add(marina)
    await db.flush()

    db.add(
        MarinaAvailability(
            marina_id=marina.id,
            slips=DEFAULT_SLIPS,
            storage=DEFAULT_STORAGE,
        )
    )
    await db.commit()
    await db.refresh(marina)
    return marina


async def get_or_create_default_marina(db: AsyncSession) -> Marina:
    return await ensure_marina(db)
