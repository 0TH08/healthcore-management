# D3 Report — HealthCore Management

**Project:** HealthCore Management  
**Team:** TechNova  
**Course:** Software Engineering — Università degli Studi di Trento  
**Date:** July 2026  
**Version:** 1.0

---

## 1. Purpose of the Document

This document constitutes the D3 deliverable for the HealthCore Management project. It describes the implementation of a working subset of the requirements defined in D1, realised according to the object-oriented structure defined in D2. The document covers the mapping from requirements to implementation, the architectural decisions made, the API surface exposed, the testing strategy adopted, and a retrospective assessment of the work carried out.

The intended audience is the course teaching staff and the evaluation committee.

---

## 2. Relation with D1 and D2

### 2.1 The D1–D2–D3 Continuum

The three deliverables form a progression:

- **D1** defines *what* the system must do. It contains the requirements specification, use cases, and domain analysis. Every feature implemented in D3 traces back to a D1 use case.
- **D2** defines the object-oriented *structure* that realises those requirements. It contains class diagrams, method signatures, interaction diagrams, and the static architecture. D3 implements a subset of those classes as working code.
- **D3** produces a working *prototype* that implements a selected set of D1 use cases using the class structure defined in D2. Not every D1 use case is implemented (some are out of scope for a prototype), and not every D2 class has a direct code equivalent (some are fused or simplified during implementation).

### 2.2 Requirements Selected from D1

The following requirements from D1 were selected for implementation in D3:

| ID | Requirement | Implemented |
|----|-------------|-------------|
| R01 | User registration | Fully |
| R02 | User authentication (login/logout) | Fully |
| R03 | Password recovery | Fully (mock — no email sent) |
| R04 | Role-based access control | Fully |
| R05 | Department listing | Fully |
| R06 | Doctor listing | Fully |
| R07 | Available timeslot browsing | Fully |
| R08 | Appointment booking | Fully |
| R09 | Double-booking prevention | Fully |
| R10 | Payment authorisation | Fully (mock gateway) |
| R11 | Payment validation | Fully |
| R12 | View own appointments | Fully |
| R13 | View own medical records | Fully |
| R14 | Export medical records | Fully |
| R15 | Doctor search patients | Fully |
| R16 | Doctor consult patient records | Fully |
| R17 | Doctor update medical records | Fully |
| R18 | Doctor create prescriptions | Fully |
| R19 | Triage queue management | Fully |
| R20 | Triage priority/status updates | Fully |
| R21 | Triage queue broadcast | Fully (mock display) |
| R22 | Bed management (assign/release) | Fully |
| R23 | Device management (assign/status) | Fully |
| R24 | Hospital CRUD (admin) | Fully |
| R25 | Department CRUD (admin) | Fully |
| R26 | Bed CRUD (admin) | Fully |
| R27 | Add medical device (admin) | Fully (no modify/remove per D2) |
| R28 | Staff account management | Fully |
| R29 | Role assignment (admin) | Fully |
| R30 | Audit logging | Fully |
| R31 | Schedule viewing (doctor) | Partially (read-only via timeslots) |

Not all D1 requirements were carried forward. Staff scheduling (full Schedule/Shift management), patient-facing registration of new accounts beyond the seed (the register endpoint exists, but the frontend registration form is a general-purpose form), and integration with external hospital information systems were deferred as out of scope for the prototype.

### 2.3 D2 Class Diagram Used

The implementation follows the class structure defined in D2 with the following correspondence:

