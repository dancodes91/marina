"""Generate a claim token for a customer email (dev/admin). Usage:
   set DATABASE_URL, then: python -m scripts.create_claim_token customer@example.com
"""

import asyncio
import os
import secrets
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta, timezone
from sqlalchemy import select

from marina_service.auth import jwt as jwt_util
from marina_service.database import async_session_factory
from marina_service.models.customer import Customer
from marina_service.models.tokens import ClaimToken


async def main(email: str) -> None:
    async with async_session_factory() as db:
        r = await db.execute(select(Customer).where(Customer.email == email.strip().lower()))
        cust = r.scalar_one_or_none()
        if not cust:
            print("Customer not found with email:", email)
            return
        raw = secrets.token_urlsafe(32)
        exp = datetime.now(timezone.utc) + timedelta(days=7)
        ct = ClaimToken(
            customer_id=cust.id,
            token_hash=jwt_util.hash_refresh_token(raw),
            expires_at=exp,
            used=False,
        )
        db.add(ct)
        await db.commit()
        print("Claim token (give to customer):", raw)
        print("Claim URL:", os.environ.get("PUBLIC_APP_URL", "http://localhost:3000") + "/claim")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.create_claim_token <email>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
