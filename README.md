# Marina Service Portal

Multi-tenant customer-facing marina portal: seasonal work orders, slip/storage reservations, labor pricing, Wallace CSV sync, and payment stubs (Gravity). Stack: **FastAPI**, **Next.js 14**, **PostgreSQL**, **Redis/Celery**, **SendGrid/Twilio**, **S3/MinIO**.

## Features

- **Marketing site** — GSAP landing page, slip/storage availability browse
- **Customer portal** — 4-step work order wizard (Winter/Spring/General), dashboard, reservations, payment stub
- **Manager dashboard** — Shadcn sidebar UI: requests, labor lines, reservations, sync, notifications
- **Multi-tenant** — `Marina` model; API scoped via `X-Marina-Slug` header (default `your-dealership-name`)
- **Wallace sync** — CSV folder watch, upload API, Celery beat (15 min)

## Prerequisites

- Docker and Docker Compose
- For local dev without Docker: Python 3.12+, Node.js 20+, PostgreSQL 16, Redis

## Quick start (Docker)

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

   Set `JWT_SECRET_KEY`, marina branding (`DEFAULT_MARINA_*` / `NEXT_PUBLIC_MARINA_*`), and optionally SendGrid/Twilio keys.

2. Build and run:

   ```bash
   docker compose up --build
   ```

3. Bootstrap (migrations + default marina + test users):

   ```bash
   docker compose exec api python -m scripts.bootstrap
   ```

   Or on Render, visit once: `/api/v1/setup/bootstrap?key=YOUR_BOOTSTRAP_API_KEY&format=html`

4. Open the app:

   - Frontend: http://localhost:3000
   - Manager: http://localhost:3000/manager (staff login)
   - API docs: http://localhost:8000/docs

6. Optional: generate a **customer claim token** after Wallace sync has created customer rows with an email set:

   ```bash
   docker compose exec api python -m scripts.create_claim_token customer@example.com
   ```

## Wallace CSV bridge

Drop Wallace export CSV files into the shared volume path (inside containers: `/data/wallace_exports`). The bridge service watches this directory and upserts customers, boats, and related records. See `bridge/README.md` for expected CSV column names.

## Render (API) + Wallace on Windows Desktop (recommended sync approach)

When Wallace runs on a Windows desktop and the API runs on Render, the cloud cannot access the desktop export folder directly.
Use **upload-based sync**:

### Render environment variables

Set at minimum:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Render Postgres **Internal** URL (`postgresql://...` is auto-converted to `postgresql+asyncpg://`) |
| `JWT_SECRET_KEY` | Long random string |
| `CORS_ORIGINS` | Your Vercel frontend URL |
| `PUBLIC_APP_URL` | Frontend URL (emails / links) |
| `BOOTSTRAP_API_KEY` | Secret key for the setup URL below |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Manager login to seed |
| `TEST_CUSTOMER_EMAIL` / `TEST_CUSTOMER_PASSWORD` | Customer login to seed (includes a test boat) |
| `DEFAULT_MARINA_SLUG` / `NEXT_PUBLIC_MARINA_SLUG` | Tenant slug (`your-dealership-name`) |
| `DEFAULT_MARINA_NAME` / `NEXT_PUBLIC_MARINA_NAME` | Display name (`Your Dealership Name`) |
| `NEXT_PUBLIC_MARINA_SUBTITLE` | Optional tagline under the name in the header |
| `GRAVITY_STUB_MODE` | `true` until real Gravity API is wired |
| `WALLACE_UPLOAD_API_KEY` | For CSV upload from Wallace desktop |

### First-time setup (no custom start command needed)

After the API is live, open this URL once in your browser (replace host and key):

```
https://YOUR-RENDER-API.onrender.com/api/v1/setup/bootstrap?key=YOUR_BOOTSTRAP_API_KEY
```

This runs database migrations and seeds test users from the env vars above. It is idempotent — existing users are not recreated. JSON is returned by default; add `&format=html` for a simple results page.

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
