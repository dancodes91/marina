"""Create or ensure admin staff user. Usage: python -m scripts.create_admin"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from marina_service.database import async_session_factory
from marina_service.services.bootstrap_service import ensure_admin_user
from marina_service.services.marina_context import ensure_marina


async def main() -> None:
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    password = os.environ.get("ADMIN_PASSWORD", "changeme123")
    async with async_session_factory() as db:
        marina = await ensure_marina(db)
        created = await ensure_admin_user(db, email, password, marina.id)
        if created:
            print("Created admin:", email)
        else:
            print("Admin already exists:", email)


if __name__ == "__main__":
    asyncio.run(main())
