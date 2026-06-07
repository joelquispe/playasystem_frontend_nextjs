# Playa ROSE — Frontend

Next.js 16 · React 19 · Ant Design · React Query · Tailwind CSS

Web app for parking lot operations: tickets, cash register, clients, subscribers, reports, and admin configuration.

---

## Quick start

### Prerequisites

- Node.js 20+
- pnpm
- Backend API running (see [Backend setup](#backend-setup))

### Install and run

```bash
pnpm install
cp .env.example .env.local   # adjust if needed
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)  
Login: [http://localhost:3000/login](http://localhost:3000/login)

### Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api/v1` |

---

## Backend setup

From `playasystem_backend_nestjs`:

```bash
make dev        # API + MySQL (Docker)
make seed-dev   # first time only — roles, users, rates, etc.
```

| Service | URL |
|---------|-----|
| API | `http://localhost:3000/api/v1` |
| Swagger | `http://localhost:3000/api/v1/docs` |
| Adminer | `http://localhost:8080` |

**Seeded credentials**

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin2025!` | admin |
| `JOHNNY`, `MARYORI`, `JASON`, `CAJERO4`, `CAJERO5` | `cajero123` | cashier |

---

## API integration

### Full API reference

Detailed endpoint documentation lives in the backend repo:

**[`../playasystem_backend_nestjs/FRONTEND_INTEGRATION.md`](../playasystem_backend_nestjs/FRONTEND_INTEGRATION.md)**

Use Swagger for live exploration: `http://localhost:3000/api/v1/docs`

### Response envelope

Every successful API response is wrapped:

```json
{
  "data": { /* payload */ },
  "success": true,
  "message": "OK"
}
```

Services read the inner payload: `response.data.data`.

Errors:

```json
{
  "success": false,
  "message": "Descripción del error",
  "statusCode": 400,
  "errors": ["validation detail"]
}
```

### HTTP client

All requests go through `lib/axios.ts`:

- Base URL from `NEXT_PUBLIC_API_URL`
- Attaches `Authorization: Bearer <token>` from `localStorage`
- Token key: `AUTH_TOKEN_KEY` in `lib/constants.ts`

```typescript
import { apiClient } from '@/lib/axios';

const res = await apiClient.get<ApiResponse<User[]>>('/users');
const users = res.data.data;
```

### Authentication flow

1. `POST /auth/login` with `{ username, password }`
2. Store `accessToken` and `user` via `setAuth()` (`lib/auth.ts`)
3. `AuthProvider` exposes `user`, `isAdmin`, `login`, `logout`
4. `isAdmin` is derived from `user.role === 'admin'`
5. On logout: `POST /auth/logout`, then clear local storage

**Login response shape**

```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "username": "JOHNNY",
    "fullName": "Johnny Pérez",
    "role": "cashier",
    "roleId": "uuid",
    "roleDetail": {
      "id": "uuid",
      "name": "Cajero",
      "slug": "cashier",
      "isActive": true
    }
  }
}
```

- `role` — slug string (`admin` \| `cashier`). Use this for UI checks and backward compatibility.
- `roleId` — FK to the `roles` table.
- `roleDetail` — full role record from the database.

`GET /auth/me` returns the same flattened profile (with `role` as slug + `roleDetail`).

JWT payload includes `sub`, `username`, `role` (slug), and `roleId`.

### Roles

Roles are stored in the **`roles`** table (not a hardcoded enum on the user).

| Slug | Name | Usage |
|------|------|--------|
| `admin` | Administrador | Full admin screens |
| `cashier` | Cajero | Tickets, caja, clientes |

**Frontend checklist for roles**

- Keep using `user.role === 'admin'` for `isAdmin` (slug unchanged).
- When creating/editing users, send `roleId` (UUID), not `role` string.
- Load options from `GET /roles` for user forms (not implemented in UI yet — use API when building user admin).

**Roles endpoints** (authenticated; no role guard yet on backend):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/roles` | List all roles |
| `GET` | `/roles/:id` | Get role by ID |
| `POST` | `/roles` | Create role |
| `PATCH` | `/roles/:id` | Update role |
| `DELETE` | `/roles/:id` | Deactivate (if no users assigned) |

**User create/update** — use `roleId` instead of `role`:

```json
{
  "username": "JOHNNY",
  "fullName": "Johnny Pérez",
  "password": "secret123",
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "scheduleStart": "07:30",
  "scheduleEnd": "22:00"
}
```

If `roleId` is omitted on create, backend defaults to `cashier`.

**User list response** includes nested `role`:

```json
{
  "id": "uuid",
  "username": "JOHNNY",
  "roleId": "uuid",
  "role": {
    "id": "uuid",
    "name": "Cajero",
    "slug": "cashier",
    "description": "Operación de caja y tickets",
    "isActive": true
  }
}
```

---

## Project structure

```
app/
  (auth)/login/          # Login page
  (dashboard)/           # Protected routes (tickets, clients, reports, …)
components/              # UI by feature (tickets, users, reports, …)
  ui/                    # Reusable InputCustom, ButtonCustom
hooks/                   # React Query hooks per module
services/                # Axios API calls (one file per backend module)
types/api.ts             # Shared TypeScript types and enums
lib/
  axios.ts               # HTTP client + interceptors
  auth.ts                # Token / user persistence
  constants.ts           # Query keys, storage keys
providers/
  AuthProvider.tsx       # Session state
  QueryProvider.tsx      # React Query
```

### Services ↔ backend modules

| Service file | Backend path | Screen |
|----------------|--------------|--------|
| `auth.service.ts` | `/auth` | Login, session |
| `users.service.ts` | `/users` | Usuarios / cajeros |
| `vehicles.service.ts` | `/vehicles` | Vehicle type picker |
| `rates.service.ts` | `/rates` | Tarifas |
| `clients.service.ts` | `/clients` | Clientes |
| `subscribers.service.ts` | `/subscribers` | Abonados |
| `tickets.service.ts` | `/tickets` | Caja / tickets |
| `events.service.ts` | `/events` | Historial por placa |
| `cash-register.service.ts` | `/cash-register` | Cuadre de caja |
| `attendance.service.ts` | `/attendance` | Asistencia (admin) |
| `reports.service.ts` | `/reports` | Reportes + Excel export |
| `nubefact.service.ts` | `/nubefact` | Boleta / factura |
| `system-config.service.ts` | `/system-config` | Configuración |

Add `roles.service.ts` when building role management or user form role picker.

### Types

Central types in `types/api.ts`. Keep in sync with backend DTOs and `FRONTEND_INTEGRATION.md`.

Key enums: `Role`, `TicketStatus`, `RateType`, `PaymentMethod`, `ReceiptType`, `SubscriberStatus`, etc.

---

## Typical workflows

### Cashier shift

```
Login → GET /cash-register/current (auto-opens shift)
     → POST /tickets (new entry)
     → POST /tickets/:id/charge (payment)
     → POST /tickets/:id/receipt (optional boleta/factura)
Logout → POST /auth/logout
```

### Admin reports

```
GET /reports/dashboard?date=YYYY-MM-DD
GET /reports/daily?date=YYYY-MM-DD
GET /reports/monthly?year=YYYY&month=M
GET /reports/export?type=daily&date=...  → binary Excel (not JSON envelope)
```

### Subscriber ticket

```
GET /subscribers/plate/:plate   → if active, apply subscriber rate
POST /tickets                   → may show "Es cliente" / abonado modal
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |

---

## Business rules (frontend hints)

- Plates are always **uppercase** (backend normalizes).
- `[Admin]` endpoints return **403** for cashiers — hide admin nav with `isAdmin`.
- Excel export (`GET /reports/export`) returns a **file download**, not the JSON envelope.
- Attendance is recorded automatically on login/logout.
- After charge/cancel, invalidate `PENDING_TICKETS` and cash-register queries.

See **Business Logic Notes** in [`FRONTEND_INTEGRATION.md`](../playasystem_backend_nestjs/FRONTEND_INTEGRATION.md) for full detail.

---

## Related docs

| Document | Location |
|----------|----------|
| Full API integration guide | `playasystem_backend_nestjs/FRONTEND_INTEGRATION.md` |
| Backend business logic | `playasystem_backend_nestjs/LOGIC.md` |
| Swagger (interactive) | `http://localhost:3000/api/v1/docs` |

---

*Last updated: 2026-06-06 · Frontend 0.1.0 · Backend API 1.2.0*
