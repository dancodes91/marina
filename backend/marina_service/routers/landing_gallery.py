from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from marina_service.auth.deps import get_admin, get_current_marina, get_manager_or_admin
from marina_service.models.marina import Marina
from marina_service.models.staff_user import StaffUser
from marina_service.schemas.landing_gallery import (
    LandingGalleryImageOut,
    LandingGalleryOut,
    LandingGalleryReorderIn,
    LandingGallerySlideOut,
)
from marina_service.services.landing_gallery_storage import (
    ALLOWED_EXTENSIONS,
    default_image_path,
    default_public_url,
    delete_gallery_file,
    list_gallery_files,
    public_file_url,
    reorder_gallery_files,
    resolve_file_path,
    save_gallery_file,
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


def _to_image_out(marina_slug: str, item) -> LandingGalleryImageOut:
    return LandingGalleryImageOut(
        filename=item.filename,
        url=public_file_url(marina_slug, item.filename),
        alt_text=item.alt_text,
        sort_order=item.sort_order,
    )


def _build_gallery_out(marina: Marina) -> LandingGalleryOut:
    default_url = default_public_url()
    files = list_gallery_files(marina.slug)

    if files:
        slides = [
            LandingGallerySlideOut(
                id=item.filename,
                url=public_file_url(marina.slug, item.filename),
                alt_text=item.alt_text,
            )
            for item in files
        ]
        return LandingGalleryOut(slides=slides, default_url=default_url, using_fallback=False)

    slides = [LandingGallerySlideOut(id=None, url=default_url, alt_text=None)]
    return LandingGalleryOut(slides=slides, default_url=default_url, using_fallback=True)


@public_router.get("", response_model=LandingGalleryOut)
async def get_landing_gallery(
    marina: Marina = Depends(get_current_marina),
) -> LandingGalleryOut:
    return _build_gallery_out(marina)


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


@manager_router.get("", response_model=list[LandingGalleryImageOut])
async def list_landing_gallery(
    staff: StaffUser = Depends(get_manager_or_admin),
    marina: Marina = Depends(get_current_marina),
) -> list[LandingGalleryImageOut]:
    if marina.id != staff.marina_id:
        raise HTTPException(status_code=403, detail="Marina mismatch")
    return [_to_image_out(marina.slug, item) for item in list_gallery_files(marina.slug)]


@manager_router.post("/upload", response_model=LandingGalleryImageOut, status_code=201)
async def upload_landing_image(
    file: UploadFile = File(...),
    staff: StaffUser = Depends(get_admin),
    marina: Marina = Depends(get_current_marina),
) -> LandingGalleryImageOut:
    if marina.id != staff.marina_id:
        raise HTTPException(status_code=403, detail="Marina mismatch")

    ext = Path(file.filename or "photo.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 10 MB or smaller")

    saved = save_gallery_file(marina.slug, file.filename or "photo.jpg", content)
    return _to_image_out(marina.slug, saved)


@manager_router.post("/reorder", response_model=list[LandingGalleryImageOut])
async def reorder_landing_gallery(
    body: LandingGalleryReorderIn,
    staff: StaffUser = Depends(get_admin),
    marina: Marina = Depends(get_current_marina),
) -> list[LandingGalleryImageOut]:
    if marina.id != staff.marina_id:
        raise HTTPException(status_code=403, detail="Marina mismatch")
    items = reorder_gallery_files(marina.slug, body.filenames)
    return [_to_image_out(marina.slug, item) for item in items]


@manager_router.delete("/{filename}", status_code=204)
async def delete_landing_image(
    filename: str,
    staff: StaffUser = Depends(get_admin),
    marina: Marina = Depends(get_current_marina),
) -> None:
    if marina.id != staff.marina_id:
        raise HTTPException(status_code=403, detail="Marina mismatch")
    delete_gallery_file(marina.slug, filename)
