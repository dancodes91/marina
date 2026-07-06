from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import get_current_marina, get_manager_or_admin
from marina_service.database import get_db
from marina_service.models.marina import Marina
from marina_service.models.staff_user import StaffUser
from marina_service.schemas.marina_settings import (
    MarinaBrandingOut,
    MarinaSettingsOut,
    MarinaSettingsUpdateIn,
)
from marina_service.services.landing_gallery_service import hero_for_marina

router = APIRouter(prefix="/manager/settings", tags=["manager", "settings"])
public_router = APIRouter(prefix="/marina", tags=["marina"])


def _subtitle_for(marina: Marina) -> str:
    _, title = hero_for_marina(marina)
    return title


def _to_out(marina: Marina) -> MarinaSettingsOut:
    return MarinaSettingsOut(
        name=marina.name,
        slug=marina.slug,
        subtitle=_subtitle_for(marina),
        contact_email=marina.contact_email,
        contact_phone=marina.contact_phone,
        twilio_from_number=marina.twilio_from_number,
        sync_interval_mins=marina.sync_interval_mins,
    )


def _to_branding(marina: Marina) -> MarinaBrandingOut:
    _, title = hero_for_marina(marina)
    return MarinaBrandingOut(name=marina.name, subtitle=title, slug=marina.slug)


def _ensure_marina_access(staff: StaffUser, marina: Marina) -> None:
    if marina.id != staff.marina_id:
        raise HTTPException(status_code=403, detail="Marina mismatch")


def _apply_settings_update(marina: Marina, body: MarinaSettingsUpdateIn) -> None:
    old_name = marina.name.strip()
    old_label = (marina.landing_hero_label or "").strip()

    marina.name = body.name.strip()
    marina.landing_hero_title = body.subtitle.strip()
    marina.contact_email = body.contact_email
    marina.contact_phone = body.contact_phone.strip() if body.contact_phone else None
    marina.twilio_from_number = body.twilio_from_number.strip() if body.twilio_from_number else None
    marina.sync_interval_mins = body.sync_interval_mins

    if not old_label or old_label == old_name:
        marina.landing_hero_label = marina.name


@public_router.get("/branding", response_model=MarinaBrandingOut)
async def get_marina_branding(
    marina: Marina = Depends(get_current_marina),
) -> MarinaBrandingOut:
    return _to_branding(marina)


@router.get("", response_model=MarinaSettingsOut)
async def get_marina_settings(
    staff: StaffUser = Depends(get_manager_or_admin),
    marina: Marina = Depends(get_current_marina),
) -> MarinaSettingsOut:
    _ensure_marina_access(staff, marina)
    return _to_out(marina)


@router.post("", response_model=MarinaSettingsOut)
@router.patch("", response_model=MarinaSettingsOut)
async def update_marina_settings(
    body: MarinaSettingsUpdateIn,
    staff: StaffUser = Depends(get_manager_or_admin),
    marina: Marina = Depends(get_current_marina),
    db: AsyncSession = Depends(get_db),
) -> MarinaSettingsOut:
    _ensure_marina_access(staff, marina)
    _apply_settings_update(marina, body)
    await db.flush()
    return _to_out(marina)
