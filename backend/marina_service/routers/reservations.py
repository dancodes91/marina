from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import (
    get_current_customer,
    get_current_marina,
    get_manager_or_admin,
    get_optional_customer,
)
from marina_service.database import get_db
from marina_service.models.boat import Boat
from marina_service.models.customer import Customer
from marina_service.models.enums import ReservationStatus
from marina_service.models.marina import Marina, MarinaAvailability
from marina_service.models.reservation import Reservation
from marina_service.models.staff_user import StaffUser
from marina_service.schemas.reservations import (
    AvailabilitySlipOut,
    AvailabilityStorageOut,
    ReservationCreate,
    ReservationManagerPatch,
    ReservationOut,
)
from marina_service.services.reservation_numbers import next_reservation_number

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.get("/availability/slips", response_model=list[AvailabilitySlipOut])
async def availability_slips(
    marina: Marina = Depends(get_current_marina),
    db: AsyncSession = Depends(get_db),
) -> list[AvailabilitySlipOut]:
    r = await db.execute(select(MarinaAvailability).where(MarinaAvailability.marina_id == marina.id))
    row = r.scalar_one_or_none()
    if not row or not row.slips:
        return []
    return [AvailabilitySlipOut(**s) for s in row.slips]


@router.get("/availability/storage", response_model=list[AvailabilityStorageOut])
async def availability_storage(
    marina: Marina = Depends(get_current_marina),
    db: AsyncSession = Depends(get_db),
) -> list[AvailabilityStorageOut]:
    r = await db.execute(select(MarinaAvailability).where(MarinaAvailability.marina_id == marina.id))
    row = r.scalar_one_or_none()
    if not row or not row.storage:
        return []
    return [AvailabilityStorageOut(**s) for s in row.storage]


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    body: ReservationCreate,
    marina: Marina = Depends(get_current_marina),
    db: AsyncSession = Depends(get_db),
    customer: Customer | None = Depends(get_optional_customer),
) -> Reservation:
    cust = customer
    boat_id = body.boat_id

    if not cust:
        if not body.guest_email or not body.guest_first_name or not body.guest_last_name:
            raise HTTPException(status_code=401, detail="Authentication or guest info required")
        email = body.guest_email.strip().lower()
        r = await db.execute(
            select(Customer).where(Customer.marina_id == marina.id, Customer.email == email)
        )
        cust = r.scalar_one_or_none()
        if not cust:
            cust = Customer(
                marina_id=marina.id,
                email=email,
                first_name=body.guest_first_name,
                last_name=body.guest_last_name,
                phone=body.guest_phone,
                account_claimed=False,
                is_active=True,
            )
            db.add(cust)
            await db.flush()
        if body.guest_boat_make or body.guest_boat_model:
            boat = Boat(
                marina_id=marina.id,
                customer_id=cust.id,
                make=body.guest_boat_make,
                model=body.guest_boat_model,
                year=body.guest_boat_year,
                photos=[],
            )
            db.add(boat)
            await db.flush()
            boat_id = boat.id

    if boat_id:
        boat = await db.get(Boat, boat_id)
        if not boat or boat.customer_id != cust.id or boat.marina_id != marina.id:
            raise HTTPException(status_code=400, detail="Invalid boat")

    num = await next_reservation_number(db)
    reservation = Reservation(
        request_number=num,
        marina_id=marina.id,
        customer_id=cust.id,
        boat_id=boat_id,
        reservation_type=body.reservation_type,
        requested_slip_size=body.requested_slip_size,
        start_date=body.start_date,
        end_date=body.end_date,
        status=ReservationStatus.PENDING,
        notes=body.notes,
    )
    db.add(reservation)
    await db.flush()
    return reservation


@router.get("", response_model=list[ReservationOut])
async def list_reservations(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
) -> list[Reservation]:
    r = await db.execute(
        select(Reservation)
        .where(Reservation.customer_id == customer.id, Reservation.marina_id == customer.marina_id)
        .order_by(Reservation.created_at.desc())
    )
    return list(r.scalars().all())


@router.get("/manager", response_model=list[ReservationOut])
async def list_manager_reservations(
    status_filter: ReservationStatus | None = Query(None, alias="status"),
    staff: StaffUser = Depends(get_manager_or_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Reservation]:
    q = (
        select(Reservation)
        .where(Reservation.marina_id == staff.marina_id)
        .order_by(Reservation.created_at.desc())
    )
    if status_filter:
        q = q.where(Reservation.status == status_filter)
    r = await db.execute(q)
    return list(r.scalars().all())


@router.patch("/manager/{reservation_id}", response_model=ReservationOut)
async def patch_manager_reservation(
    reservation_id: UUID,
    body: ReservationManagerPatch,
    staff: StaffUser = Depends(get_manager_or_admin),
    db: AsyncSession = Depends(get_db),
) -> Reservation:
    reservation = await db.get(Reservation, reservation_id)
    if not reservation or reservation.marina_id != staff.marina_id:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(reservation, k, v)
    return reservation
