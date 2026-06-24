from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.models.reservation import Reservation


async def next_reservation_number(db: AsyncSession) -> str:
    year = datetime.now().year
    prefix = f"RS-{year}-"
    r = await db.execute(
        select(func.count()).select_from(Reservation).where(Reservation.request_number.like(f"{prefix}%"))
    )
    n = (r.scalar_one() or 0) + 1
    return f"{prefix}{n:05d}"
