"""Landing gallery: filesystem storage + PostgreSQL metadata."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.models.landing_gallery_image import LandingGalleryImage
from marina_service.models.marina import Marina
from marina_service.services import landing_gallery_storage as storage

DEFAULT_HERO_TITLE = "Service & storage portal"


def hero_for_marina(marina: Marina) -> tuple[str, str]:
    return (
        (marina.landing_hero_label or marina.name).strip(),
        (marina.landing_hero_title or DEFAULT_HERO_TITLE).strip(),
    )


async def update_hero(
    db: AsyncSession,
    marina: Marina,
    *,
    label: str,
    title: str,
) -> tuple[str, str]:
    marina.landing_hero_label = label.strip()
    marina.landing_hero_title = title.strip()
    await db.flush()
    return hero_for_marina(marina)


def _storage_key(marina_slug: str, filename: str) -> str:
    safe_slug = storage.SAFE_NAME.sub("_", marina_slug.strip().lower()) or "marina"
    return f"{safe_slug}/{filename}"


def _filename_from_row(row: LandingGalleryImage) -> str:
    return row.s3_key.rsplit("/", 1)[-1]


async def sync_filesystem_to_db(db: AsyncSession, marina: Marina) -> None:
    """Import on-disk gallery files into the database (idempotent)."""
    for item in storage.list_gallery_files(marina.slug):
        await _upsert_row(db, marina, item)


async def _upsert_row(
    db: AsyncSession,
    marina: Marina,
    item: storage.GalleryFile,
) -> LandingGalleryImage:
    key = _storage_key(marina.slug, item.filename)
    url = storage.public_file_url(marina.slug, item.filename)

    result = await db.execute(
        select(LandingGalleryImage).where(
            LandingGalleryImage.marina_id == marina.id,
            LandingGalleryImage.s3_key == key,
        )
    )
    row = result.scalar_one_or_none()
    if row:
        row.public_url = url
        row.alt_text = item.alt_text
        row.sort_order = item.sort_order
        row.is_active = True
        await db.flush()
        return row

    row = LandingGalleryImage(
        marina_id=marina.id,
        s3_key=key,
        public_url=url,
        alt_text=item.alt_text,
        sort_order=item.sort_order,
        is_active=True,
    )
    db.add(row)
    await db.flush()
    return row


async def list_active_rows(db: AsyncSession, marina_id: uuid.UUID) -> list[LandingGalleryImage]:
    result = await db.execute(
        select(LandingGalleryImage)
        .where(
            LandingGalleryImage.marina_id == marina_id,
            LandingGalleryImage.is_active.is_(True),
        )
        .order_by(LandingGalleryImage.sort_order, LandingGalleryImage.created_at)
    )
    return list(result.scalars().all())


async def count_active_rows(db: AsyncSession, marina_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(LandingGalleryImage)
        .where(
            LandingGalleryImage.marina_id == marina_id,
            LandingGalleryImage.is_active.is_(True),
        )
    )
    return int(result.scalar_one())


async def count_all_rows(db: AsyncSession, marina_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(LandingGalleryImage)
        .where(LandingGalleryImage.marina_id == marina_id)
    )
    return int(result.scalar_one())


async def save_upload(
    db: AsyncSession,
    marina: Marina,
    original_filename: str,
    content: bytes,
) -> LandingGalleryImage:
    item = storage.save_gallery_file(marina.slug, original_filename, content)
    return await _upsert_row(db, marina, item)


async def delete_image(db: AsyncSession, marina: Marina, filename: str) -> None:
    storage.delete_gallery_file(marina.slug, filename)
    key = _storage_key(marina.slug, filename)
    result = await db.execute(
        select(LandingGalleryImage).where(
            LandingGalleryImage.marina_id == marina.id,
            LandingGalleryImage.s3_key == key,
        )
    )
    row = result.scalar_one_or_none()
    if row:
        row.is_active = False
        await db.flush()


async def reorder_images(
    db: AsyncSession,
    marina: Marina,
    filenames: list[str],
) -> list[LandingGalleryImage]:
    storage.reorder_gallery_files(marina.slug, filenames)
    keys = [_storage_key(marina.slug, name) for name in filenames]
    result = await db.execute(
        select(LandingGalleryImage).where(
            LandingGalleryImage.marina_id == marina.id,
            LandingGalleryImage.s3_key.in_(keys),
        )
    )
    rows_by_key = {row.s3_key: row for row in result.scalars().all()}
    for index, key in enumerate(keys):
        if key in rows_by_key:
            rows_by_key[key].sort_order = index
            rows_by_key[key].is_active = True
    await db.flush()
    return await list_active_rows(db, marina.id)
