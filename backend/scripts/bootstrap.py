"""Run migrations then seed test users. Usage: python -m scripts.bootstrap"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from marina_service.database import async_session_factory
from marina_service.services.bootstrap_service import run_bootstrap


async def main() -> None:
    async with async_session_factory() as db:
        result = await run_bootstrap(db)
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())
