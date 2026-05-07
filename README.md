# Marina Service Portal

Customer-facing service request system for marinas using Wallace Marina Management. Stack: **FastAPI**, **Next.js 14**, **PostgreSQL**, **Redis/Celery**, **SendGrid/Twilio**, **S3-compatible storage (MinIO locally)**.

## Prerequisites

- Docker and Docker Compose
- For local dev without Docker: Python 3.12+, Node.js 20+, PostgreSQL 16, Redis

## Quick start (Docker)

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `JWT_SECRET_KEY`, and optionally SendGrid/Twilio keys for notifications.

2. Build and run:

   ```bash
   docker compose up --build
   ```

3. Run database migrations (first time):

   ```bash
   docker compose exec api alembic upgrade head
   ```

4. Create an admin user:

   ```bash
   docker compose exec api python -m scripts.create_admin
   ```

5. Open the app:

   - Frontend: http://localhost:3000
   - API docs: http://localhost:8000/docs
   - MinIO console: http://localhost:9001 (default user/pass from `.env`)

6. Optional: generate a **customer claim token** after Wallace sync has created customer rows with an email set:

   ```bash
   docker compose exec api python -m scripts.create_claim_token customer@example.com
   ```

## Wallace CSV bridge

Drop Wallace export CSV files into the shared volume path (inside containers: `/data/wallace_exports`). The bridge service watches this directory and upserts customers, boats, and related records. See `bridge/README.md` for expected CSV column names.

## Render (API) + Wallace on Windows Desktop (recommended sync approach)

When Wallace runs on a Windows desktop and the API runs on Render, the cloud cannot access the desktop export folder directly.
Use **upload-based sync**:

1. Set `WALLACE_UPLOAD_API_KEY` in your Render backend environment.
2. On the Windows Wallace machine, schedule a task that uploads new CSV exports to:
   - `POST /api/v1/wallace-exports/upload` with header `X-API-Key: <WALLACE_UPLOAD_API_KEY>`

Example PowerShell (minimal):

```powershell
$api = "https://YOUR-RENDER-API.example.com/api/v1/wallace-exports/upload"
$key = "YOUR_WALLACE_UPLOAD_API_KEY"
$dir = "C:\Wallace\Exports"

Get-ChildItem $dir -Filter *.csv | ForEach-Object {
  $file = $_.FullName
  $resp = Invoke-RestMethod -Uri $api -Method Post -Headers @{ "X-API-Key" = $key } -Form @{ file = Get-Item $file }
  # After successful upload, archive or move the file so it isn't re-uploaded next run.
  if ($resp.ok -eq $true) { Move-Item $file "$dir\archive\$($_.Name)" -Force }
}
```

## Project layout

- `backend/` — FastAPI API, Celery worker, Alembic migrations
- `frontend/` — Next.js App Router UI
- `bridge/` — File watcher + CSV sync into PostgreSQL
- `infra/` — Optional nginx configuration

## Development (without full Docker for frontend)

Run Postgres/Redis/MinIO via Docker, then:

```bash
cd backend && python -m venv .venv && .venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn marina_service.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend && npm install && npm run dev
```

## License

Proprietary — client project.
