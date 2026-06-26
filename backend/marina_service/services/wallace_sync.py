"""Read-only Wallace CSV import into PostgreSQL (sync engine).

Supports two deployment patterns:
- Folder scan import (WALLACE_EXPORT_DIR) for local/on-prem deployments.
- Single-file import from uploaded CSV bytes (cloud deployments, e.g. Wallace runs on a Windows desktop).
"""

from __future__ import annotations

import csv
import io
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from marina_service.config import get_settings
from marina_service.models.boat import Boat
from marina_service.models.customer import Customer
from marina_service.models.marina import Marina
from marina_service.models.mechanic import Mechanic
from marina_service.models.sync_log import SyncLogLine, SyncRun


def _norm_key(name: str) -> str:
    return name.strip().lower().replace(" ", "_").replace("/", "_")


def _split_name(full: str | None) -> tuple[str | None, str | None]:
    if not full or not str(full).strip():
        return None, None
    parts = str(full).strip().split(None, 1)
    if len(parts) == 1:
        return parts[0], None
    return parts[0], parts[1]


def _session_factory():
    settings = get_settings()
    engine = create_engine(settings.database_url_sync, pool_pre_ping=True)
    return sessionmaker(bind=engine)


def _get_default_marina_id(session: Session) -> uuid.UUID:
    """Return first active marina id, or create the default marina row."""
    settings = get_settings()
    marina = session.execute(
        select(Marina).where(Marina.slug == settings.default_marina_slug, Marina.is_active.is_(True))
    ).scalar_one_or_none()
    if marina:
        return marina.id
    marina = session.execute(
        select(Marina).where(Marina.is_active.is_(True)).order_by(Marina.created_at.asc())
    ).scalar_one_or_none()
    if marina:
        return marina.id
    marina = Marina(
        slug=settings.default_marina_slug,
        name=settings.default_marina_name,
        contact_email=settings.default_marina_contact_email,
        contact_phone=settings.default_marina_contact_phone,
        timezone="America/New_York",
        sync_interval_mins=15,
        is_active=True,
    )
    session.add(marina)
    session.flush()
    return marina.id


def run_sync() -> uuid.UUID:
    """Process all CSV files in WALLACE_EXPORT_DIR. Returns sync_run id."""
    settings = get_settings()
    export_dir = Path(settings.wallace_export_dir)
    SessionLocal = _session_factory()
    session = SessionLocal()
    marina_id = _get_default_marina_id(session)
    run = SyncRun(
        started_at=datetime.now(timezone.utc),
        source="wallace_csv",
        status="running",
    )
    session.add(run)
    session.commit()
    session.refresh(run)
    run_id = run.id

    def log_line(msg: str, level: str = "info") -> None:
        session.add(SyncLogLine(sync_run_id=run_id, level=level, message=msg))

    try:
        if not export_dir.is_dir():
            log_line(f"Export directory missing: {export_dir}", "warning")
            run = session.get(SyncRun, run_id)
            if run:
                run.status = "success"
                run.finished_at = datetime.now(timezone.utc)
                session.commit()
            return run_id

        files = sorted(export_dir.glob("*.csv"))
        run = session.get(SyncRun, run_id)
        if run:
            run.files_processed = len(files)
        for fp in files:
            if _is_mechanics_file(fp.name):
                n = _import_mechanics_csv_path(session, fp, marina_id)
                run = session.get(SyncRun, run_id)
                if run:
                    run.mechanics_upserted += n
                log_line(f"Imported mechanics from {fp.name}: {n} rows")
            else:
                c, b = _import_customers_boats_csv_path(session, fp, marina_id)
                run = session.get(SyncRun, run_id)
                if run:
                    run.customers_upserted += c
                    run.boats_upserted += b
                log_line(f"Imported customers/boats from {fp.name}: customers={c} boats={b}")

        run = session.get(SyncRun, run_id)
        if run:
            run.status = "success"
            run.finished_at = datetime.now(timezone.utc)
        session.commit()
        return run_id
    except Exception as e:
        session.rollback()
        run = session.get(SyncRun, run_id)
        if run:
            run.status = "failed"
            run.error_message = str(e)
            run.finished_at = datetime.now(timezone.utc)
            session.add(SyncLogLine(sync_run_id=run_id, level="error", message=str(e)))
            session.commit()
        raise
    finally:
        session.close()


