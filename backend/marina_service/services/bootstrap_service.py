"""Database migrations and test-user seeding."""

from __future__ import annotations

import asyncio
import html
import json
import os
import uuid
from pathlib import Path
from typing import Literal

from alembic import command
from alembic.config import Config
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.password import hash_password
from marina_service.config import get_settings
from marina_service.database import get_db
from marina_service.models.boat import Boat
from marina_service.models.customer import Customer
from marina_service.models.enums import UserRole
from marina_service.models.staff_user import StaffUser
from marina_service.services.marina_context import ensure_marina

_BACKEND_ROOT = Path(__file__).resolve().parents[2]

setup_router = APIRouter(prefix="/setup", tags=["setup"])


class UserSeedResult(BaseModel):
    email: str | None = None
    status: Literal["created", "already_exists", "skipped"]
    detail: str | None = None


class BootstrapResult(BaseModel):
    ok: bool
    migrations: Literal["applied", "failed", "skipped"]
    migration_detail: str | None = None
    admin: UserSeedResult
    customer: UserSeedResult


async def ensure_admin_user(
    db: AsyncSession,
    email: str,
    password: str,
    marina_id: uuid.UUID,
    *,
    first_name: str = "Admin",
    last_name: str = "User",
) -> bool:
    """Create admin if missing. Returns True when a new user was created."""
    email = email.strip().lower()
    r = await db.execute(
        select(StaffUser).where(StaffUser.marina_id == marina_id, StaffUser.email == email)
    )
    if r.scalar_one_or_none():
        return False
    db.add(
        StaffUser(
            marina_id=marina_id,
            email=email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            role=UserRole.ADMIN.value,
            is_active=True,
        )
    )
    await db.commit()
    return True


async def ensure_test_customer(
    db: AsyncSession,
    email: str,
    password: str,
    marina_id: uuid.UUID,
    *,
    first_name: str = "Test",
    last_name: str = "Customer",
    boat_make: str = "Sea Ray",
    boat_model: str = "Sundancer",
    boat_year: int = 2020,
) -> bool:
    """Create a claimed customer (and one boat) if missing. Returns True when created."""
    email = email.strip().lower()
    r = await db.execute(
        select(Customer).where(Customer.marina_id == marina_id, Customer.email == email)
    )
    if r.scalar_one_or_none():
        return False

    customer = Customer(
        marina_id=marina_id,
        email=email,
        password_hash=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        account_claimed=True,
        is_active=True,
    )
    db.add(customer)
    await db.flush()
    db.add(
        Boat(
            marina_id=marina_id,
            customer_id=customer.id,
            make=boat_make,
            model=boat_model,
            year=boat_year,
            photos=[],
        )
    )
    await db.commit()
    return True


def _run_alembic_upgrade() -> None:
    settings = get_settings()
    cfg = Config(str(_BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", settings.database_url_sync)
    command.upgrade(cfg, "head")


async def run_migrations() -> tuple[Literal["applied", "failed"], str | None]:
    try:
        await asyncio.to_thread(_run_alembic_upgrade)
        return "applied", None
    except Exception as exc:  # noqa: BLE001 — surface migration errors to caller
        return "failed", str(exc)


async def seed_test_users(db: AsyncSession, marina_id: uuid.UUID) -> tuple[UserSeedResult, UserSeedResult]:
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if admin_email and admin_password:
        if await ensure_admin_user(db, admin_email, admin_password, marina_id):
            admin = UserSeedResult(email=admin_email, status="created")
        else:
            admin = UserSeedResult(email=admin_email, status="already_exists")
    else:
        admin = UserSeedResult(
            status="skipped",
            detail="Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.",
        )

    customer_email = os.environ.get("TEST_CUSTOMER_EMAIL", "").strip()
    customer_password = os.environ.get("TEST_CUSTOMER_PASSWORD", "")
    if customer_email and customer_password:
        created = await ensure_test_customer(
            db,
            customer_email,
            customer_password,
            marina_id,
            first_name=os.environ.get("TEST_CUSTOMER_FIRST_NAME", "Test"),
            last_name=os.environ.get("TEST_CUSTOMER_LAST_NAME", "Customer"),
            boat_make=os.environ.get("TEST_CUSTOMER_BOAT_MAKE", "Sea Ray"),
            boat_model=os.environ.get("TEST_CUSTOMER_BOAT_MODEL", "Sundancer"),
            boat_year=int(os.environ.get("TEST_CUSTOMER_BOAT_YEAR", "2020")),
        )
        customer = UserSeedResult(
            email=customer_email,
            status="created" if created else "already_exists",
        )
    else:
        customer = UserSeedResult(
            status="skipped",
            detail="Set TEST_CUSTOMER_EMAIL and TEST_CUSTOMER_PASSWORD environment variables.",
        )

    return admin, customer


async def run_bootstrap(
    db: AsyncSession,
    *,
    run_db_migrations: bool = True,
) -> BootstrapResult:
    migration_status: Literal["applied", "failed", "skipped"] = "skipped"
    migration_detail: str | None = None

    if run_db_migrations:
        migration_status, migration_detail = await run_migrations()
        if migration_status == "failed":
            return BootstrapResult(
                ok=False,
                migrations=migration_status,
                migration_detail=migration_detail,
                admin=UserSeedResult(status="skipped", detail="Migrations failed."),
                customer=UserSeedResult(status="skipped", detail="Migrations failed."),
            )

    marina = await ensure_marina(db)
    admin, customer = await seed_test_users(db, marina.id)
    return BootstrapResult(
        ok=True,
        migrations=migration_status,
        migration_detail=migration_detail,
        admin=admin,
        customer=customer,
    )


def _verify_bootstrap_key(key: str | None, header_key: str | None) -> None:
    settings = get_settings()
    if not settings.bootstrap_api_key:
        raise HTTPException(status_code=503, detail="Bootstrap endpoint not configured")
    provided = key or header_key
    if not provided or provided != settings.bootstrap_api_key:
        raise HTTPException(status_code=401, detail="Invalid bootstrap key")


def _render_bootstrap_html(result: BootstrapResult) -> str:
    payload = html.escape(json.dumps(result.model_dump(), indent=2))
    status = "Bootstrap complete" if result.ok else "Bootstrap failed"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{status}</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; }}
    h1 {{ font-size: 1.25rem; }}
    pre {{ background: #f4f4f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }}
  </style>
</head>
<body>
  <h1>{status}</h1>
  <pre>{payload}</pre>
</body>
</html>"""


@setup_router.get("/bootstrap", response_model=None)
async def bootstrap_setup(
    request: Request,
    key: str | None = Query(default=None, description="Bootstrap API key"),
    format: str | None = Query(default=None, alias="format"),
    db: AsyncSession = Depends(get_db),
    x_bootstrap_key: str | None = Header(default=None, alias="X-Bootstrap-Key"),
) -> Response:
    """Run Alembic migrations and seed test users from environment variables."""
    _verify_bootstrap_key(key, x_bootstrap_key)
    result = await run_bootstrap(db)

    wants_html = format == "html" or "text/html" in request.headers.get("accept", "")
    if wants_html:
        status_code = 200 if result.ok else 500
        return HTMLResponse(content=_render_bootstrap_html(result), status_code=status_code)

    return JSONResponse(content=result.model_dump(), status_code=200 if result.ok else 500)
