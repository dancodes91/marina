from fastapi import APIRouter, File, Header, HTTPException, UploadFile

from marina_service.config import get_settings
from marina_service.services.wallace_sync import run_sync_single_csv

router = APIRouter(prefix="/wallace-exports", tags=["wallace-exports"])


@router.post("/upload")
async def upload_wallace_export(
    file: UploadFile = File(...),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict:
    settings = get_settings()
    if not settings.wallace_upload_api_key:
        raise HTTPException(status_code=503, detail="Wallace upload not configured")
    if not x_api_key or x_api_key != settings.wallace_upload_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV file required")

    content = await file.read()
    run_id = run_sync_single_csv(filename=file.filename, content_bytes=content)
    return {"ok": True, "sync_run_id": str(run_id)}

