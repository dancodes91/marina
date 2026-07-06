from pathlib import Path

from uuid import UUID



from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from fastapi.responses import FileResponse

from sqlalchemy.ext.asyncio import AsyncSession



from marina_service.auth.deps import get_admin, get_current_marina, get_manager_or_admin

from marina_service.database import get_db

from marina_service.models.landing_gallery_image import LandingGalleryImage

from marina_service.models.marina import Marina

from marina_service.models.staff_user import StaffUser

from marina_service.schemas.landing_gallery import (

    LandingGalleryImageOut,

    LandingGalleryManageOut,

    LandingGalleryOut,

    LandingGalleryReorderIn,

    LandingGallerySlideOut,

    LandingGalleryStatsOut,

    LandingHeroOut,

    LandingHeroUpdateIn,

)

from marina_service.services import landing_gallery_service as gallery

from marina_service.services.landing_gallery_storage import (

    ALLOWED_EXTENSIONS,

    default_image_path,

    default_public_url,

    resolve_file_path,

)



MAX_UPLOAD_BYTES = 10 * 1024 * 1024

MEDIA_TYPES = {

    ".jpg": "image/jpeg",

    ".jpeg": "image/jpeg",

    ".png": "image/png",

    ".webp": "image/webp",

    ".gif": "image/gif",

}



public_router = APIRouter(prefix="/landing-gallery", tags=["landing-gallery"])

manager_router = APIRouter(prefix="/manager/landing-gallery", tags=["manager", "landing-gallery"])





def _row_to_out(row: LandingGalleryImage) -> LandingGalleryImageOut:

    filename = row.s3_key.rsplit("/", 1)[-1]

    return LandingGalleryImageOut(

        id=row.id,

        filename=filename,

        url=row.public_url,

        alt_text=row.alt_text,

        sort_order=row.sort_order,

        is_active=row.is_active,

        created_at=row.created_at,

    )





def _hero_out(marina: Marina) -> LandingHeroOut:

    label, title = gallery.hero_for_marina(marina)

    return LandingHeroOut(label=label, title=title)





async def _stats_out(db: AsyncSession, marina: Marina) -> LandingGalleryStatsOut:

    return LandingGalleryStatsOut(

        active_count=await gallery.count_active_rows(db, marina.id),

        total_count=await gallery.count_all_rows(db, marina.id),

    )





async def _build_gallery_out(db: AsyncSession, marina: Marina) -> LandingGalleryOut:

    await gallery.sync_filesystem_to_db(db, marina)

    default_url = default_public_url()

    rows = await gallery.list_active_rows(db, marina.id)

    total = len(rows)

    hero_label, hero_title = gallery.hero_for_marina(marina)



    if rows:

        slides = [

            LandingGallerySlideOut(

                id=str(row.id),

                url=row.public_url,

                alt_text=row.alt_text,

            )

            for row in rows

        ]

        return LandingGalleryOut(

            slides=slides,

            default_url=default_url,

            using_fallback=False,

            total_count=total,

            hero_label=hero_label,

            hero_title=hero_title,

        )



    slides = [LandingGallerySlideOut(id=None, url=default_url, alt_text=None)]

    return LandingGalleryOut(

        slides=slides,

        default_url=default_url,

        using_fallback=True,

        total_count=0,

        hero_label=hero_label,

        hero_title=hero_title,

    )





def _ensure_marina_access(staff: StaffUser, marina: Marina) -> None:

    if marina.id != staff.marina_id:

        raise HTTPException(status_code=403, detail="Marina mismatch")





@public_router.get("", response_model=LandingGalleryOut)

async def get_landing_gallery(

    marina: Marina = Depends(get_current_marina),

    db: AsyncSession = Depends(get_db),

) -> LandingGalleryOut:

    return await _build_gallery_out(db, marina)





@public_router.get("/default")

async def get_default_landing_image() -> FileResponse:

    path = default_image_path()

    if not path.exists():

        raise HTTPException(status_code=404, detail="Default image not found")

    return FileResponse(path, media_type="image/webp")





@public_router.get("/files/{marina_slug}/{filename}")

async def get_landing_gallery_file(marina_slug: str, filename: str) -> FileResponse:

    path = resolve_file_path(marina_slug, filename)

    media_type = MEDIA_TYPES.get(path.suffix.lower(), "application/octet-stream")

    return FileResponse(path, media_type=media_type)





@manager_router.get("", response_model=LandingGalleryManageOut)

async def list_landing_gallery(

    staff: StaffUser = Depends(get_manager_or_admin),

    marina: Marina = Depends(get_current_marina),

    db: AsyncSession = Depends(get_db),

) -> LandingGalleryManageOut:

    _ensure_marina_access(staff, marina)

    await gallery.sync_filesystem_to_db(db, marina)

    rows = await gallery.list_active_rows(db, marina.id)

    return LandingGalleryManageOut(

        images=[_row_to_out(row) for row in rows],

        stats=await _stats_out(db, marina),

        hero=_hero_out(marina),

    )





@manager_router.post("/hero", response_model=LandingHeroOut)

@manager_router.patch("/hero", response_model=LandingHeroOut)

async def update_landing_hero(

    body: LandingHeroUpdateIn,

    staff: StaffUser = Depends(get_admin),

    marina: Marina = Depends(get_current_marina),

    db: AsyncSession = Depends(get_db),

) -> LandingHeroOut:

    _ensure_marina_access(staff, marina)

    label, title = await gallery.update_hero(

        db,

        marina,

        label=body.label,

        title=body.title,

    )

    return LandingHeroOut(label=label, title=title)





@manager_router.post("/upload", response_model=LandingGalleryImageOut, status_code=201)

async def upload_landing_image(

    file: UploadFile = File(...),

    staff: StaffUser = Depends(get_admin),

    marina: Marina = Depends(get_current_marina),

    db: AsyncSession = Depends(get_db),

) -> LandingGalleryImageOut:

    _ensure_marina_access(staff, marina)



    ext = Path(file.filename or "photo.jpg").suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:

        raise HTTPException(status_code=400, detail="Unsupported image type")



    content = await file.read()

    if len(content) > MAX_UPLOAD_BYTES:

        raise HTTPException(status_code=400, detail="Image must be 10 MB or smaller")



    row = await gallery.save_upload(db, marina, file.filename or "photo.jpg", content)

    return _row_to_out(row)





@manager_router.post("/reorder", response_model=list[LandingGalleryImageOut])

async def reorder_landing_gallery(

    body: LandingGalleryReorderIn,

    staff: StaffUser = Depends(get_admin),

    marina: Marina = Depends(get_current_marina),

    db: AsyncSession = Depends(get_db),

) -> list[LandingGalleryImageOut]:

    _ensure_marina_access(staff, marina)

    rows = await gallery.reorder_images(db, marina, body.filenames)

    return [_row_to_out(row) for row in rows]





@manager_router.delete("/files/{filename}", status_code=204)

async def delete_landing_image(

    filename: str,

    staff: StaffUser = Depends(get_admin),

    marina: Marina = Depends(get_current_marina),

    db: AsyncSession = Depends(get_db),

) -> None:

    _ensure_marina_access(staff, marina)

    await gallery.delete_image(db, marina, filename)


