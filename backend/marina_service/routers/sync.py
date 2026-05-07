from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from marina_service.auth.deps import get_admin
from marina_service.database import get_db
from marina_service.models.staff_user import StaffUser
from marina_service.models.sync_log import SyncLogLine, SyncRun
from marina_service.tasks.sync_tasks import run_wallace_sync_task

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/trigger")
async def trigger_sync(_: StaffUser = Depends(get_admin)) -> dict:
    task = run_wallace_sync_task.delay()
    return {"task_id": task.id}


@router.get("/status")
async def sync_status(
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(get_admin),
) -> dict:
    r = await db.execute(select(SyncRun).order_by(SyncRun.started_at.desc()).limit(1))
    run = r.scalars().first()
    if not run:
        return {"last_sync": None, "counts": {}}
    return {
        "last_sync": run.finished_at.isoformat() if run.finished_at else None,
        "status": run.status,
        "counts": {
            "files": run.files_processed,
            "customers": run.customers_upserted,
            "boats": run.boats_upserted,
            "mechanics": run.mechanics_upserted,
        },
    }


@router.get("/log")
async def sync_log(
    db: AsyncSession = Depends(get_db),
    _: StaffUser = Depends(get_admin),
) -> list[dict]:
    r = await db.execute(select(SyncRun).order_by(SyncRun.started_at.desc()).limit(50))
    runs = r.scalars().all()
    out = []
    for run in runs:
        lines = (
            await db.execute(select(SyncLogLine).where(SyncLogLine.sync_run_id == run.id))
        ).scalars().all()
        out.append(
            {
                "id": str(run.id),
                "started_at": run.started_at.isoformat(),
                "finished_at": run.finished_at.isoformat() if run.finished_at else None,
                "status": run.status,
                "error_message": run.error_message,
                "lines": [{"level": ln.level, "message": ln.message} for ln in lines],
            }
        )
    return out