def run_sync_single_csv(*, filename: str, content_bytes: bytes) -> uuid.UUID:
    """Import one Wallace export CSV (uploaded from a remote Wallace desktop). Returns sync_run id."""
    SessionLocal = _session_factory()
    session = SessionLocal()
    marina_id = _get_default_marina_id(session)
    run = SyncRun(
        started_at=datetime.now(timezone.utc),
        source="wallace_csv_upload",
        status="running",
        files_processed=1,
    )
    session.add(run)
    session.commit()
    session.refresh(run)
    run_id = run.id

    def log_line(msg: str, level: str = "info") -> None:
        session.add(SyncLogLine(sync_run_id=run_id, level=level, message=msg))

    try:
        stream = io.StringIO(content_bytes.decode("utf-8-sig", errors="replace"))
        if _is_mechanics_file(filename):
            n = _import_mechanics_csv_stream(session, stream, marina_id)
            run = session.get(SyncRun, run_id)
            if run:
                run.mechanics_upserted = (run.mechanics_upserted or 0) + n
            log_line(f"Imported mechanics from upload {filename}: {n} rows")
        else:
            c, b = _import_customers_boats_csv_stream(session, stream, marina_id)
            run = session.get(SyncRun, run_id)
            if run:
                run.customers_upserted = (run.customers_upserted or 0) + c
                run.boats_upserted = (run.boats_upserted or 0) + b
            log_line(f"Imported customers/boats from upload {filename}: customers={c} boats={b}")

        run = session.get(SyncRun, run_id)
        if run:
            run.status = "success"
            run.finished_at = datetime.now(timezone.utc)
        session.commit()
        return run_id
    except Exception as e:
        session.rollback()
        run = session.get(SyncRun, run_id)
        if run:
            run.status = "failed"
            run.error_message = str(e)
            run.finished_at = datetime.now(timezone.utc)
            session.add(SyncLogLine(sync_run_id=run_id, level="error", message=str(e)))
            session.commit()
        raise
    finally:
        session.close()


def _is_mechanics_file(filename: str) -> bool:
    return "mechanic" in filename.lower()


def _import_mechanics_csv_path(session: Session, path: Path, marina_id: uuid.UUID) -> int:
    with path.open(newline="", encoding="utf-8-sig") as f:
        return _import_mechanics_csv_stream(session, f, marina_id)


def _import_mechanics_csv_stream(session: Session, stream, marina_id: uuid.UUID) -> int:
    count = 0
    reader = csv.DictReader(stream)
    if not reader.fieldnames:
        return 0
    fields = {_norm_key(k): k for k in reader.fieldnames}
    for row in reader:
        code_key = fields.get("wallace_mechanic_code") or fields.get("code")
        name_key = fields.get("name")
        code = row.get(code_key) if code_key else row.get("wallace_mechanic_code")
        name = row.get(name_key) if name_key else row.get("name")
        if not name or not str(name).strip():
            continue
        code_s = str(code).strip() if code else None
        name_s = str(name).strip()
        q = select(Mechanic).where(Mechanic.marina_id == marina_id, Mechanic.name == name_s)
        if code_s:
            q = q.where(Mechanic.wallace_mechanic_code == code_s)
        existing = session.execute(q).scalar_one_or_none()
        if existing:
            existing.is_active = True
            if code_s:
                existing.wallace_mechanic_code = code_s
        else:
            session.add(
                Mechanic(
                    marina_id=marina_id,
                    wallace_mechanic_code=code_s,
                    name=name_s,
                    is_active=True,
                )
            )
        count += 1
    return count


def _import_customers_boats_csv_path(session: Session, path: Path, marina_id: uuid.UUID) -> tuple[int, int]:
    with path.open(newline="", encoding="utf-8-sig") as f:
        return _import_customers_boats_csv_stream(session, f, marina_id)