| D2 Class | Implementation | Notes |
|----------|---------------|-------|
| `UserAccount` | `UserAccount` model (Prisma) + `authMiddleware` | Core auth entity with hashed password and role enum |
| `PatientProfile` | `PatientProfile` model | Linked 1:1 to UserAccount |
| `StaffProfile` | `StaffProfile` model | Linked 1:1 to UserAccount for DOCTOR/NURSE/ADMIN |
| `Appointment` | `Appointment` model + `AppointmentService` | Booking logic in a Prisma transaction |
| `TimeSlot` | `TimeSlot` model + `TimeSlotService` | Availability controlled by `isBooked` flag |
| `PaymentTransaction` | `PaymentTransaction` model + `PaymentTransactionService` | Status tracked as PENDING/COMPLETED/FAILED |
| `MedicalRecord` | `MedicalRecord` model + `MedicalRecordService` | Allergies and prescriptions included as relations |
| `Allergy` | `Allergy` model | Embedded in medical record |
| `Prescription` | `Prescription` model + `PrescriptionService` | Created per medical record |
| `TriageCase` | `TriageCase` model + `TriageService` (in controller) | Priority and status tracked as enums |
| `Bed` | `Bed` model + `BedService` | Status: UNOCCUPIED, OCCUPIED |
| `MedicalDevice` | `MedicalDevice` model + `MedicalDeviceService` | Status: AVAILABLE, IN_USE, UNDER_MAINTENANCE |
| `Hospital` | `Hospital` model + `HospitalService` (in controller) | Linked to HospitalNetwork |
| `Department` | `Department` model + `DepartmentService` (in controller) | Linked to Hospital |
| `HospitalNetwork` | `HospitalNetwork` model | Created during seed; referenced by Hospital |
| `Schedule` | `Schedule` model | Seeded but no dedicated frontend |
| `Shift` | `Shift` model | Seeded but no dedicated frontend |
| `AuditLog` | `AuditLog` model + `AuditLogService` | Auto-recorded on admin write operations |
| `PaymentGatewayAdapter` | `payment-gateway.adapter.ts` | Mock — checks card number only |
| `NotificationServiceAdapter` | `notification-service.adapter.ts` | Mock — logs to console |
| `InformationDisplayAdapter` | `information-display.adapter.ts` | Mock — logs to console |

### 2.4 Changes from D2 to Implementation

During implementation, a few deviations from the D2 design were necessary:

1. **UserRole includes PATIENT.** In the D2 class diagram, PATIENT may have been modelled as a separate hierarchy. For implementation simplicity, all user types share a single `UserAccount` table with a `role` discriminator. This avoids complex joined-table inheritance and makes the auth middleware straightforward (a single JWT payload field).

2. **BackupRecord is a service, not a table.** The D2 class diagram may have shown BackupRecord as a persistent entity. In the implementation, backup/export is handled by `MedicalRecordService.exportRecords()` which generates a text representation on-the-fly. No separate table is needed.

3. **Session management is JWT-only.** D2 may have included a Session class with database persistence. The implementation uses stateless JWT tokens stored in `localStorage` on the client side. There is no Session table. Token validation happens via secret check in the `authMiddleware`. This simplifies deployment (no session store needed) and matches common REST API practice.

4. **Role-based middleware is centralised.** Rather than embedding role checks in each controller, a reusable `roleMiddleware(roles: UserRole[])` factory is used. This keeps the access control policy visible at the route level.

5. **Triage queue sorting.** D2 may have specified sorting logic in the service layer. The implementation sorts triage cases by priority order (CRITICAL > HIGH > MEDIUM > LOW) and then by creation date, performed in application code because Prisma's enum sorting is alphabetical, not semantic.

### 2.5 Not Implemented Features

The following features from D1/D2 were deliberately excluded from the D3 prototype:

- Full Schedule and Shift management (the tables exist and are seeded, but there is no CRUD interface)
- Real integration with external hospital information systems
- Real payment gateway (all mocked)
- Real email/SMS delivery (all mocked)
- Real hospital display board integration (mocked)
- Reporting and analytics dashboard
- Multi-language support
- Patient self-registration separate from the generic register endpoint (the register endpoint works for any role, not just PATIENT)

---

## 3. Use Cases Implemented

The following 42 use cases are implemented (grouped by module):

