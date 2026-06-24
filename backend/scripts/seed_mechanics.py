"""Seed sample mechanics for the default marina. Usage: python -m scripts.seed_mechanics"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select

from marina_service.database import async_session_factory
from marina_service.models.mechanic import Mechanic
from marina_service.services.marina_context import ensure_marina

SAMPLE_MECHANICS = [
    {"wallace_mechanic_code": "M01", "name": "Alex Rivera"},
    {"wallace_mechanic_code": "M02", "name": "Jordan Lee"},
]


async def main() -> None:
    async with async_session_factory() as db:
        marina = await ensure_marina(db)
        created = 0
        for row in SAMPLE_MECHANICS:
            existing = (
                await db.execute(
                    select(Mechanic).where(
                        Mechanic.marina_id == marina.id,
                        Mechanic.name == row["name"],
                    )
                )
            ).scalar_one_or_none()
            if existing:
                continue
            db.add(Mechanic(marina_id=marina.id, is_active=True, **row))
            created += 1
        await db.commit()
        print(f"Seeded {created} mechanic(s) for marina {marina.slug}")


if __name__ == "__main__":
    asyncio.run(main())
