"""Seed sample labor codes for the default marina. Usage: python -m scripts.seed_labor_codes"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from decimal import Decimal
from sqlalchemy import select

from marina_service.database import async_session_factory
from marina_service.models.enums import RateType
from marina_service.models.labor_code import LaborCode
from marina_service.services.marina_context import ensure_marina

SAMPLE_CODES = [
    {
        "labor_code": "OIL-100",
        "job_first_line": "Engine oil & filter change",
        "job_category": "Engine",
        "rate_type": RateType.HOURLY,
        "estimate_labor_time": Decimal("1.5"),
        "hourly_rate": Decimal("125.00"),
    },
    {
        "labor_code": "WTR-200",
        "job_first_line": "Winterization — engine",
        "job_category": "Winterization",
        "rate_type": RateType.FLAT,
        "estimate_labor_list": Decimal("350.00"),
    },
]


async def main() -> None:
    async with async_session_factory() as db:
        marina = await ensure_marina(db)
        created = 0
        for row in SAMPLE_CODES:
            code = row["labor_code"]
            existing = (
                await db.execute(
                    select(LaborCode).where(
                        LaborCode.marina_id == marina.id,
                        LaborCode.labor_code == code,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                continue
            db.add(LaborCode(marina_id=marina.id, is_active=True, **row))
            created += 1
        await db.commit()
        print(f"Seeded {created} labor code(s) for marina {marina.slug}")


if __name__ == "__main__":
    asyncio.run(main())
