from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import get_current_customer
from marina_service.database import get_db
from marina_service.models.boat import Boat
from marina_service.models.customer import Customer
from marina_service.models.enums import RequestStatus
from marina_service.models.service_request import RequestStatusEvent, ServiceRequest
from marina_service.schemas.requests import (
    AttachmentPresignIn,
    ServiceRequestCreate,
    ServiceRequestCustomerDetail,
    ServiceRequestSummary,
    TimelineEventOut,
)
from marina_service.schemas.boats import PresignUploadOut
from marina_service.services.request_numbers import next_request_number
from marina_service.services.storage import new_attachment_key, presigned_put_url, public_object_url
from marina_service.tasks.notification_tasks import notify_request_status_changed

router = APIRouter(prefix="/requests", tags=["requests"])


async def _append_event(db: AsyncSession, request_id: UUID, st: RequestStatus, note: str | None = None) -> None:
    db.add(RequestStatusEvent(request_id=request_id, status=st, note=note))


@router.get("", response_model=list[ServiceRequestSummary])
async def list_requests(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> list[ServiceRequest]:
    r = await db.execute(
        select(ServiceRequest).where(ServiceRequest.customer_id == customer.id).order_by(ServiceRequest.created_at.desc())
    )
    return list(r.scalars().all())


@router.post("", response_model=ServiceRequestCustomerDetail, status_code=status.HTTP_201_CREATED)
async def create_request(
    body: ServiceRequestCreate,
    background_tasks: BackgroundTasks,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequest:
    boat = await db.get(Boat, body.boat_id)
    if not boat or boat.customer_id != customer.id or boat.marina_id != customer.marina_id:
        raise HTTPException(status_code=400, detail="Invalid boat")
    num = await next_request_number(db)
    req = ServiceRequest(
        marina_id=customer.marina_id,
        request_number=num,
        customer_id=customer.id,
        boat_id=body.boat_id,
        form_type=body.form_type,
        status=RequestStatus.SUBMITTED,
        category=body.category,
        description=body.description,
        custom_description=body.custom_description,
        job_selections=body.job_selections or [],
        customer_notes=body.customer_notes,
        preferred_date=body.preferred_date,
        preferred_time_slot=body.preferred_time_slot,
        attachments=[],
    )
    db.add(req)
    await db.flush()
    await _append_event(db, req.id, RequestStatus.SUBMITTED)
    rid = req.id

    def _notify() -> None:
        notify_request_status_changed.delay(str(rid), RequestStatus.SUBMITTED.value)

    background_tasks.add_task(_notify)
    return req


@router.get("/{request_id}", response_model=ServiceRequestCustomerDetail)
async def get_request(
    request_id: UUID,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> ServiceRequest:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.customer_id != customer.id or req.marina_id != customer.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    return req


@router.post("/{request_id}/attachments", response_model=PresignUploadOut)
async def presign_attachment(
    request_id: UUID,
    body: AttachmentPresignIn,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> PresignUploadOut:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.customer_id != customer.id or req.marina_id != customer.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    key = new_attachment_key(f"requests/{request_id}", body.filename)
    url = presigned_put_url(key, body.content_type)
    att = list(req.attachments or [])
    att.append(public_object_url(key))
    req.attachments = att
    return PresignUploadOut(upload_url=url, key=key, public_url=public_object_url(key))


@router.post("/{request_id}/cancel")
async def cancel_request(
    request_id: UUID,
    background_tasks: BackgroundTasks,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> dict:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.customer_id != customer.id or req.marina_id != customer.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status not in (RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW):
        raise HTTPException(status_code=400, detail="Cannot cancel this request")
    req.status = RequestStatus.CANCELLED
    await _append_event(db, req.id, RequestStatus.CANCELLED)
    rid = req.id

    def _notify() -> None:
        notify_request_status_changed.delay(str(rid), RequestStatus.CANCELLED.value)

    background_tasks.add_task(_notify)
    return {"ok": True}


@router.get("/{request_id}/timeline", response_model=list[TimelineEventOut])
async def timeline(
    request_id: UUID,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> list[RequestStatusEvent]:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.customer_id != customer.id or req.marina_id != customer.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    r = await db.execute(
        select(RequestStatusEvent)
        .where(RequestStatusEvent.request_id == request_id)
        .order_by(RequestStatusEvent.created_at.asc())
    )
    return list(r.scalars().all())