| Module | Use Case | Implementation |
|--------|----------|----------------|
| Auth | UC-01 Register | `POST /api/auth/register` |
| Auth | UC-02 Login | `POST /api/auth/login` |
| Auth | UC-03 Logout | `POST /api/auth/logout` |
| Auth | UC-04 Recover Password | `POST /api/auth/recover-password` |
| Appointments | UC-05 List Departments | `GET /api/departments` |
| Appointments | UC-06 List Doctors | `GET /api/doctors` |
| Appointments | UC-07 View Available Timeslots | `GET /api/timeslots` |
| Appointments | UC-08 Book Appointment | `POST /api/appointments/book` + `GET /api/appointments/me` |
| Payments | UC-09 Make Payment | `POST /api/payments/authorize`, `POST /api/payments/validate`, `GET /api/payments/:id` |
| Medical Records | UC-10 View Medical Records | `GET /api/medical-records/me` + `/me/export` |
| Medical Records | UC-14 Search Patients | `GET /api/patients` |
| Medical Records | UC-15 Consult Patient Records | `GET /api/medical-records/:patientId` |
| Medical Records | UC-16 Update Treatment Notes | `PATCH /api/medical-records/:recordId` |
| Medical Records | UC-17 Create Prescription | `POST /api/medical-records/:recordId/prescriptions` |
| Triage | UC-18 View Triage Queue | `GET /api/triage/queue` |
| Triage | UC-19 Create Triage Case | `POST /api/triage` |
| Triage | UC-20 Update Triage Priority | `PATCH /api/triage/:id/priority` |
| Triage | UC-21 Update Triage Status | `PATCH /api/triage/:id/status` |
| Triage | UC-22 Broadcast Triage Queue | `POST /api/triage/broadcast` |
| Resources | UC-23 View Beds | `GET /api/resources/beds` |
| Resources | UC-24 Assign Bed | `PATCH /api/resources/beds/:id/assign` |
| Resources | UC-25 Release Bed | `PATCH /api/resources/beds/:id/release` |
| Resources | UC-26 View Medical Devices | `GET /api/resources/devices` |
| Resources | UC-27 Assign Device | `PATCH /api/resources/devices/:id/assign` |
| Resources | UC-28 Update Device Status | `PATCH /api/resources/devices/:id/status` |
| Admin | UC-29 Add Hospital | `POST /api/admin/hospitals` |
| Admin | UC-30 Modify Hospital | `PATCH /api/admin/hospitals/:id` |
| Admin | UC-31 Remove Hospital | `DELETE /api/admin/hospitals/:id` |
| Admin | UC-32 Add Department | `POST /api/admin/departments` |
| Admin | UC-33 Modify Department | `PATCH /api/admin/departments/:id` |
| Admin | UC-34 Remove Department | `DELETE /api/admin/departments/:id` |
| Admin | UC-35 Add Bed | `POST /api/admin/beds` |
| Admin | UC-36 Modify Bed | `PATCH /api/admin/beds/:id` |
| Admin | UC-37 Remove Bed | `DELETE /api/admin/beds/:id` |
| Admin | UC-38 Add Medical Device | `POST /api/admin/medical-devices` |
| Admin | UC-39 Create Staff Account | `POST /api/admin/staff` |
| Admin | UC-40 Deactivate Staff Account | `PATCH /api/admin/staff/:id/deactivate` |
| Admin | UC-41 Assign Role-Based Access | `PATCH /api/admin/staff/:id/role` |
| Audit | UC-42 View Audit Logs | `GET /api/admin/audit-logs` |

---

## 4. User Flows

### 4.1 Account Registration and Login

```
[Landing Page] → Click "Register" → Fill form (name, email, password, role)
                → POST /api/auth/register → JWT returned → Redirect to role dashboard
                → [or] Click "Login" → Enter credentials
                → POST /api/auth/login → JWT returned → Redirect to role dashboard
```

The JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every subsequent request. The `AuthContext` in React reads from `localStorage` on initial load and verifies the token by calling `GET /api/auth/me`. If the token is expired or invalid, the user is redirected to `/login`.

