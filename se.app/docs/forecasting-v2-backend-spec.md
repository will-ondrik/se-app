# Forecasting v2 – Backend API Spec

Status: v1 draft
Scope: Endpoints needed by the new forecasting calendar (v2) UI
Audience: Backend + Frontend

---

## High-level

- Domain: Client, Employee, Crew, Job
- Current v2 UI reads: Jobs (by date range), Crews (with memberIds), Employees
- Current v2 UI writes: Create Crew (Manage Crews)
- Near-term writes to unlock full UX: Create/Update Job, Update/Delete Crew
- Analytics and warnings are computed client-side – backend only returns canonical data
- Multi-tenancy: all data implicitly scoped by authenticated user’s company

Base URL: `/api/v1/forecasting`
Auth: Cookie-session (same as existing app). All endpoints require auth.

Date format: `YYYY-MM-DD` (inclusive start/end by day; no times)
IDs: numeric

---

## Data Models

Client
- id: number
- name: string
- email?: string
- phone?: string
- address?: string

Employee
- id: number
- name: string
- role?: string

Crew
- id: number
- name: string
- colorHex?: string
- crewType?: `single | multi` (derive if not provided)
- size?: number (derive = `max(1, memberIds.length)`, unless explicitly set)
- memberIds?: number[] (employee IDs)

Job
- id: number
- title: string
- description?: string
- clientId?: number
- crewId?: number
- startDate: string (YYYY-MM-DD)
- endDate: string (YYYY-MM-DD)
- estimatedHours?: number
- estimatedRevenue?: number
- client?: Client (optional embed)
- crew?: Crew (optional embed)
- integrationSource?: `INTERNAL | JOBBER`
- integrationExternalId?: string | null

Notes
- crewType and size should be consistently derived on writes if the request omits them (see validations)
- Overlaps between jobs are allowed; the UI surfaces conflicts as warnings

---

## Endpoints

### Jobs

GET `/forecasting/jobs`
- Query params:
  - `from?`: YYYY-MM-DD
  - `to?`: YYYY-MM-DD
  - `crewId?`: number
  - `clientId?`: number
  - `include?`: CSV; supports `client`, `crew`
  - `page?`: number (default 1)
  - `pageSize?`: number (default 200)
  - `sort?`: e.g., `startDate:asc`
- Behavior:
  - Return jobs that overlap the `[from, to]` window (inclusive) by date range; if `from`/`to` omitted, default to a reasonable window (current month). The UI sends both.
  - If `include` contains `client`/`crew`, embed those objects in each item to save round trips.
- Response: `Job[]` (OK to return array directly) or `{ data: Job[], page, pageSize, total }`

POST `/forecasting/jobs`
- Body: `Omit<Job, 'id'|'client'|'crew'>`
- Validations:
  - `title` required
  - `startDate <= endDate`
  - `clientId`/`crewId` must exist if provided
- Response: created `Job` (support `?include=` on URL if convenient)

PATCH `/forecasting/jobs/:id`
- Body: Partial `Job` for mutable fields: `title`, `description`, `clientId`, `crewId`, `startDate`, `endDate`, `estimatedHours`, `estimatedRevenue`, `integrationExternalId`
- Concurrency (recommended): ETag/If-Match or `updatedAt` with 409 on mismatch
- Response: updated `Job` (respect `?include=`)

DELETE `/forecasting/jobs/:id` (optional; not used by v2 right now)
- Response: 204

Date overlap rule reference (server):
- Intervals overlap if `a.start <= b.end && b.start <= a.end`

### Crews

GET `/forecasting/crews`
- Query: `include?=members` (optional; embed full employee objects)
- Response: `Crew[]` (with `memberIds` always present). If `include=members`, either embed as `members: Employee[]`, or return a parallel map. v2 only needs `memberIds`, names/roles come from `/employees` today.

POST `/forecasting/crews`
- Body: `Omit<Crew, 'id'|'crewType'|'size'>`:
  - `name` (required)
  - `colorHex?`
  - `memberIds?`: number[]
- Server derives:
  - `size = max(1, memberIds.length)`
  - `crewType = size > 1 ? 'multi' : 'single'`
- Response: created `Crew`

PATCH `/forecasting/crews/:id`
- Body: Partial `Crew` (supports changing `name`, `colorHex`, `memberIds`)
- If `memberIds` present, re-derive `size` and `crewType`
- Response: updated `Crew`

