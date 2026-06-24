"""Idempotent test user seeding from environment variables (CLI)."""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from marina_service.database import async_session_factory
from marina_service.services.bootstrap_service import run_bootstrap


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


async def main() -> None:
    async with async_session_factory() as db:
        result = await run_bootstrap(db, run_db_migrations=False)
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())