Password recovery sends a fixed response ("If the email exists, a recovery link has been sent") regardless of whether the email exists, as a security measure against email enumeration. No actual email is dispatched in this prototype.

### 4.2 Appointment Search, Booking, and Payment

```
[Patient Dashboard] → "Book Appointment"
                     → Select department (dropdown from GET /api/departments)
                     → Select doctor (dropdown filtered by department from GET /api/doctors)
                     → Select date (date picker)
                     → Click "Search" → GET /api/timeslots with filters
                     → View available slots → Click "Book" on a slot
                     → Confirm booking → POST /api/appointments/book
                     → Success → "View My Appointments"
                     → In appointments list, click "Pay Now" on unpaid appointment
                     → Enter card number (4242 4242 4242 4242 for success)
                     → POST /api/payments/authorize
                     → Success → Transaction confirmed with COMPLETED status
```

The booking endpoint uses a Prisma `$transaction` to atomically create the Appointment and mark the TimeSlot as booked. If two patients attempt to book the same slot simultaneously, one will receive a 409 Conflict. Payment with any card other than 4242... returns 402 with an error message.

### 4.3 Medical Record Consultation and Update

```
[Doctor Dashboard] → "Search Patients" → Enter name/email
                    → GET /api/patients?search=<term> → Click patient card
                    → View all medical records for that patient
                    → Allergies highlighted with severity color coding
                    → Click "Edit Record" on a record
                    → Update diagnosis and/or notes → PATCH /api/medical-records/:id
                    → Click "Add Prescription" on a record
                    → Fill medication, dosage, frequency, dates
                    → POST /api/medical-records/:id/prescriptions
```

### 4.4 Triage Queue Management

```
[Nurse Dashboard] → "Triage Queue"
                   → View full queue sorted by priority (CRITICAL first)
                   → Each case shows: patient name, symptoms, priority badge, status badge
                   → Use dropdowns to change priority (LOW→CRITICAL) or status
                   → PATCH /api/triage/:id/priority or /status
                   → Click "New Case" → Enter patient ID and symptoms
                   → POST /api/triage → Case created with LOW priority, WAITING status
                   → Click "Broadcast Queue" → POST /api/triage/broadcast
                   → Console shows simulated hospital display output
```

### 4.5 Bed and Device Management

```
[Nurse Dashboard] → "Beds" → Grid view of all beds
                   → Green left border = UNOCCUPIED, Orange = OCCUPIED
                   → Click "Assign" → PATCH /api/resources/beds/:id/assign
                   → Click "Release" → PATCH /api/resources/beds/:id/release
                   → "Devices" → Grid view of all devices
                   → Click "Assign" on AVAILABLE device → PATCH /api/resources/devices/:id/assign
                   → Quick buttons to switch status: "Set Avail", "Set In Use", "Set Maint"
                   → PATCH /api/resources/devices/:id/status
```

### 4.6 Admin Infrastructure and Staff Management

```
[Admin Dashboard] → "Infrastructure"
                   → Tabbed interface: Hospitals / Departments / Beds / Devices
                   → Each tab has create form + update section + delete section
                   → Lists existing data where available
                   → "Staff Management"
                   → Create staff: fill name, email, password, role, department
                   → Deactivate: enter staff ID → PATCH /api/admin/staff/:id/deactivate
                   → Change role: enter staff ID + select new role → PATCH /api/admin/staff/:id/role
                   → "Audit Logs" → View all admin actions with timestamps and admin info
```

---

## 5. Application Implementation and Documentation

### 5.1 Architecture Choice

The system follows a three-tier client-server architecture:

```
[React SPA] ←→ [Express REST API] ←→ [SQLite via Prisma ORM]
```

This architecture was chosen for several reasons:

1. **Separation of concerns.** The frontend is a pure SPA that only handles presentation and user interaction. All business logic lives in the backend services. This allows the API to be consumed by other clients (e.g., a mobile app) without modification.

