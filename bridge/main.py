"""Periodic Wallace CSV sync (read-only). Complements Celery scheduled tasks."""

import os
import time
import traceback

from marina_service.config import get_settings
from marina_service.services.wallace_sync import run_sync


def main() -> None:
    settings = get_settings()
    interval = int(os.environ.get("WALLACE_SYNC_INTERVAL_SECONDS", settings.wallace_sync_interval_seconds))
    print(f"Wallace bridge starting; interval={interval}s export_dir={settings.wallace_export_dir}")
    while True:
        try:
            rid = run_sync()
            print(f"sync ok run_id={rid}")
        except Exception:
            traceback.print_exc()
        time.sleep(interval)


if __name__ == "__main__":
    main()
