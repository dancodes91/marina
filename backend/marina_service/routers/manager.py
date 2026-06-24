from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import get_manager_or_admin
from marina_service.database import get_db
from marina_service.models.enums import RequestStatus
from marina_service.models.labor_code import LaborCode
from marina_service.models.request_labor_line import RequestLaborLine
from marina_service.models.service_request import RequestStatusEvent, ServiceRequest
from marina_service.models.staff_user import StaffUser
from marina_service.schemas.labor import (
    EstimateOut,
    LaborLineCreate,
    LaborLineOut,
    LaborLinePatch,
)
from marina_service.schemas.requests import (
    ManagerRequestPatch,
    ServiceRequestManagerDetail,
    StatusPatch,
    TimelineEventOut,
)
from marina_service.services.request_totals import recalculate_request_totals
from marina_service.tasks.notification_tasks import notify_request_status_changed

router = APIRouter(prefix="/manager", tags=["manager"])


async def _append_event(db: AsyncSession, request_id: UUID, st: RequestStatus, note: str | None = None) -> None:
    db.add(RequestStatusEvent(request_id=request_id, status=st, note=note))


@router.get("/requests/{request_id}", response_model=ServiceRequestManagerDetail)
async def get_manager_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> ServiceRequest:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    return req


@router.get("/requests", response_model=list[ServiceRequestManagerDetail])
async def list_manager_requests(
    status_filter: RequestStatus | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> list[ServiceRequest]:
    q = (
        select(ServiceRequest)
        .where(ServiceRequest.marina_id == staff.marina_id)
        .order_by(ServiceRequest.created_at.desc())
    )
    if status_filter:
        q = q.where(ServiceRequest.status == status_filter)
    r = await db.execute(q)
    return list(r.scalars().all())


@router.patch("/requests/{request_id}/status", response_model=ServiceRequestManagerDetail)
async def patch_status(
    request_id: UUID,
    body: StatusPatch,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> ServiceRequest:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    req.status = body.status
    await _append_event(db, req.id, body.status)
    rid = req.id
    st_val = body.status.value
    def _notify() -> None:
        notify_request_status_changed.delay(str(rid), st_val)

    background_tasks.add_task(_notify)
    return req


@router.patch("/requests/{request_id}", response_model=ServiceRequestManagerDetail)
async def patch_request(
    request_id: UUID,
    body: ManagerRequestPatch,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> ServiceRequest:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(req, k, v)
    return req


@router.get("/requests/{request_id}/timeline", response_model=list[TimelineEventOut])
async def manager_timeline(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> list[RequestStatusEvent]:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    r = await db.execute(
        select(RequestStatusEvent)
        .where(RequestStatusEvent.request_id == request_id)
        .order_by(RequestStatusEvent.created_at.asc())
    )
    return list(r.scalars().all())


@router.get("/requests/{request_id}/labor", response_model=list[LaborLineOut])
async def list_labor(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> list[RequestLaborLine]:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    r = await db.execute(
        select(RequestLaborLine).where(RequestLaborLine.request_id == request_id).order_by(RequestLaborLine.line_number)
    )
    return list(r.scalars().all())


@router.post("/requests/{request_id}/labor", response_model=LaborLineOut, status_code=201)
async def add_labor(
    request_id: UUID,
    body: LaborLineCreate,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> RequestLaborLine:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    code = await db.get(LaborCode, body.labor_code_id)
    if not code or code.marina_id != staff.marina_id:
        raise HTTPException(status_code=400, detail="Invalid labor code")
    existing = (
        await db.execute(select(RequestLaborLine).where(RequestLaborLine.request_id == request_id))
    ).scalars().all()
    next_ln = body.line_number if body.line_number is not None else (max((x.line_number for x in existing), default=0) + 1)
    line = RequestLaborLine(
        request_id=request_id,
        labor_code_id=body.labor_code_id,
        line_number=next_ln,
        mechanic_id=body.mechanic_id,
        estimate_hours=body.estimate_hours,
        actual_time_worked=body.actual_time_worked,
        charge_time=body.charge_time,
        hourly_rate_override=body.hourly_rate_override,
        flat_rate_override=body.flat_rate_override,
        taxable_override=body.taxable_override,
        manager_notes=body.manager_notes,
    )
    db.add(line)
    await db.flush()
    await recalculate_request_totals(db, request_id)
    return line


@router.patch("/requests/{request_id}/labor/{line_id}", response_model=LaborLineOut)
async def patch_labor(
    request_id: UUID,
    line_id: UUID,
    body: LaborLinePatch,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> RequestLaborLine:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    line = await db.get(RequestLaborLine, line_id)
    if not line or line.request_id != request_id:
        raise HTTPException(status_code=404, detail="Not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(line, k, v)
    await recalculate_request_totals(db, request_id)
    return line


@router.delete("/requests/{request_id}/labor/{line_id}")
async def delete_labor(
    request_id: UUID,
    line_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> dict:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    line = await db.get(RequestLaborLine, line_id)
    if not line or line.request_id != request_id:
        raise HTTPException(status_code=404, detail="Not found")
    await db.execute(delete(RequestLaborLine).where(RequestLaborLine.id == line_id))
    await recalculate_request_totals(db, request_id)
    return {"ok": True}


@router.post("/requests/{request_id}/labor/{line_id}/job-done", response_model=LaborLineOut)
async def job_done(
    request_id: UUID,
    line_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> RequestLaborLine:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    line = await db.get(RequestLaborLine, line_id)
    if not line or line.request_id != request_id:
        raise HTTPException(status_code=404, detail="Not found")
    line.job_done = True
    await recalculate_request_totals(db, request_id)
    return line


@router.get("/requests/{request_id}/estimate", response_model=EstimateOut)
async def estimate(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> EstimateOut:
    req = await db.get(ServiceRequest, request_id)
    if not req or req.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    r = await db.execute(
        select(RequestLaborLine).where(RequestLaborLine.request_id == request_id).order_by(RequestLaborLine.line_number)
    )
    lines = list(r.scalars().all())
    return EstimateOut(
        total_estimate_list=req.total_estimate_list,
        total_estimate_cost=req.total_estimate_cost,
        lines=lines,
    )