2. **RESTful API.** HTTP is universal, well-understood, and easy to debug. Every resource is addressable by URL, and standard HTTP methods (GET, POST, PATCH, DELETE) map cleanly to CRUD operations.

3. **Stateless authentication.** JWT tokens eliminate the need for server-side session storage, simplifying horizontal scaling if the prototype were to be deployed to multiple servers.

4. **Lightweight database.** SQLite was chosen because it requires no separate database server process. The entire database is a single file (`dev.db`), which simplifies setup and testing. Prisma ORM provides type-safe access and migration management.

The frontend uses React with Vite for fast development iteration. React Router handles client-side routing with role-based route protection. Axios provides a consistent HTTP client with automatic JWT attachment and 401 interception.

### 5.2 Language Used

Both frontend and backend are written in **TypeScript** (target ES2020). TypeScript was chosen for:

- Static type checking across the full stack, catching interface mismatches at compile time rather than runtime.
- Shared type definitions between frontend and backend (though in this prototype, types are duplicated rather than shared via a monorepo package).
- Better IDE support (autocompletion, refactoring, navigation).

### 5.3 Dependencies

**Backend (`server/package.json`):**

| Dependency | Version | Purpose |
|------------|---------|---------|
| express | ^4.21 | HTTP framework |
| cors | ^2.8 | Cross-origin support |
| dotenv | ^16.4 | Environment variable loading |
| zod | ^3.24 | Request validation |
| jsonwebtoken | ^9.0 | JWT generation and verification |
| bcryptjs | ^2.4 | Password hashing |
| @prisma/client | ^7.8 | Database ORM client |
| @prisma/adapter-better-sqlite3 | ^7.8 | SQLite adapter for Prisma |
| better-sqlite3 | ^11.7 | SQLite driver |
| typescript | ^5.0 | Language compiler |
| tsx | ^4.19 | TypeScript execution for development |
| vitest | ^4.1 | Test runner |
| supertest | ^7.1 | HTTP assertion library |

**Frontend (`client/package.json`):**

| Dependency | Version | Purpose |
|------------|---------|---------|
| react | ^18.0 | UI library |
| react-dom | ^18.0 | React DOM renderer |
| react-router-dom | ^7.x | Client-side routing |
| axios | ^1.x | HTTP client |
| vite | ^5.4 | Build tool and dev server |
| @vitejs/plugin-react | ^4.x | Vite React integration |

### 5.4 Project Database

The database is **SQLite** accessed through **Prisma ORM v7**. The database file is `server/dev.db`. The schema is defined in `server/prisma/schema.prisma` and contains **18 models** and **8 enums**:

**Enums (8):**
- `UserRole`: PATIENT, DOCTOR, NURSE, ADMIN
- `AppointmentStatus`: REQUESTED, BOOKED, PAID, COMPLETED
- `PaymentStatus`: PENDING, COMPLETED, FAILED
- `BedStatus`: UNOCCUPIED, OCCUPIED
- `DeviceStatus`: AVAILABLE, IN_USE, UNDER_MAINTENANCE
- `TriagePriority`: LOW, MEDIUM, HIGH, CRITICAL
- `TriageStatus`: WAITING, IN_PROGRESS, COMPLETED
- `AccountStatus`: ACTIVE, INACTIVE, SUSPENDED

**Models (18):**
- `UserAccount`, `PatientProfile`, `StaffProfile`
- `HospitalNetwork`, `Hospital`, `Department`
- `TimeSlot`, `Appointment`, `PaymentTransaction`
- `MedicalRecord`, `Allergy`, `Prescription`
- `TriageCase`, `Bed`, `MedicalDevice`
- `Schedule`, `Shift`, `AuditLog`

The schema uses Prisma relations extensively. Foreign keys are defined through the Prisma relation syntax and enforced at the database level through indexed columns.

### 5.5 Project Structure

