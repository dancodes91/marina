from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from marina_service.config import get_settings
from marina_service.routers import (
    auth,
    boats,
    labor_codes,
    manager,
    notifications,
    requests,
    sync,
    wallace_exports,
)

settings = get_settings()

app = FastAPI(title="Marina Service Portal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(boats.router, prefix=api_prefix)
app.include_router(requests.router, prefix=api_prefix)
app.include_router(manager.router, prefix=api_prefix)
app.include_router(labor_codes.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(sync.router, prefix=api_prefix)
app.include_router(wallace_exports.router, prefix=api_prefix)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
