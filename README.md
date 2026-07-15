# 🍽 Restaurant Ops — Roster + Inventory Accountability Platform

A React + Vite single-page app combining two tools behind one login:

1. **Staff Roster Generator** — the original constraint-based weekly roster tool.
2. **Inventory Accountability Module** — requisitions, approvals, stock movements,
   daily closings, reporting, and admin, wired to the FastAPI backend
   (`roster-app/backend`, built separately — see that folder's own README).

Everything below the login screen sits behind the same auth session and the same
top nav; the roster tool was preserved unchanged and simply moved to its own
route (`/roster`) when the inventory module was added.

---

## Quick start

```bash
npm install
cp .env.example .env      # point VITE_API_BASE_URL at your running backend
npm run dev                # http://localhost:5173
```

The roster tool works standalone with no backend. Everything under `/inventory`
and `/admin` requires the FastAPI backend to be running and reachable at the
URL in `.env`.

Log in with any seeded backend account, e.g. `bartender@restaurant.test` /
`ChangeMe123!` (see the backend README for the full seeded account list and
their roles).

---

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend's REST API, e.g. `http://localhost:8000/api/v1` |
| `VITE_WS_BASE_URL` | Base URL for the live-notifications WebSocket, e.g. `ws://localhost:8000/api/v1` |

---

## Project structure

```
roster-app/
├── index.html
├── vite.config.js
├── package.json
├── vercel.json              ← includes SPA rewrite (needed for client-side routing)
├── .env.example
└── src/
    ├── main.jsx              ← React entry point
    ├── App.jsx               ← Router shell: routes, auth guard, layout
    ├── index.css             ← Global reset
    │
    ├── context/
    │   └── AuthContext.jsx   ← Session state, login/logout, current user
    │
    ├── api/                  ← One module per backend router — see "API layer" below
    │   ├── client.js         ← Axios instance: JWT attach, 401 handling, error helper
    │   ├── auth.js
    │   ├── roles.js          ← Role name constants, mirrors backend RoleName enum
    │   ├── outlets.js
    │   ├── departments.js
    │   ├── items.js
    │   ├── requisitions.js
    │   ├── stock.js
    │   ├── dailyClosings.js
    │   ├── notifications.js
    │   ├── reports.js
    │   ├── auditLogs.js
    │   ├── users.js
    │   └── websocket.js      ← Live-push WebSocket connection helper
    │
    ├── hooks/
    │   ├── useDepartmentScope.js  ← "which departments can this user pick from"
    │   └── useNotifications.js    ← Notification list + live WebSocket updates
    │
    ├── utils/
    │   ├── generateRoster.js      ← Roster scheduling algorithm
    │   ├── exportCSV.js           ← Roster CSV export
    │   ├── exportPDF.js           ← Roster PDF export
    │   └── requisitionPermissions.js  ← Frontend-side action gating for requisitions
    │
    ├── data/
    │   └── constants.js       ← Roster staff, rules, colours, shift config
    │
    ├── components/
    │   ├── Layout.jsx              ← Top nav (role-gated links), user chip, logout
    │   ├── ProtectedRoute.jsx      ← Redirects to /login if not authenticated
    │   ├── NotificationBell.jsx    ← Notification dropdown, live-updating
    │   ├── RosterTable.jsx         ← Roster: weekly grid
    │   ├── ShiftBadge.jsx          ← Roster: AM / PM / Off badge + dropdown
    │   ├── StatsBar.jsx            ← Roster: per-staff shift count summary
    │   ├── RulesPanel.jsx          ← Roster: configurable constraints UI
    │   ├── AddStaffForm.jsx        ← Roster: add new staff member
    │   └── inventory/
    │       ├── ui.jsx                    ← Shared style tokens, Badge, status badges
    │       ├── Modal.jsx                 ← Reusable modal overlay
    │       └── RequisitionFormModal.jsx  ← Create-requisition form
    │
    └── pages/
        ├── Login.jsx
        ├── RosterApp.jsx               ← The original roster tool, unchanged, at /roster
        ├── InventoryDashboard.jsx      ← /inventory — summary cards + low-stock alerts
        ├── Requisitions.jsx            ← /inventory/requisitions — list + filters + create
        ├── RequisitionDetail.jsx       ← /inventory/requisitions/:id — full workflow actions
        ├── Stock.jsx                   ← /inventory/stock — restock/wastage/return/adjustment
        ├── MovementHistory.jsx         ← /inventory/movements — filterable ledger
        ├── DailyClosings.jsx           ← /inventory/closings — preview + close + history
        ├── Reports.jsx                 ← /inventory/reports — summaries + CSV export
        ├── AuditLogs.jsx                ← /inventory/audit-log — admin/manager only
        └── admin/
            ├── Outlets.jsx              ← /admin/outlets — admin only
            ├── Departments.jsx          ← /admin/departments — admin only
            ├── Items.jsx                ← /admin/items — items catalog + thresholds
            └── Users.jsx                ← /admin/users — user list + register new user
```

---

## Routes

| Path | Page | Notes |
|---|---|---|
| `/login` | `Login` | Public |
| `/roster` | `RosterApp` | The original tool, unchanged |
| `/inventory` | `InventoryDashboard` | Summary cards, low-stock alerts |
| `/inventory/requisitions` | `Requisitions` | List, filters, create |
| `/inventory/requisitions/:requisitionId` | `RequisitionDetail` | Approve/reject, issue (full or partial), complete, cancel |
| `/inventory/stock` | `Stock` | Restock / wastage / return / adjustment forms |
| `/inventory/movements` | `MovementHistory` | Filterable stock ledger |
| `/inventory/closings` | `DailyClosings` | Preview a day, close it, view history |
| `/inventory/reports` | `Reports` | Movement / requisition / wastage summaries, CSV export |
| `/inventory/audit-log` | `AuditLogs` | Admin/manager only |
| `/admin/outlets` | `AdminOutlets` | Admin only |
| `/admin/departments` | `AdminDepartments` | Admin only |
| `/admin/items` | `AdminItems` | Item catalog + threshold configuration |
| `/admin/users` | `AdminUsers` | User list + registration |

Everything under `/`, `/inventory/*`, and `/admin/*` is wrapped in `ProtectedRoute`
and the shared `Layout` nav; nav links themselves are role-gated per
`components/Layout.jsx`'s `NAV_ITEMS` list, matching the backend's own
role restrictions (a hidden nav link doesn't grant access — the backend
still enforces every permission independently).

---

## The API layer (`src/api/`)

Each file mirrors one backend router 1:1 — field names, query params, and
which fields are optional are documented inline in each module against the
backend endpoint it calls. If the backend's request/response shape ever
changes, the corresponding `src/api/*.js` file is the only place that needs
updating; pages never call `axios`/`fetch` directly.

Two integration details worth knowing if you extend this:
- **Login** (`api/auth.js`) sends form-urlencoded `username`/`password`
  (FastAPI's `OAuth2PasswordRequestForm`), not JSON — the most common place
  this kind of integration breaks.
- **CSV export** (`api/reports.js`) fetches as an authenticated blob and
  triggers the download manually, since a plain `<a href>` can't carry the
  Bearer token the backend requires.

## Role-based UI

- `api/roles.js` holds the role name constants (`admin`, `manager`,
  `outlet_manager`, `supervisor`, `storekeeper`, `staff`) and
  `MULTI_DEPARTMENT_ROLES` — the roles that get a department picker instead
  of being pinned to one department.
- `hooks/useDepartmentScope.js` centralizes "which departments can this user
  see/pick from" — used by every page with a department filter.
- `utils/requisitionPermissions.js` gates which workflow buttons appear
  (approve/reject, issue, complete, cancel) based on role and the
  requisition's current status, mirroring the backend's own guards. This is
  a UI convenience only — the backend independently re-checks every
  permission and is the actual source of truth.

## Live notifications

`hooks/useNotifications.js` fetches the initial notification list over REST,
then opens a WebSocket (`api/websocket.js`) for live updates. The token
travels as a `?token=` query param on the WebSocket URL, since browsers
can't set custom headers on a WS handshake — this must match the backend's
`ws.py` auth exactly.

---

## Known gap to be aware of

`POST /auth/register` (used by `admin/Users.jsx`) has no role restriction on
the *backend* — it's open by design from early backend development, before
an admin panel existed. The frontend gates the "Users" nav link and page to
admin-only, but that's a UI convenience, not a security boundary. Lock this
down on the backend (`require_roles("admin")`) before this goes anywhere
near production.

---

## Getting started with the roster tool specifically

Open `src/utils/generateRoster.js` to edit the scheduling algorithm.
Open `src/data/constants.js` to change staff names/positions, shift labels
(`SHIFT_STYLES`), default rules (`DEFAULT_RULES`), or weekend days
(`WEEKEND_DAYS`). The roster tool has no backend dependency and keeps
working even if the inventory API is unreachable.

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Or via GitHub: push this folder, import it in Vercel's dashboard, and it
auto-detects Vite. `vercel.json` already includes the SPA rewrite
client-side routing needs (`/inventory`, `/admin/*`, etc. would otherwise
404 on a direct refresh). Set `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` as
environment variables in the Vercel project settings, pointing at your
deployed backend.

---

## Tech stack

- **React 18** + **React Router 6** — UI and client-side routing
- **Vite** — dev server + build tool
- **Axios** — HTTP client (`src/api/client.js`)
- **Vercel** — hosting (free tier)
- No backend required for the roster tool; the inventory module requires
  the FastAPI backend in `roster-app/backend`
