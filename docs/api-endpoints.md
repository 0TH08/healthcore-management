# API Endpoints — D3 Documentation

> **HealthCore Management** by TechNova  
> Complete mapping of every REST endpoint to use cases, D2 classes/methods, request/response shapes, and error conditions.

---

## 1. Auth / User Management

All auth routes are mounted under `/api/auth`.

---

### 1.1 Register

**Use case:** UC-01 Register  
**D2 methods:**
- `UserAccount.register()`
- `PatientProfile.create()`

**Method:** `POST`  
**URL:** `/api/auth/register`  
**Required role:** None (public)

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass"
}
```

**Success (201):**
```json
{
  "status": "ok",
  "token": "<JWT>",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "PATIENT"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid email format, missing name, password too short |
| 409 | Email already registered |

---

### 1.2 Login

**Use case:** UC-02 Login  
**D2 methods:**
- `UserAccount.authenticate()`
- `AuthService.generateToken()`

**Method:** `POST`  
**URL:** `/api/auth/login`  
**Required role:** None (public)

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepass"
}
```

**Success (200):**
```json
{
  "status": "ok",
  "token": "<JWT>",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "PATIENT"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing email or password |
| 401 | Invalid email or password |

---

### 1.3 Logout

**Use case:** UC-03 Logout  
**D2 methods:**
- `UserAccount.logout()`
- `AuthService.invalidateToken()`

**Method:** `POST`  
**URL:** `/api/auth/logout`  
**Required role:** Any authenticated user

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "message": "Logged out successfully"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |

---

### 1.4 Get Current User

**Use case:** UC-01 Register, UC-02 Login (session verification)  
**D2 methods:**
- `UserAccount.getProfile()`

**Method:** `GET`  
**URL:** `/api/auth/me`  
**Required role:** Any authenticated user

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "PATIENT"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |
| 404 | User not found |

---

### 1.5 Recover Password

**Use case:** UC-04 Recover Password  
**D2 methods:**
- `UserAccount.requestPasswordReset()`
- `NotificationService.sendRecoveryEmail()`

**Method:** `POST`  
**URL:** `/api/auth/recover-password`  
**Required role:** None (public)

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Success (200):**
```json
{
  "status": "ok",
  "message": "If the email exists, a recovery link has been sent."
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid email format |

> Note: The same message is always returned regardless of whether the email exists (security best practice).

---

## 2. Appointments

All appointment routes are mounted under `/api`.

---

### 2.1 List Departments

**Use case:** UC-05 List Departments  
**D2 methods:**
- `Department.list()`
- `AppointmentService.getDepartments()`

**Method:** `GET`  
**URL:** `/api/departments`  
**Required role:** Any authenticated user

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "departments": [
    {
      "id": 1,
      "name": "Cardiology",
      "hospitalName": "General Hospital"
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |

---

### 2.2 List Doctors

**Use case:** UC-06 List Doctors  
**D2 methods:**
- `StaffProfile.findByRole()`
- `AppointmentService.getDoctors()`

**Method:** `GET`  
**URL:** `/api/doctors?departmentId=<number>`  
**Required role:** Any authenticated user

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `departmentId` | number | No | Filter by department |

**Success (200):**
```json
{
  "status": "ok",
  "doctors": [
    {
      "id": 2,
      "name": "Dr. Smith",
      "email": "smith@hospital.com",
      "specialization": "Cardiologist",
      "departmentId": 1,
      "departmentName": "Cardiology"
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |

---

### 2.3 View Available Timeslots

**Use case:** UC-07 View Available Timeslots  
**D2 methods:**
- `TimeSlot.findAvailable()`
- `TimeSlotService.getAvailableSlots()`

**Method:** `GET`  
**URL:** `/api/timeslots?departmentId=<number>&doctorId=<number>&date=<string>`  
**Required role:** Any authenticated user

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `departmentId` | number | No | Filter by department |
| `doctorId` | number | No | Filter by doctor |
| `date` | string (YYYY-MM-DD) | No | Filter by date |

**Success (200):**
```json
{
  "status": "ok",
  "timeSlots": [
    {
      "id": 10,
      "date": "2026-07-06T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "09:30",
      "isBooked": false,
      "doctorName": "Dr. Smith",
      "departmentName": "Cardiology"
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | No token or invalid token |

---

### 2.4 Book Appointment

**Use case:** UC-08 Book Appointment  
**D2 methods:**
- `Patient.bookAppointment()`
- `AppointmentService.book()`
- `Appointment.checkAvailability()`
- `TimeSlot.reserve()`

**Method:** `POST`  
**URL:** `/api/appointments/book`  
**Required role:** PATIENT

**Request:**
```json
{
  "timeSlotId": 10
}
```

**Success (201):**
```json
{
  "status": "ok",
  "appointment": {
    "id": 5,
    "status": "BOOKED",
    "date": "2026-07-06T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "09:30",
    "doctorName": "Dr. Smith",
    "patientName": "John Doe"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid timeSlotId |
| 401 | Unauthorized |
| 403 | Forbidden (not PATIENT) |
| 404 | TimeSlot not found |
| 409 | TimeSlot already booked |

---

### 2.5 List My Appointments

**Use case:** UC-08 Book Appointment (view booked appointments)  
**D2 methods:**
- `Patient.getAppointments()`
- `AppointmentService.getPatientAppointments()`

**Method:** `GET`  
**URL:** `/api/appointments/me`  
**Required role:** PATIENT

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "appointments": [
    {
      "id": 5,
      "status": "BOOKED",
      "date": "2026-07-06T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "09:30",
      "doctorName": "Dr. Smith",
      "departmentName": "Cardiology",
      "createdAt": "2026-07-05T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden (not PATIENT) |

---

## 3. Payments

All payment routes are mounted under `/api/payments`.

---

### 3.1 Authorize Payment

**Use case:** UC-09 Make Payment  
**D2 methods:**
- `Patient.payForAppointment()`
- `PaymentTransaction.create()`
- `PaymentTransaction.authorize()`
- `PaymentGateway.authorize()`
- `Appointment.markAsPaid()`

**Method:** `POST`  
**URL:** `/api/payments/authorize`  
**Required role:** PATIENT

**Request:**
```json
{
  "appointmentId": 5,
  "cardNumber": "4242424242424242",
  "amount": 150.00
}
```

**Success (201):**
```json
{
  "status": "ok",
  "transaction": {
    "id": 3,
    "amount": 150.00,
    "status": "COMPLETED",
    "paymentDate": "2026-07-05T10:05:00.000Z",
    "gatewayTransactionId": "txn_abc123"
  }
}
```

**Payment failed (402):**
```json
{
  "status": "error",
  "message": "Card declined"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid parameters |
| 401 | Unauthorized |
| 403 | Forbidden (not PATIENT) |
| 402 | Card declined (non-4242 card) |

> Note: Card `4242 4242 4242 4242` (spaces ignored) always succeeds. Any other card fails with 402.

---

### 3.2 Validate Payment

**Use case:** UC-09 Make Payment (confirmation)  
**D2 methods:**
- `PaymentTransaction.validate()`

**Method:** `POST`  
**URL:** `/api/payments/validate`  
**Required role:** PATIENT

**Request:**
```json
{
  "transactionId": 3
}
```

**Success (200):**
```json
{
  "status": "ok",
  "transaction": {
    "id": 3,
    "amount": 150.00,
    "status": "COMPLETED",
    "paymentDate": "2026-07-05T10:05:00.000Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid transactionId |
| 401 | Unauthorized |
| 403 | Forbidden (not PATIENT) |
| 404 | Transaction not found |

---

### 3.3 Get Transaction

**Use case:** UC-09 Make Payment (view transaction details)  
**D2 methods:**
- `PaymentTransaction.getDetails()`

**Method:** `GET`  
**URL:** `/api/payments/:transactionId`  
**Required role:** PATIENT

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `transactionId` | number | Yes | Transaction ID |

**Success (200):**
```json
{
  "status": "ok",
  "transaction": {
    "id": 3,
    "amount": 150.00,
    "status": "COMPLETED",
    "paymentDate": "2026-07-05T10:05:00.000Z",
    "appointment": {
      "id": 5,
      "status": "PAID",
      "doctorName": "Dr. Smith",
      "date": "2026-07-06T00:00:00.000Z",
      "startTime": "09:00"
    }
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid transactionId |
| 401 | Unauthorized |
| 403 | Forbidden (not PATIENT) |
| 404 | Transaction not found |

---

## 4. Medical Records

All medical record routes are mounted under `/api`.

---

### 4.1 View My Medical Records

**Use case:** UC-10 View Medical Records  
**D2 methods:**
- `Patient.viewMedicalRecords()`
- `MedicalRecordService.getPatientRecords()`

**Method:** `GET`  
**URL:** `/api/medical-records/me`  
**Required role:** PATIENT

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "records": [
    {
      "id": 1,
      "patientId": 1,
      "diagnosis": "Hypertension",
      "notes": "Patient shows elevated blood pressure",
      "date": "2026-06-15T00:00:00.000Z",
      "createdAt": "2026-06-15T10:00:00.000Z",
      "updatedAt": "2026-06-15T10:00:00.000Z",
      "allergies": [
        {
          "id": 1,
          "allergen": "Penicillin",
          "severity": "MODERATE",
          "reaction": "Skin rash"
        }
      ],
      "prescriptions": [
        {
          "id": 1,
          "medication": "Lisinopril",
          "dosage": "10mg",
          "frequency": "Once daily",
          "startDate": "2026-06-15T00:00:00.000Z",
          "endDate": null
        }
      ]
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden (not PATIENT) |

---

### 4.2 Export Medical Records

**Use case:** UC-10 View Medical Records (export)  
**D2 methods:**
- `Patient.exportMedicalRecords()`
- `MedicalRecordService.exportRecords()`

**Method:** `GET`  
**URL:** `/api/medical-records/me/export`  
**Required role:** PATIENT

**Request:** (none)

**Success (200):**  
Text file download with `Content-Type: text/plain` and `Content-Disposition: attachment; filename="medical-records.txt"`.

Body:
```
MEDICAL RECORDS EXPORT
=====================

Record #1
Date: 2026-06-15
Diagnosis: Hypertension
Notes: Patient shows elevated blood pressure
Allergies:
  - Penicillin (MODERATE): Skin rash
Prescriptions:
  - Lisinopril | 10mg | Once daily | 2026-06-15
---
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden (not PATIENT) |
| 404 | No records found for export |

---

### 4.3 Search Patients

**Use case:** UC-14 Search Patients (Doctor)  
**D2 methods:**
- `Doctor.searchPatients()`
- `DoctorService.searchPatients()`

**Method:** `GET`  
**URL:** `/api/patients?search=<term>`  
**Required role:** DOCTOR

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Search by name or email (case-insensitive contains) |

**Success (200):**
```json
{
  "status": "ok",
  "patients": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "dateOfBirth": "1990-01-15",
      "phone": "+1234567890",
      "address": "123 Main St",
      "recentRecords": [
        {
          "id": 1,
          "diagnosis": "Hypertension",
          "notes": "Patient shows elevated blood pressure",
          "date": "2026-06-15T00:00:00.000Z",
          "allergies": [ ... ],
          "prescriptions": [ ... ]
        }
      ]
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden (not DOCTOR) |

---

### 4.4 Consult Patient Medical Records (Doctor)

**Use case:** UC-15 Consult Patient Records  
**D2 methods:**
- `Doctor.consultMedicalRecords()`
- `DoctorService.consultMedicalRecords()`
- `MedicalRecordService.getPatientRecords()`

**Method:** `GET`  
**URL:** `/api/medical-records/:patientId`  
**Required role:** DOCTOR

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | number | Yes | Patient user account ID |

**Success (200):**
```json
{
  "status": "ok",
  "records": [ /* same shape as 4.1 */ ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid patient ID |
| 401 | Unauthorized |
| 403 | Forbidden (not DOCTOR) |
| 404 | Patient profile not found |

---

### 4.5 Update Medical Record

**Use case:** UC-16 Update Treatment Notes  
**D2 methods:**
- `Doctor.updateRecord()`
- `MedicalRecordService.updateRecord()`

**Method:** `PATCH`  
**URL:** `/api/medical-records/:recordId`  
**Required role:** DOCTOR

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `recordId` | number | Yes | Medical record ID |

**Request:**
```json
{
  "diagnosis": "Chronic Hypertension",
  "notes": "Adjusted medication dosage"
}
```

Both fields are optional; at least one should be provided.

**Success (200):**
```json
{
  "status": "ok",
  "record": {
    "id": 1,
    "patientId": 1,
    "diagnosis": "Chronic Hypertension",
    "notes": "Adjusted medication dosage",
    "date": "2026-06-15T00:00:00.000Z",
    "allergies": [ ... ],
    "prescriptions": [ ... ]
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid record ID or validation error |
| 401 | Unauthorized |
| 403 | Forbidden (not DOCTOR) |
| 404 | Medical record not found |

---

### 4.6 Create Prescription

**Use case:** UC-17 Create Prescription  
**D2 methods:**
- `Doctor.prescribe()`
- `PrescriptionService.generate()`

**Method:** `POST`  
**URL:** `/api/medical-records/:recordId/prescriptions`  
**Required role:** DOCTOR

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `recordId` | number | Yes | Medical record ID |

**Request:**
```json
{
  "medication": "Ibuprofen",
  "dosage": "400mg",
  "frequency": "As needed",
  "startDate": "2026-07-01",
  "endDate": "2026-07-14"
}
```

`endDate` is optional.

**Success (201):**
```json
{
  "status": "ok",
  "prescription": {
    "id": 3,
    "medication": "Ibuprofen",
    "dosage": "400mg",
    "frequency": "As needed",
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-07-14T00:00:00.000Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing required fields or invalid record ID |
| 401 | Unauthorized |
| 403 | Forbidden (not DOCTOR) |
| 404 | Medical record not found |

---

## 5. Triage

All triage routes are mounted under `/api/triage`.

---

### 5.1 View Triage Queue

**Use case:** UC-18 View Triage Queue  
**D2 methods:**
- `Nurse.viewTriageQueue()`
- `TriageCaseService.getQueue()`

**Method:** `GET`  
**URL:** `/api/triage/queue`  
**Required role:** NURSE, DOCTOR, or ADMIN

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "queue": [
    {
      "id": 1,
      "patientId": 1,
      "patientName": "John Doe",
      "priority": "HIGH",
      "status": "WAITING",
      "symptoms": "Chest pain radiating to left arm, shortness of breath",
      "notes": "Patient has history of heart disease",
      "nurseName": "Nurse Jane",
      "createdAt": "2026-07-05T09:00:00.000Z",
      "updatedAt": "2026-07-05T09:00:00.000Z"
    }
  ]
}
```

Queue is sorted by priority order: CRITICAL → HIGH → MEDIUM → LOW, then by creation date.

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden (insufficient role) |

---

### 5.2 Create Triage Case

**Use case:** UC-19 Create Triage Case  
**D2 methods:**
- `Nurse.createTriageCase()`
- `TriageCaseService.create()`

**Method:** `POST`  
**URL:** `/api/triage`  
**Required role:** NURSE

**Request:**
```json
{
  "patientUserId": 1,
  "symptoms": "Severe headache, blurred vision",
  "notes": "Patient reports sudden onset"
}
```

`notes` is optional.

**Success (201):**
```json
{
  "status": "ok",
  "triageCase": {
    "id": 4,
    "patientName": "John Doe",
    "priority": "LOW",
    "status": "WAITING",
    "symptoms": "Severe headache, blurred vision",
    "notes": "Patient reports sudden onset",
    "nurseName": "Nurse Jane",
    "createdAt": "2026-07-05T10:00:00.000Z"
  }
}
```

New cases are created with default priority `LOW` and default status `WAITING`.

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing patientUserId or symptoms |
| 401 | Unauthorized |
| 403 | Forbidden (not NURSE) |
| 404 | Patient or nurse profile not found |

---

### 5.3 Update Triage Priority

**Use case:** UC-20 Update Triage Priority  
**D2 methods:**
- `Nurse.updatePriority()`
- `TriageCaseService.updatePriority()`

**Method:** `PATCH`  
**URL:** `/api/triage/:triageId/priority`  
**Required role:** NURSE

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `triageId` | number | Yes | Triage case ID |

**Request:**
```json
{
  "priority": "CRITICAL"
}
```

Valid priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

**Success (200):**
```json
{
  "status": "ok",
  "triageCaseId": 1
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid triage ID or invalid priority value |
| 401 | Unauthorized |
| 403 | Forbidden (not NURSE) |
| 404 | Triage case not found |

---

### 5.4 Update Triage Status

**Use case:** UC-21 Update Triage Status  
**D2 methods:**
- `Nurse.updateStatus()`
- `TriageCaseService.updateStatus()`

**Method:** `PATCH`  
**URL:** `/api/triage/:triageId/status`  
**Required role:** NURSE

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `triageId` | number | Yes | Triage case ID |

**Request:**
```json
{
  "status": "IN_PROGRESS"
}
```

Valid statuses: `WAITING`, `IN_PROGRESS`, `COMPLETED`.

**Success (200):**
```json
{
  "status": "ok",
  "triageCaseId": 1
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid triage ID or invalid status value |
| 401 | Unauthorized |
| 403 | Forbidden (not NURSE) |
| 404 | Triage case not found |

---

### 5.5 Broadcast Triage Queue

**Use case:** UC-22 Broadcast Triage Queue  
**D2 methods:**
- `Nurse.broadcastQueue()`
- `TriageCaseService.getQueue()`
- `InformationDisplayAdapter.broadcast()`

**Method:** `POST`  
**URL:** `/api/triage/broadcast`  
**Required role:** NURSE

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "broadcast": true,
  "queue": [ /* full sorted queue — same shape as 5.1 */ ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden (not NURSE) |

---

## 6. Resources

All resource routes are mounted under `/api/resources`.

---

### 6.1 View Beds

**Use case:** UC-23 View Beds  
**D2 methods:**
- `Nurse.viewBeds()`
- `BedService.listBeds()`

**Method:** `GET`  
**URL:** `/api/resources/beds`  
**Required role:** Any authenticated user

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "beds": [
    {
      "id": 1,
      "bedNumber": "B-101",
      "status": "OCCUPIED",
      "departmentId": 1,
      "departmentName": "Cardiology",
      "hospitalName": "General Hospital"
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |

---

### 6.2 Assign Bed

**Use case:** UC-24 Assign Bed  
**D2 methods:**
- `Nurse.assignBed()`
- `BedService.assign()`

**Method:** `PATCH`  
**URL:** `/api/resources/beds/:bedId/assign`  
**Required role:** NURSE

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `bedId` | number | Yes | Bed ID |

**Request:** (none — empty body)

**Success (200):**
```json
{
  "status": "ok",
  "bed": {
    "id": 1,
    "bedNumber": "B-101",
    "status": "OCCUPIED"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid bed ID |
| 401 | Unauthorized |
| 403 | Forbidden (not NURSE) |
| 404 | Bed not found |
| 409 | Bed is already occupied |

---

### 6.3 Release Bed

**Use case:** UC-25 Release Bed  
**D2 methods:**
- `Nurse.releaseBed()`
- `BedService.release()`

**Method:** `PATCH`  
**URL:** `/api/resources/beds/:bedId/release`  
**Required role:** NURSE

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `bedId` | number | Yes | Bed ID |

**Request:** (none — empty body)

**Success (200):**
```json
{
  "status": "ok",
  "bed": {
    "id": 1,
    "bedNumber": "B-101",
    "status": "UNOCCUPIED"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid bed ID |
| 401 | Unauthorized |
| 403 | Forbidden (not NURSE) |
| 404 | Bed not found |
| 409 | Bed is already unoccupied |

---

### 6.4 View Devices

**Use case:** UC-26 View Medical Devices  
**D2 methods:**
- `Nurse.viewDevices()`
- `MedicalDeviceService.listDevices()`

**Method:** `GET`  
**URL:** `/api/resources/devices`  
**Required role:** Any authenticated user

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "devices": [
    {
      "id": 1,
      "name": "Ventilator X1",
      "type": "Ventilator",
      "status": "AVAILABLE",
      "departmentId": 1,
      "departmentName": "Cardiology",
      "hospitalName": "General Hospital"
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |

---

### 6.5 Assign Device

**Use case:** UC-27 Assign Device  
**D2 methods:**
- `Nurse.assignDevice()`
- `MedicalDeviceService.assign()`

**Method:** `PATCH`  
**URL:** `/api/resources/devices/:deviceId/assign`  
**Required role:** NURSE

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | number | Yes | Device ID |

**Request:** (none — empty body)

**Success (200):**
```json
{
  "status": "ok",
  "device": {
    "id": 1,
    "name": "Ventilator X1",
    "status": "IN_USE"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid device ID |
| 401 | Unauthorized |
| 403 | Forbidden (not NURSE) |
| 404 | Medical device not found |
| 409 | Device is already in use |

---

### 6.6 Update Device Status

**Use case:** UC-28 Update Device Status  
**D2 methods:**
- `Nurse.updateDeviceStatus()`
- `MedicalDeviceService.updateStatus()`

**Method:** `PATCH`  
**URL:** `/api/resources/devices/:deviceId/status`  
**Required role:** NURSE

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | number | Yes | Device ID |

**Request:**
```json
{
  "status": "UNDER_MAINTENANCE"
}
```

Valid statuses: `AVAILABLE`, `IN_USE`, `UNDER_MAINTENANCE`.

**Success (200):**
```json
{
  "status": "ok",
  "device": {
    "id": 1,
    "name": "Ventilator X1",
    "status": "UNDER_MAINTENANCE"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid device ID or invalid status value |
| 401 | Unauthorized |
| 403 | Forbidden (not NURSE) |
| 404 | Medical device not found |

---

## 7. Admin / Infrastructure

All admin infrastructure routes are mounted under `/api/admin`.

---

### 7.1 Create Hospital

**Use case:** UC-29 Add Hospital  
**D2 methods:**
- `Admin.addHospital()`
- `HospitalService.create()`
- `AuditLogService.record()`

**Method:** `POST`  
**URL:** `/api/admin/hospitals`  
**Required role:** ADMIN

**Request:**
```json
{
  "name": "City Hospital West",
  "address": "456 Oak Avenue",
  "networkId": 1
}
```

**Success (201):**
```json
{
  "status": "ok",
  "hospital": {
    "id": 2,
    "name": "City Hospital West",
    "address": "456 Oak Avenue",
    "networkId": 1,
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid fields |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Hospital network not found |

---

### 7.2 Update Hospital

**Use case:** UC-30 Modify Hospital  
**D2 methods:**
- `Admin.modifyHospital()`
- `HospitalService.update()`
- `AuditLogService.record()`

**Method:** `PATCH`  
**URL:** `/api/admin/hospitals/:hospitalId`  
**Required role:** ADMIN

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `hospitalId` | number | Yes | Hospital ID |

**Request (all fields optional):**
```json
{
  "name": "City Hospital East",
  "address": "789 Elm Street",
  "networkId": 1
}
```

**Success (200):**
```json
{
  "status": "ok",
  "hospital": { /* full hospital object */ }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid hospital ID |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Hospital not found |

---

### 7.3 Delete Hospital

**Use case:** UC-31 Remove Hospital  
**D2 methods:**
- `Admin.removeHospital()`
- `HospitalService.delete()`
- `AuditLogService.record()`

**Method:** `DELETE`  
**URL:** `/api/admin/hospitals/:hospitalId`  
**Required role:** ADMIN

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `hospitalId` | number | Yes | Hospital ID |

**Success (200):**
```json
{
  "status": "ok",
  "message": "Hospital deleted"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid hospital ID |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Hospital not found |
| 409 | Cannot delete hospital with existing departments |

---

### 7.4 Create Department

**Use case:** UC-32 Add Department  
**D2 methods:**
- `Admin.addDepartment()`
- `DepartmentService.create()`
- `AuditLogService.record()`

**Method:** `POST`  
**URL:** `/api/admin/departments`  
**Required role:** ADMIN

**Request:**
```json
{
  "name": "Orthopedics",
  "hospitalId": 1
}
```

**Success (201):**
```json
{
  "status": "ok",
  "department": {
    "id": 4,
    "name": "Orthopedics",
    "hospitalId": 1,
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid fields |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Hospital not found |

---

### 7.5 Update Department

**Use case:** UC-33 Modify Department  
**D2 methods:**
- `Admin.modifyDepartment()`
- `DepartmentService.update()`
- `AuditLogService.record()`

**Method:** `PATCH`  
**URL:** `/api/admin/departments/:departmentId`  
**Required role:** ADMIN

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `departmentId` | number | Yes | Department ID |

**Request (all fields optional):**
```json
{
  "name": "Orthopedic Surgery",
  "hospitalId": 1
}
```

**Success (200):**
```json
{
  "status": "ok",
  "department": { /* full department object */ }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid department ID |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Department not found |

---

### 7.6 Delete Department

**Use case:** UC-34 Remove Department  
**D2 methods:**
- `Admin.removeDepartment()`
- `DepartmentService.delete()`
- `AuditLogService.record()`

**Method:** `DELETE`  
**URL:** `/api/admin/departments/:departmentId`  
**Required role:** ADMIN

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `departmentId` | number | Yes | Department ID |

**Success (200):**
```json
{
  "status": "ok",
  "message": "Department deleted"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid department ID |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Department not found |
| 409 | Cannot delete department with existing dependencies (beds, staff, etc.) |

---

### 7.7 Create Bed (Admin)

**Use case:** UC-35 Add Bed  
**D2 methods:**
- `Admin.addBed()`
- `BedService.create()`
- `AuditLogService.record()`

**Method:** `POST`  
**URL:** `/api/admin/beds`  
**Required role:** ADMIN

**Request:**
```json
{
  "bedNumber": "B-201",
  "departmentId": 1
}
```

**Success (201):**
```json
{
  "status": "ok",
  "bed": {
    "id": 6,
    "bedNumber": "B-201",
    "departmentId": 1,
    "status": "UNOCCUPIED",
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid fields |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Department not found |

---

### 7.8 Update Bed (Admin)

**Use case:** UC-36 Modify Bed  
**D2 methods:**
- `Admin.modifyBed()`
- `BedService.update()`
- `AuditLogService.record()`

**Method:** `PATCH`  
**URL:** `/api/admin/beds/:bedId`  
**Required role:** ADMIN

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `bedId` | number | Yes | Bed ID |

**Request (all fields optional):**
```json
{
  "bedNumber": "B-202",
  "departmentId": 1,
  "status": "OCCUPIED"
}
```

**Success (200):**
```json
{
  "status": "ok",
  "bed": { /* full bed object */ }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid bed ID |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Bed not found |

---

### 7.9 Delete Bed (Admin)

**Use case:** UC-37 Remove Bed  
**D2 methods:**
- `Admin.removeBed()`
- `BedService.delete()`
- `AuditLogService.record()`

**Method:** `DELETE`  
**URL:** `/api/admin/beds/:bedId`  
**Required role:** ADMIN

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `bedId` | number | Yes | Bed ID |

**Success (200):**
```json
{
  "status": "ok",
  "message": "Bed deleted"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid bed ID |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Bed not found |

---

### 7.10 Add Medical Device

**Use case:** UC-38 Add Medical Device  
**D2 methods:**
- `Admin.addMedicalDevice()`
- `MedicalDeviceService.create()`
- `AuditLogService.record()`

**Method:** `POST`  
**URL:** `/api/admin/medical-devices`  
**Required role:** ADMIN

**Request:**
```json
{
  "name": "ECG Monitor M3",
  "type": "ECG Monitor",
  "departmentId": 1
}
```

**Success (201):**
```json
{
  "status": "ok",
  "device": {
    "id": 6,
    "name": "ECG Monitor M3",
    "type": "ECG Monitor",
    "departmentId": 1,
    "status": "AVAILABLE",
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid fields |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Department not found |

> Note: D2 constraint — Admin can only add medical devices; modification and removal are not permitted.

---

### 7.11 Create Staff Account

**Use case:** UC-39 Create Staff Account  
**D2 methods:**
- `Admin.createStaffAccount()`
- `AdminService.createStaff()`
- `UserAccount.register()`
- `StaffProfile.create()`
- `AuditLogService.record()`

**Method:** `POST`  
**URL:** `/api/admin/staff`  
**Required role:** ADMIN

**Request:**
```json
{
  "name": "Dr. Alice",
  "email": "alice@hospital.com",
  "password": "securepass",
  "role": "DOCTOR",
  "specialization": "Cardiologist",
  "phone": "+123456789",
  "departmentId": 1
}
```

`specialization` and `phone` are optional. Role must be one of `DOCTOR`, `NURSE`, or `ADMIN` (not `PATIENT`).

**Success (201):**
```json
{
  "status": "ok",
  "staff": {
    "id": 5,
    "email": "alice@hospital.com",
    "name": "Dr. Alice",
    "role": "DOCTOR"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid fields |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Department not found |
| 409 | Email already in use |

---

### 7.12 Deactivate Staff Account

**Use case:** UC-40 Deactivate Staff Account  
**D2 methods:**
- `Admin.deactivateStaffAccount()`
- `AdminService.deactivateStaff()`
- `UserAccount.deactivate()`
- `AuditLogService.record()`

**Method:** `PATCH`  
**URL:** `/api/admin/staff/:staffId/deactivate`  
**Required role:** ADMIN

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `staffId` | number | Yes | Staff user account ID |

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "staff": {
    "id": 5,
    "name": "Dr. Alice",
    "email": "alice@hospital.com",
    "role": "DOCTOR",
    "status": "INACTIVE"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid staff ID or attempting to deactivate a patient account |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Staff account not found |

---

### 7.13 Change Staff Role

**Use case:** UC-41 Assign Role-Based Access  
**D2 methods:**
- `Admin.assignRole()`
- `AdminService.changeRole()`
- `UserAccount.updateRole()`
- `AuditLogService.record()`

**Method:** `PATCH`  
**URL:** `/api/admin/staff/:staffId/role`  
**Required role:** ADMIN

**URL parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `staffId` | number | Yes | Staff user account ID |

**Request:**
```json
{
  "role": "NURSE"
}
```

Role must be one of `DOCTOR`, `NURSE`, or `ADMIN` (not `PATIENT`).

**Success (200):**
```json
{
  "status": "ok",
  "staff": {
    "id": 5,
    "name": "Dr. Alice",
    "email": "alice@hospital.com",
    "role": "NURSE"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid staff ID, missing role, or attempting to assign PATIENT role |
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |
| 404 | Staff account not found |

---

## 8. Audit

All audit routes are mounted under `/api/admin`.

---

### 8.1 View Audit Logs

**Use case:** UC-42 View Audit Logs  
**D2 methods:**
- `Admin.viewAuditLogs()`
- `AuditLogService.getAll()`

**Method:** `GET`  
**URL:** `/api/admin/audit-logs`  
**Required role:** ADMIN

**Request:** (none)

**Success (200):**
```json
{
  "status": "ok",
  "logs": [
    {
      "id": 1,
      "adminId": 4,
      "action": "CREATE",
      "entity": "Hospital",
      "entityId": 1,
      "details": "Created hospital 'General Hospital'",
      "createdAt": "2026-07-05T08:00:00.000Z",
      "admin": {
        "id": 4,
        "name": "Admin User",
        "email": "admin@healthcore.test"
      }
    }
  ]
}
```

Logs are ordered by creation date (most recent first).

**Errors:**
| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden (not ADMIN) |

---

## Endpoint Summary

| # | Section | Method | URL | Role | Use Case |
|---|---------|--------|-----|------|----------|
| 1 | Auth | POST | `/api/auth/register` | Public | UC-01 |
| 2 | Auth | POST | `/api/auth/login` | Public | UC-02 |
| 3 | Auth | POST | `/api/auth/logout` | Any | UC-03 |
| 4 | Auth | GET | `/api/auth/me` | Any | — |
| 5 | Auth | POST | `/api/auth/recover-password` | Public | UC-04 |
| 6 | Appts | GET | `/api/departments` | Any | UC-05 |
| 7 | Appts | GET | `/api/doctors` | Any | UC-06 |
| 8 | Appts | GET | `/api/timeslots` | Any | UC-07 |
| 9 | Appts | POST | `/api/appointments/book` | PATIENT | UC-08 |
| 10 | Appts | GET | `/api/appointments/me` | PATIENT | UC-08 |
| 11 | Payments | POST | `/api/payments/authorize` | PATIENT | UC-09 |
| 12 | Payments | POST | `/api/payments/validate` | PATIENT | UC-09 |
| 13 | Payments | GET | `/api/payments/:transactionId` | PATIENT | UC-09 |
| 14 | Records | GET | `/api/medical-records/me` | PATIENT | UC-10 |
| 15 | Records | GET | `/api/medical-records/me/export` | PATIENT | UC-10 |
| 16 | Records | GET | `/api/patients` | DOCTOR | UC-14 |
| 17 | Records | GET | `/api/medical-records/:patientId` | DOCTOR | UC-15 |
| 18 | Records | PATCH | `/api/medical-records/:recordId` | DOCTOR | UC-16 |
| 19 | Records | POST | `/api/medical-records/:recordId/prescriptions` | DOCTOR | UC-17 |
| 20 | Triage | GET | `/api/triage/queue` | NURSE/DOCTOR/ADMIN | UC-18 |
| 21 | Triage | POST | `/api/triage` | NURSE | UC-19 |
| 22 | Triage | PATCH | `/api/triage/:id/priority` | NURSE | UC-20 |
| 23 | Triage | PATCH | `/api/triage/:id/status` | NURSE | UC-21 |
| 24 | Triage | POST | `/api/triage/broadcast` | NURSE | UC-22 |
| 25 | Resources | GET | `/api/resources/beds` | Any | UC-23 |
| 26 | Resources | PATCH | `/api/resources/beds/:id/assign` | NURSE | UC-24 |
| 27 | Resources | PATCH | `/api/resources/beds/:id/release` | NURSE | UC-25 |
| 28 | Resources | GET | `/api/resources/devices` | Any | UC-26 |
| 29 | Resources | PATCH | `/api/resources/devices/:id/assign` | NURSE | UC-27 |
| 30 | Resources | PATCH | `/api/resources/devices/:id/status` | NURSE | UC-28 |
| 31 | Admin | POST | `/api/admin/hospitals` | ADMIN | UC-29 |
| 32 | Admin | PATCH | `/api/admin/hospitals/:id` | ADMIN | UC-30 |
| 33 | Admin | DELETE | `/api/admin/hospitals/:id` | ADMIN | UC-31 |
| 34 | Admin | POST | `/api/admin/departments` | ADMIN | UC-32 |
| 35 | Admin | PATCH | `/api/admin/departments/:id` | ADMIN | UC-33 |
| 36 | Admin | DELETE | `/api/admin/departments/:id` | ADMIN | UC-34 |
| 37 | Admin | POST | `/api/admin/beds` | ADMIN | UC-35 |
| 38 | Admin | PATCH | `/api/admin/beds/:id` | ADMIN | UC-36 |
| 39 | Admin | DELETE | `/api/admin/beds/:id` | ADMIN | UC-37 |
| 40 | Admin | POST | `/api/admin/medical-devices` | ADMIN | UC-38 |
| 41 | Admin | POST | `/api/admin/staff` | ADMIN | UC-39 |
| 42 | Admin | PATCH | `/api/admin/staff/:id/deactivate` | ADMIN | UC-40 |
| 43 | Admin | PATCH | `/api/admin/staff/:id/role` | ADMIN | UC-41 |
| 44 | Audit | GET | `/api/admin/audit-logs` | ADMIN | UC-42 |
