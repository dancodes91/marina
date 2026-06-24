import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import get_admin, get_manager_or_admin
from marina_service.database import get_db
from marina_service.models.enums import RateType
from marina_service.models.labor_code import LaborCode
from marina_service.models.staff_user import StaffUser
from marina_service.schemas.labor import LaborCodeCreate, LaborCodeOut, LaborCodePatch

router = APIRouter(prefix="/labor-codes", tags=["labor-codes"])


@router.get("", response_model=list[LaborCodeOut])
async def list_labor_codes(
    q: str | None = Query(None, description="Search"),
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> list[LaborCode]:
    stmt = select(LaborCode).where(LaborCode.marina_id == staff.marina_id)
    if active_only:
        stmt = stmt.where(LaborCode.is_active.is_(True))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                LaborCode.labor_code.ilike(like),
                LaborCode.job_first_line.ilike(like),
                LaborCode.job_category.ilike(like),
            )
        )
    stmt = stmt.order_by(LaborCode.labor_code)
    r = await db.execute(stmt)
    return list(r.scalars().all())


@router.get("/{labor_id}", response_model=LaborCodeOut)
async def get_labor_code(
    labor_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_manager_or_admin),
) -> LaborCode:
    row = await db.get(LaborCode, labor_id)
    if not row or row.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.post("", response_model=LaborCodeOut, status_code=201)
async def create_labor_code(
    body: LaborCodeCreate,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_admin),
) -> LaborCode:
    row = LaborCode(marina_id=staff.marina_id, **body.model_dump())
    db.add(row)
    await db.flush()
    return row


@router.patch("/{labor_id}", response_model=LaborCodeOut)
async def patch_labor_code(
    labor_id: UUID,
    body: LaborCodePatch,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_admin),
) -> LaborCode:
    row = await db.get(LaborCode, labor_id)
    if not row or row.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    return row


@router.delete("/{labor_id}")
async def delete_labor_code(
    labor_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_admin),
) -> dict:
    row = await db.get(LaborCode, labor_id)
    if not row or row.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    row.is_active = False
    return {"ok": True}


@router.post("/import")
async def import_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    staff: StaffUser = Depends(get_admin),
) -> dict:
    raw = await file.read()
    text = raw.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    n = 0
    for row in reader:
        code = row.get("labor_code") or row.get("CODE")
        if not code:
            continue
        rt_raw = (row.get("rate_type") or row.get("RATE_TYPE") or "HOURLY").upper()
        try:
            rt = RateType(rt_raw)
        except ValueError:
            rt = RateType.HOURLY
        lc = LaborCode(
            marina_id=staff.marina_id,
            labor_code=str(code).strip(),
            job_first_line=row.get("job_first_line") or row.get("JOB_FIRST_LINE"),
            job_description=row.get("job_description"),
            job_category=row.get("job_category"),
            gl_bill_code=row.get("gl_bill_code"),
            rate_type=rt,
            estimate_labor_list=_dec(row.get("estimate_labor_list")),
            estimate_labor_cost=_dec(row.get("estimate_labor_cost")),
            estimate_labor_time=_dec(row.get("estimate_labor_time")),
            hourly_rate=_dec(row.get("hourly_rate")),
            is_active=True,
        )
        db.add(lc)
        n += 1
    return {"imported": n}


def _dec(v) -> object:
    if v is None or str(v).strip() == "":
        return None
    from decimal import Decimal

    return Decimal(str(v))
