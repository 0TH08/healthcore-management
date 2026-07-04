# HealthCore Management — TechNova

A prototype healthcare management platform built for the Software Engineering course (UNITN). It's a full-stack app with an Express/TypeScript backend and a React frontend, designed to show how different hospital roles interact through a single system.

The thing we had to keep in mind from the start: every role (patient, doctor, nurse, admin) sees and does completely different things, and the system has to enforce that. Not just hide buttons in the UI — actually reject requests at the API level if the role doesn't match.

---

## What's in the box

The project covers the whole appointment lifecycle (booking, paying, medical records), triage management for nurses, resource tracking (beds and medical devices), and an admin panel for infrastructure and staff management. There's also an audit log that records every admin write operation.

**Not everything is real**, of course. Payments go through a mock gateway — only `4242 4242 4242 4242` works. Emails and SMSes are just console logs. The triage broadcast writes to the console instead of an actual hospital display board. The idea was to get the architecture right and make it demonstrable, not to hook up real third-party services.

---

## Tech Stack

| Layer | What we used |
|-------|-------------|
| Backend runtime | Node.js |
| Language | TypeScript (both frontend and backend) |
| Web framework | Express |
| Database | SQLite via Prisma ORM |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod |
| Frontend | React 18 + Vite |
| Routing (frontend) | React Router |
| HTTP client | Axios |
| Tests | Vitest + Supertest |

---

## Architecture (quick version)

The backend follows a layered setup:

- **Routes** define the URL paths and attach middleware (auth, role check, validation).
- **Controllers** extract request data and call services.
- **Services** contain the actual business logic and talk to Prisma.
- **Adapters** wrap external systems (payment gateway, email notifications, information displays) so they can be mocked or swapped later.

The frontend is a SPA with React Router. Private routes check for a valid JWT and the user's role before rendering anything. The Axios instance automatically attaches the token from localStorage and redirects to `/login` on 401.

### Models (Prisma, 18 tables)

The schema maps pretty directly to what you'd expect from a hospital system:

- **UserAccount** — base user with role (PATIENT/DOCTOR/NURSE/ADMIN)
- **PatientProfile**, **StaffProfile** — role-specific data
- **TimeSlot**, **Appointment**, **PaymentTransaction** — booking and payment
- **MedicalRecord**, **Allergy**, **Prescription** — clinical data
- **TriageCase** — emergency queue management
- **Bed**, **MedicalDevice** — physical resources
- **Hospital**, **Department**, **HospitalNetwork** — organization hierarchy
- **Schedule**, **Shift** — staff scheduling
- **AuditLog** — admin activity trail

---

## Use Cases Implemented

I'll group them by module so it's easier to navigate:

**Auth (UC-01 – UC-04):** Register, login, logout, password recovery.

**Appointments (UC-05 – UC-08):** List departments, list doctors, view available timeslots, book an appointment (with double-booking prevention via a Prisma transaction).

**Payments (UC-09):** Authorize card payment, validate a transaction, view transaction details. The mock gateway accepts `4242 4242 4242 4242` and rejects everything else.

**Medical Records (UC-10, UC-14 – UC-17):** Patients can view and export their own records. Doctors can search patients, consult full records (with allergies highlighted — mild/moderate/severe color coding), update diagnosis and notes, and create prescriptions.

**Triage (UC-18 – UC-22):** Nurses manage the queue — create cases, update priority (LOW→CRITICAL), update status (WAITING→IN_PROGRESS→COMPLETED), and broadcast the queue to (simulated) display boards. Queue is sorted CRITICAL first, then by creation time.

**Resources (UC-23 – UC-28):** Bed dashboard with assign/release. Device dashboard with assign and status changes (AVAILABLE, IN_USE, UNDER_MAINTENANCE).

**Admin Infrastructure (UC-29 – UC-41):** Full CRUD for hospitals, departments, beds. Create-only for medical devices (per D2 constraint). Staff account creation, deactivation, and role changes.

**Audit (UC-42):** Every admin write action is logged and viewable through the audit log page.

---

## What's simulated / not fully implemented

This is a prototype, so some things are stubs:

- **Payment gateway** — `server/src/modules/system-core/payment-gateway.adapter.ts` just checks if the card number equals `4242424242424242`. No actual bank API.
- **Email/SMS notifications** — `notification-service.adapter.ts` writes to console instead of sending real emails.
- **Triage display boards** — `information-display.adapter.ts` logs the queue to console. In reality this would push to screens in the ER.
- **Password recovery** — the endpoint exists and returns a success message, but no actual email is sent.
- **Session management** — there's no Session table. It's purely JWT-based. Token expiry is enforced by the middleware.
- **Staff scheduling** — the Schedule and Shift tables exist in the schema and are seeded, but there's no frontend for them yet.

---

## How to run it

You'll need Node.js (18+) and npm.

### 1. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend (separate terminal)
cd client
npm install
```

### 2. Set up the database

```bash
cd server
npx prisma migrate dev --name init
npm run seed
```

This creates `server/dev.db` and populates it with demo data (users, departments, timeslots, beds, devices, etc.).

### 3. Start the backend

```bash
cd server
npm run dev
```

Runs on `http://localhost:3000`. The `.env` file needs:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET=dev-secret
PORT=3000
```

### 4. Start the frontend

```bash
cd client
npm run dev
```

Opens at `http://localhost:5173`. Vite proxies `/api` requests to the backend.

### 5. Run tests

```bash
cd server
npm test
```

52 tests across 8 files. They share the same `dev.db` as development. Re-seed if the database gets into a weird state.

---

## Demo Users

All seeded with the same password:

| Email | Password | Role |
|-------|----------|------|
| `patient@healthcore.test` | `Password123!` | PATIENT |
| `doctor@healthcore.test` | `Password123!` | DOCTOR |
| `nurse@healthcore.test` | `Password123!` | NURSE |
| `admin@healthcore.test` | `Password123!` | ADMIN |

After login you get redirected to the right dashboard based on role.

---

## A note on the payment mock

Only one card number works:

```
4242 4242 4242 4242
```

Spaces don't matter — we strip them before checking. Any other card returns status 402 with an error message. This is hardcoded in `payment-gateway.adapter.ts` and there's no way to override it through the API (by design — it's a mock, not a config).