```
healthcore-management/
├── docs/                          # Documentation
│   ├── api-endpoints.md           # Full API reference
│   ├── architecture.md            # Architecture decisions
│   ├── D3-report.md               # This document
│   ├── implemented-use-cases.md   # Use case status
│   ├── screenshots/               # UI screenshots
│   └── user-flows/                # User flow diagrams
├── server/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.ts                # Seed data
│   ├── src/
│   │   ├── app.ts                 # Express app setup
│   │   ├── server.ts              # Server entry point
│   │   ├── middleware/            # Auth, role, error middleware
│   │   ├── modules/
│   │   │   ├── auth/              # Auth controller, routes, service
│   │   │   ├── appointments/      # Appointment controller, routes, service
│   │   │   ├── payments/          # Payment controller, routes, service
│   │   │   ├── medical-records/   # Records controller, routes, service
│   │   │   ├── triage/            # Triage controller, routes
│   │   │   ├── resources/         # Beds/devices controllers, routes, services
│   │   │   ├── infrastructure/    # Admin controller, routes
│   │   │   ├── audit/             # Audit controller, routes, service
│   │   │   ├── user-management/   # Role-specific services
│   │   │   └── system-core/       # Adapters (payment, notification, display)
│   │   └── utils/                 # Prisma client, config
│   ├── tests/                     # Vitest test files
│   ├── package.json
│   ├── vitest.config.ts
│   └── tsconfig.json
├── client/
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx               # React entry with BrowserRouter
│   │   ├── App.tsx                # Route definitions
│   │   ├── api/apiClient.ts       # Axios instance with JWT interceptor
│   │   ├── auth/                  # AuthContext, ProtectedRoute
│   │   ├── layouts/               # MainLayout with Navbar
│   │   ├── components/            # Navbar
│   │   ├── pages/
│   │   │   ├── public/            # Home, Login, Register, PasswordRecovery
│   │   │   ├── patient/           # Dashboard, Search, Book, Appointments, Pay, Records
│   │   │   ├── doctor/            # Dashboard, Patients, Records, Prescription, Schedule
│   │   │   ├── nurse/             # Dashboard, Triage, Beds, Devices
│   │   │   └── admin/             # Dashboard, Staff, Infrastructure, Audit
│   │   └── styles/                # Global CSS
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 6. API Development

### 6.1 Design Principles

The API follows RESTful conventions:

- Resources are identified by URL paths (e.g., `/api/appointments`, `/api/medical-records/:id`).
- HTTP methods map to operations: GET (read), POST (create), PATCH (partial update), DELETE (delete).
- Responses use a consistent envelope: `{ status: "ok"|"error", ...data }`.
- Errors include a human-readable `message` field and, where applicable, a `statusCode` field matching the HTTP status.
- Authentication is via JWT Bearer token in the `Authorization` header.
- Role-based access is enforced at the route level via the `roleMiddleware` factory.

### 6.2 Middleware Stack

Every route passes through the following middleware pipeline:

1. **CORS** — allows cross-origin requests from the Vite dev server.
2. **JSON body parser** — parses `application/json` request bodies.
3. **Auth middleware** (`authMiddleware`) — extracts and verifies the JWT from the `Authorization` header. Attaches `req.user` with `{ userId, role, email, name }`.
4. **Role middleware** (`roleMiddleware`) — checks that `req.user.role` is included in the allowed roles array. Returns 403 if not.
5. **Controller** — executes the business logic and returns a response.
6. **Error middleware** — catches any thrown `AppError` or unexpected errors and returns a structured JSON error response.

### 6.3 Validation

All POST and PATCH request bodies are validated using **Zod schemas**. Validation errors return HTTP 400 with a message describing the first validation failure. URL parameters (IDs) are validated as positive integers where applicable.

### 6.4 Endpoint Summary

The full API surface consists of **44 endpoints** across 8 modules:

| Module | Endpoints | Auth Required | Role Gate |
|--------|-----------|---------------|-----------|
| Auth | 5 | Mixed (3 public, 2 auth) | None |
| Appointments | 5 | Yes | PATIENT (2) |
| Payments | 3 | Yes | PATIENT |
| Medical Records | 6 | Yes | PATIENT (2), DOCTOR (4) |
| Triage | 5 | Yes | NURSE/DOCTOR/ADMIN (view), NURSE (mutations) |
| Resources | 6 | Yes | NURSE (mutations) |
| Admin | 13 | Yes | ADMIN |
| Audit | 1 | Yes | ADMIN |

Complete documentation for every endpoint (request body, response shape, error conditions, D2 method mapping) is available in `docs/api-endpoints.md`.

---

## 7. API Documentation

The full API documentation is maintained in `docs/api-endpoints.md`. Each endpoint is documented with:

- **Use case** reference (UC-xx)
- **D2 class/method mapping** — which classes and methods from the D2 diagram are involved
- **HTTP method** and **URL**
- **Required role**
- **Request body** (with JSON schema)
- **Success response** (with JSON example and HTTP status)
- **Error responses** (table of HTTP status codes and conditions)

The document is organised into 8 sections matching the module structure and includes a summary table of all 44 endpoints.

---

## 8. GitHub Repository and Deployment Information

The project source code is hosted on GitHub:

**Repository:** `https://github.com/<institution>/healthcore-management` (placeholder — replace with actual URL)

