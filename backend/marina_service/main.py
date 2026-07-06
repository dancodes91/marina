from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from marina_service.config import get_settings
from marina_service.routers import (
    auth,
    boats,
    labor_codes,
    landing_gallery,
    manager,
    marina_settings,
    notifications,
    payments,
    requests,
    reservations,
    sync,
    wallace_exports,
)
from marina_service.services.bootstrap_service import setup_router
from marina_service.services.landing_gallery_storage import default_image_path


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        default_image_path()
    except Exception:
        pass
    yield


settings = get_settings()

app = FastAPI(title="Marina Service Portal API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(boats.router, prefix=api_prefix)
app.include_router(requests.router, prefix=api_prefix)
app.include_router(manager.router, prefix=api_prefix)
app.include_router(labor_codes.router, prefix=api_prefix)
app.include_router(landing_gallery.public_router, prefix=api_prefix)
app.include_router(landing_gallery.manager_router, prefix=api_prefix)
app.include_router(marina_settings.router, prefix=api_prefix)
app.include_router(marina_settings.public_router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(sync.router, prefix=api_prefix)
app.include_router(wallace_exports.router, prefix=api_prefix)
app.include_router(payments.router, prefix=api_prefix)
app.include_router(reservations.router, prefix=api_prefix)
app.include_router(setup_router, prefix=api_prefix)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
