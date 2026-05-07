from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import get_current_customer
from marina_service.database import get_db
from marina_service.models.boat import Boat
from marina_service.models.customer import Customer
from marina_service.schemas.boats import BoatCustomerPatch, BoatOut, BoatPhotoPresignIn, PresignUploadOut
from marina_service.services.storage import new_attachment_key, presigned_put_url, public_object_url

router = APIRouter(prefix="/boats", tags=["boats"])


@router.get("", response_model=list[BoatOut])
async def list_boats(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> list[Boat]:
    r = await db.execute(select(Boat).where(Boat.customer_id == customer.id))
    return list(r.scalars().all())


@router.get("/{boat_id}", response_model=BoatOut)
async def get_boat(
    boat_id: UUID,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> Boat:
    boat = await db.get(Boat, boat_id)
    if not boat or boat.customer_id != customer.id:
        raise HTTPException(status_code=404, detail="Not found")
    return boat


@router.patch("/{boat_id}", response_model=BoatOut)
async def patch_boat(
    boat_id: UUID,
    body: BoatCustomerPatch,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> Boat:
    boat = await db.get(Boat, boat_id)
    if not boat or boat.customer_id != customer.id:
        raise HTTPException(status_code=404, detail="Not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(boat, k, v)
    return boat


@router.post("/{boat_id}/photos", response_model=PresignUploadOut)
async def upload_boat_photo(
    boat_id: UUID,
    body: BoatPhotoPresignIn,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> PresignUploadOut:
    boat = await db.get(Boat, boat_id)
    if not boat or boat.customer_id != customer.id:
        raise HTTPException(status_code=404, detail="Not found")
    key = new_attachment_key(f"boats/{boat_id}", body.filename)
    url = presigned_put_url(key, body.content_type)
    photos = list(boat.photos or [])
    photos.append(public_object_url(key))
    boat.photos = photos
    return PresignUploadOut(upload_url=url, key=key, public_url=public_object_url(key))