### Running the Project

**Prerequisites:** Node.js 18+ and npm.

```bash
# Backend setup
cd server
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev           # starts on port 3000

# Frontend setup (separate terminal)
cd client
npm install
npm run dev           # starts on port 5173, proxies /api to 3000

# Tests
cd server
npm test              # runs 52 tests with Vitest
```

### Build Commands

```bash
cd server && npm run build    # TypeScript compilation
cd client && npm run build    # TypeScript check + Vite production build
```

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| patient@healthcore.test | Password123! | PATIENT |
| doctor@healthcore.test | Password123! | DOCTOR |
| nurse@healthcore.test | Password123! | NURSE |
| admin@healthcore.test | Password123! | ADMIN |

All users are created by the seed script (`npm run seed`).

---

## 9. Testing

### 9.1 Testing Strategy

Testing is performed at the **integration level** using **Vitest** (v4) with **Supertest**. Tests make real HTTP requests against the Express application (without binding to a network port) and assert on response status codes, body shapes, and state changes.

The test suite uses the **same SQLite database** as development (`server/dev.db`). There is no separate test database. Tests are designed to be **idempotent** — they discover entity IDs dynamically from API responses rather than hardcoding them. The seed must be run before the test suite to ensure a known state.

### 9.2 Test Structure

8 test files containing **52 tests**:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `auth.test.ts` | 7 | Registration, duplicate rejection, login, invalid password, nonexistent user, /me with and without token |
| `appointments.test.ts` | 5 | List departments, list timeslots, book, double-book (409), list my appointments |
| `payments.test.ts` | 3 | Approve 4242 card (201), reject invalid card (402), handle spaces in card number |
| `medical-records.test.ts` | 6 | Patient view, patient export, doctor update, doctor create prescription, search patients, consult records |
| `triage.test.ts` | 7 | View queue, create case, update priority (→CRITICAL), reorder verification, update status (→COMPLETED), broadcast, invalid priority (400) |
| `resources.test.ts` | 7 | View beds, assign (→OCCUPIED), release (→UNOCCUPIED), view devices, assign (→IN_USE), update status (→UNDER_MAINTENANCE), invalid status (400) |
| `admin.test.ts` | 10 | Create hospital, department, bed, update bed, delete bed, create device, create staff, deactivate staff, change role, audit log |
| `rbac.test.ts` | 7 | Cross-role access attempts: patient→admin (403), doctor→admin (403), doctor→assign-bed (403), nurse→create-staff (403), patient→doctor-endpoint (403), patient→triage-update (403), doctor→patient-endpoint (403) |

### 9.3 Test Configuration

Tests run sequentially (`fileParallelism: false` in `vitest.config.ts`) to avoid database conflicts. Each test file uses `beforeAll` to authenticate as the appropriate role and store the token.