DELETE `/forecasting/crews/:id`
- If crew has jobs:
  - Either reject with 409 unless `?force=true`, or soft-delete; v2 doesn’t call this yet
- Response: 204

### Employees

GET `/forecasting/employees`
- Response: `Employee[]`

POST `/forecasting/employees` (optional for admin flows)
- Body: `Omit<Employee, 'id'>`
- Response: created `Employee`

### Clients (optional, for job creation UX)

GET `/forecasting/clients`
- Query: `search?`, `page?`, `pageSize?`
- Response: `Client[]`

POST `/forecasting/clients` (optional)
- Body: `Omit<Client, 'id'>`
- Response: created `Client`

---

## Validations & Rules

- Dates: ISO date string `YYYY-MM-DD`, inclusive range; `startDate <= endDate`
- Foreign keys: `clientId` and `crewId` must reference existing rows if provided
- Crew derivations (POST/PATCH):
  - `size = max(1, memberIds.length)` if not explicitly provided
  - `crewType = size > 1 ? 'multi' : 'single'`
- Overlaps: allowed; no hard server constraint right now (UI shows warnings)
- Multi-tenancy: enforce company scoping on all endpoints

---

## Errors & Versioning

- Version: `/api/v1`
- Standard codes: 400 (validation), 401, 403, 404, 409 (conflict), 422 (semantic)
- Error body: `{ error: string, code?: string, fields?: { [field]: string } }`

---

## Concurrency & Realtime (recommended)

- Concurrency: ETag/If-Match on PATCH, or `updatedAt` and 409 on mismatch
- Realtime (optional): SSE/WebSocket `/forecasting/events` broadcasting:
  - `forecasting.job.created|updated|deleted`
  - `forecasting.crew.created|updated|deleted`

---

## UI Mapping → Backend

CrewForecastCalendar
- Loads: `GET /forecasting/jobs?from&to`, `GET /forecasting/crews`, `GET /forecasting/employees`
- Needs: overlapping jobs, crews with `memberIds`, employees with `name`/`role`

CalendarGrid
- Pure props (jobs, crews)

CrewManagementDialog
- Loads: `GET /forecasting/employees`
- Creates: `POST /forecasting/crews { name, colorHex, memberIds }`

CreateJobDialog (placeholder in v2, enable soon)
- Creates: `POST /forecasting/jobs`
- Fields: `title, clientId, crewId, startDate, endDate, estimatedHours, estimatedRevenue, description`

JobDetailPanel
- Needs job with client and crew details for display
- Strategy: `GET /forecasting/jobs?from&to&include=client,crew` or `GET /forecasting/jobs/:id?include=client,crew`

CrewDetailPanel
- Needs crew with employees names/roles
- Strategy: current: `GET /crews` + `GET /employees` → adapter maps IDs
- Alt: `GET /crews?include=members`

AnalyticsPanel / TopSummaryBar
- No server endpoints; computed client-side from loaded jobs/crews

---

## Examples

GET `/forecasting/jobs?from=2025-01-01&to=2025-01-31&include=client,crew`
- Returns jobs overlapping Jan 2025, with embedded client and crew

POST `/forecasting/crews`
```json
{ "name": "Crew A", "colorHex": "#14b8a6", "memberIds": [12, 34] }
```
Response
```json
{ "id": 7, "name": "Crew A", "colorHex": "#14b8a6", "memberIds": [12,34], "size": 2, "crewType": "multi" }
```

PATCH `/forecasting/jobs/42`
```json
{ "crewId": 7, "startDate": "2025-01-10", "endDate": "2025-01-14" }
```
Response
```json
{ "id": 42, "title": "Exterior repaint", "crewId": 7, "startDate": "2025-01-10", "endDate": "2025-01-14" }
```

---

## Frontend client wiring (drop-in replacement for in-memory store)

Replace `src/lib/forecastingApi.ts` internals to call these endpoints while keeping signatures used by v2 components:
- `getJobs({ from, to, crewId })`
- `createJob(data)`
- `updateJob(id, updates)`
- `getClients()` / `createClient(data)`
- `getEmployees()` / `createEmployee(data)` (optional)
- `getCrews()` / `createCrew(data)` / `updateCrew(id, updates)` / `deleteCrew(id)`

The adapters already map API models to v2 calendar models.
