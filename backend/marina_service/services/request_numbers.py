from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.models.service_request import ServiceRequest


async def next_request_number(db: AsyncSession) -> str:
    year = datetime.now().year
    prefix = f"SR-{year}-"
    r = await db.execute(
        select(func.count()).select_from(ServiceRequest).where(ServiceRequest.request_number.like(f"{prefix}%"))
    )
    n = (r.scalar_one() or 0) + 1
    return f"{prefix}{n:05d}"
