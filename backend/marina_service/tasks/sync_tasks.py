from marina_service.services.wallace_sync import run_sync
from marina_service.tasks.celery_app import celery_app


@celery_app.task(name="wallace.run_sync")
def run_wallace_sync_task() -> str:
    rid = run_sync()
    return str(rid)
