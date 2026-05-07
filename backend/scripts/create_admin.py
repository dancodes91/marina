"""Create first admin staff user. Usage: python -m scripts.create_admin"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select

from marina_service.auth.password import hash_password
from marina_service.database import async_session_factory
from marina_service.models.enums import UserRole
from marina_service.models.staff_user import StaffUser


async def main() -> None:
    email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    password = os.environ.get("ADMIN_PASSWORD", "changeme123")
    async with async_session_factory() as db:
        r = await db.execute(select(StaffUser).where(StaffUser.email == email))
        if r.scalar_one_or_none():
            print("Admin already exists:", email)
            return
        u = StaffUser(
            email=email,
            password_hash=hash_password(password),
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        db.add(u)
        await db.commit()
        print("Created admin:", email)


if __name__ == "__main__":
    asyncio.run(main())
