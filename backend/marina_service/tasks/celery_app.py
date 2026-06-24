from celery import Celery

from marina_service.config import get_settings

settings = get_settings()

celery_app = Celery(
    "marina_service",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["marina_service.tasks.notification_tasks", "marina_service.tasks.sync_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_default_retry_delay=60,
    task_max_retries=3,
    beat_schedule={
        "wallace-sync-every-15-min": {
            "task": "wallace.run_sync",
            "schedule": float(settings.wallace_sync_interval_seconds),
        },
    },
)
