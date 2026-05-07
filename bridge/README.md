# Wallace CSV bridge

Runs on an interval and imports CSV files from `WALLACE_EXPORT_DIR` (default `/data/wallace_exports`) into PostgreSQL using the same logic as the API (`marina_service.services.wallace_sync`).

## Expected CSV

**Customers / boats** (any `*.csv` whose name does not include `mechanic`):

- `Customer AR #` (or `customer_ar_#`)
- `Customer Name`
- `Email` (optional; used for portal login / claim flow)
- `Alpha Key`, `Phone`
- `Stock ID`, `Manufacture`, `LOA Ft`, `LOA In`, `Beam Ft`, `Beam In`, `Weight`, `Registration`, `Slip/Rack ID`

**Mechanics** (filename contains `mechanic`):

- `wallace_mechanic_code` (or `code`), `name`

Place files in the shared volume mounted at `/data/wallace_exports`.