def _import_customers_boats_csv_stream(session: Session, stream, marina_id: uuid.UUID) -> tuple[int, int]:
    """Expected columns (flexible headers): Customer AR #, Customer Name, Alpha Key, Phone,
    Email (optional),
    Stock ID, Manufacture, LOA Ft, LOA In, Beam Ft, Beam In, Weight, Registration, Slip/Rack ID
    """
    cust_created = 0
    boat_upserts = 0
    reader = csv.DictReader(stream)
    if not reader.fieldnames:
        return 0, 0
    fn = {_norm_key(k): k for k in reader.fieldnames}

    def col(*names: str) -> str | None:
        for n in names:
            key = _norm_key(n)
            if key in fn:
                return fn[key]
        return None

    c_ar = col("customer_ar_#", "customer_ar", "ar_#", "ar_number", "customer_ar")
    c_name = col("customer_name", "name")
    email_col = col("email", "e_mail", "e-mail")
    alpha = col("alpha_key")
    phone = col("phone")
    stock = col("stock_id", "stock")
    make = col("manufacture", "make")
    loa_ft = col("loa_ft")
    loa_in = col("loa_in")
    beam_ft = col("beam_ft")
    beam_in = col("beam_in")
    weight = col("weight", "weight_lbs")
    reg = col("registration")
    slip = col("slip_rack_id", "slip_id", "slip")

    for row in reader:
        ar_raw = row.get(c_ar) if c_ar else row.get("Customer AR #")
        if ar_raw is None or str(ar_raw).strip() == "":
            continue
        try:
            ar_num = int(float(str(ar_raw).strip()))
        except ValueError:
            continue
        full_name = (row.get(c_name) if c_name else "") or ""
        first, last = _split_name(full_name)
        cust = session.execute(
            select(Customer).where(
                Customer.marina_id == marina_id,
                Customer.wallace_customer_id == ar_num,
            )
        ).scalar_one_or_none()
        if cust:
            if alpha and row.get(alpha):
                cust.alpha_key = str(row.get(alpha)).strip()
            if phone and row.get(phone):
                cust.phone = str(row.get(phone)).strip()
            if email_col and row.get(email_col):
                cust.email = str(row.get(email_col)).strip().lower()
            if first:
                cust.first_name = first
            if last is not None:
                cust.last_name = last
        else:
            em = None
            if email_col and row.get(email_col):
                em = str(row.get(email_col)).strip().lower()
            cust = Customer(
                marina_id=marina_id,
                wallace_customer_id=ar_num,
                email=em,
                phone=str(row.get(phone)).strip() if phone and row.get(phone) else None,
                first_name=first,
                last_name=last,
                alpha_key=str(row.get(alpha)).strip() if alpha and row.get(alpha) else None,
                is_active=True,
                account_claimed=False,
            )
            session.add(cust)
            session.flush()
            cust_created += 1

        stock_id = (row.get(stock) if stock else None) or row.get("Stock ID")
        if not stock_id or not str(stock_id).strip():
            continue
        stock_s = str(stock_id).strip()

        def _i(key: str | None) -> int | None:
            if not key:
                return None
            v = row.get(key)
            if v is None or str(v).strip() == "":
                return None
            try:
                return int(float(str(v).strip()))
            except ValueError:
                return None

        boat = session.execute(
            select(Boat).where(Boat.customer_id == cust.id, Boat.wallace_stock_id == stock_s)
        ).scalar_one_or_none()
        if boat:
            if make and row.get(make):
                boat.make = str(row.get(make)).strip()
            if loa_ft:
                boat.loa_ft = _i(loa_ft)
            if loa_in:
                boat.loa_in = _i(loa_in)
            if beam_ft:
                boat.beam_ft = _i(beam_ft)
            if beam_in:
                boat.beam_in = _i(beam_in)
            if weight:
                boat.weight_lbs = _i(weight)
            if reg and row.get(reg):
                boat.registration = str(row.get(reg)).strip()
            if slip and row.get(slip):
                boat.slip_id = str(row.get(slip)).strip()
        else:
            session.add(
                Boat(
                    marina_id=marina_id,
                    customer_id=cust.id,
                    wallace_stock_id=stock_s,
                    make=str(row.get(make)).strip() if make and row.get(make) else None,
                    loa_ft=_i(loa_ft),
                    loa_in=_i(loa_in),
                    beam_ft=_i(beam_ft),
                    beam_in=_i(beam_in),
                    weight_lbs=_i(weight),
                    registration=str(row.get(reg)).strip() if reg and row.get(reg) else None,
                    slip_id=str(row.get(slip)).strip() if slip and row.get(slip) else None,
                    photos=[],
                )
            )
        boat_upserts += 1
    return cust_created, boat_upserts


#
# NOTE: legacy path-based import helpers were replaced with *_path and *_stream variants above.


if __name__ == "__main__":
    os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://marina:marina@localhost:5432/marina_portal")
    rid = run_sync()
    print("sync run", rid)