### 9.4 Running Tests

```bash
cd server
npm run seed    # ensure clean state
npm test        # vitest run (52 tests, ~8 seconds)
```

### 9.5 Test Results

All 52 tests pass across 8 test files. The build also passes TypeScript compilation (`tsc`) and Vite production build without errors.

---

## 10. Team Assessment

### 10.1 Work Organization

The project was developed iteratively over several sessions, following a module-by-module approach:

1. **Project scaffolding.** Directory structure, configuration files (TypeScript, Vite, Vitest, Prisma), package dependencies, and the Express application skeleton were set up first.
2. **Database schema and seed.** The Prisma schema was designed and migrated. A comprehensive seed script was written to create demo data for all 18 tables.
3. **Core infrastructure.** Auth middleware, role middleware, error middleware, and the Prisma client singleton were implemented.
4. **Module implementation (backend).** Each module (auth, appointments, payments, medical records, triage, resources, admin infrastructure, audit) was implemented in order, with each module consisting of: service → controller → routes → app registration.
5. **Module implementation (frontend).** Public pages (login, register, home) were built first, followed by role-specific page groups (patient, doctor, nurse, admin).
6. **Testing.** Test files were written for each backend module, covering happy paths, error conditions, and role-based access control.
7. **Documentation.** The API reference and this D3 report were written.

### 10.2 Roles and Activities

The project was carried out by a single developer who performed all roles:

- **System architect:** Designed the module structure, middleware pipeline, and database schema.
- **Backend developer:** Implemented all 44 endpoints across 8 modules, including services, controllers, routes, and middleware.
- **Frontend developer:** Built the React SPA with role-based routing, 6 public pages, and 18 role-specific pages.
- **QA engineer:** Wrote and maintained the 52-test integration suite.
- **Documentation writer:** Authored the API reference and this report.

### 10.3 Workload and Distribution

| Activity | Estimated Effort |
|----------|-----------------|
| Project setup and configuration | ~2 hours |
| Database schema design and seed | ~3 hours |
| Backend module implementation (8 modules, 44 endpoints) | ~20 hours |
| Frontend implementation (24 pages) | ~16 hours |
| Testing (8 test files, 52 tests) | ~6 hours |
| Documentation | ~4 hours |
| **Total** | **~51 hours** |

All work was distributed evenly across the development phase rather than concentrated at any single point. The modular architecture allowed parallelisation of certain tasks (e.g., frontend pages could be built once the API contract was stable).

### 10.4 Critical Issues

1. **Prisma v7 adapter requirement.** Prisma v7 dropped the built-in SQLite support and requires `@prisma/adapter-better-sqlite3` + `better-sqlite3` to be passed as an adapter in the PrismaClient constructor. This was not immediately obvious from the documentation and caused initial setup delays.

2. **Enum sorting.** Prisma sorts enum columns alphabetically by default. For the triage queue, which must sort by clinical priority (CRITICAL=0, HIGH=1, MEDIUM=2, LOW=3), alphabetical sorting produces the wrong order. The sort was moved to application code, which is less efficient for large datasets but acceptable for the prototype.

3. **SQLite auto-increment.** SQLite does not reset auto-increment counters when rows are deleted. Re-seeding produces entities with incrementing IDs rather than resetting to 1. Tests were designed to discover IDs dynamically to handle this, but it means ID predictability is lost after multiple seed runs.

4. **No GET endpoints for certain admin resources.** The admin infrastructure controller provides POST, PATCH, and DELETE for hospitals, departments, and beds, but does not expose GET endpoints for listing them. The frontend works around this by using the read-only `/api/departments` and `/api/resources/beds` endpoints, but there is no way to list hospitals through the API. This was identified as a gap but not critical for the prototype.

5. **Single-developer constraints.** All code was written by one person. This limited the amount of code review, led to some inconsistencies in naming conventions across modules, and meant that no parallel development was possible. In a team setting, backend and frontend could have been developed concurrently.
