import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

// Uses its own PrismaClient (not the shared one from utils/prisma.ts) because
// seed.ts runs as a standalone script, not as part of the Express app.
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

// Seed creates demo users, a hospital network with departments, beds, devices,
// time slots (future-dated), medical records with allergies + prescriptions,
// triage cases, schedules/shifts, and audit logs.
// Uses deleteMany in reverse FK order inside a transaction to allow safe re-runs.
//
// Design notes:
// - All users share password "Password123!" for convenience. In production,
//   every user would set their own password.
// - Time slots are always generated relative to the current date (today + N days),
//   so they're always in the future regardless of when the seed runs.
// - The clear step runs inside $transaction so that if any delete fails,
//   the entire clear is rolled back rather than leaving a partially-cleared DB.
async function main() {
  console.log('Clearing existing data...');

  // Delete order matters: child tables must be deleted before their parents
  // to avoid foreign key violations. The order is: leaf tables first,
  // then junction/referencing tables, then the core tables they reference.
  // Wrapping in $transaction ensures atomicity.
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.shift.deleteMany(),
    prisma.schedule.deleteMany(),
    prisma.allergy.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.paymentTransaction.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.medicalRecord.deleteMany(),
    prisma.triageCase.deleteMany(),
    prisma.timeSlot.deleteMany(),
    prisma.bed.deleteMany(),
    prisma.medicalDevice.deleteMany(),
    prisma.staffProfile.deleteMany(),
    prisma.patientProfile.deleteMany(),
    prisma.department.deleteMany(),
    prisma.hospital.deleteMany(),
    prisma.hospitalNetwork.deleteMany(),
    prisma.userAccount.deleteMany(),
  ]);

  console.log('Seeding users...');

  // All demo users share the same bcrypt-hashed password "Password123!"
  const hashedPassword = await bcrypt.hash('Password123!', SALT_ROUNDS);

  const patientUser = await prisma.userAccount.create({
    data: {
      email: 'patient@healthcore.test',
      password: hashedPassword,
      name: 'John Doe',
      role: 'PATIENT',
      status: 'ACTIVE',
    },
  });

  const doctorUser = await prisma.userAccount.create({
    data: {
      email: 'doctor@healthcore.test',
      password: hashedPassword,
      name: 'Jane Smith',
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  const nurseUser = await prisma.userAccount.create({
    data: {
      email: 'nurse@healthcore.test',
      password: hashedPassword,
      name: 'Emily Jones',
      role: 'NURSE',
      status: 'ACTIVE',
    },
  });

  const adminUser = await prisma.userAccount.create({
    data: {
      email: 'admin@healthcore.test',
      password: hashedPassword,
      name: 'Robert Wilson',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('Seeding hospital network...');

  const network = await prisma.hospitalNetwork.create({
    data: { name: 'HealthCore Network' },
  });

  const hospital = await prisma.hospital.create({
    data: {
      name: 'University Medical Center',
      address: '123 Health St, Medical City',
      networkId: network.id,
    },
  });

  // Three departments with distinct medical specialties to demonstrate
  // the infrastructure hierarchy and resource allocation features.
  const cardiology = await prisma.department.create({
    data: { name: 'Cardiology', hospitalId: hospital.id },
  });

  const emergency = await prisma.department.create({
    data: { name: 'Emergency', hospitalId: hospital.id },
  });

  const radiology = await prisma.department.create({
    data: { name: 'Radiology', hospitalId: hospital.id },
  });

  console.log('Seeding profiles...');

  // PatientProfile for the demo patient.
  await prisma.patientProfile.create({
    data: {
      userId: patientUser.id,
      dateOfBirth: new Date('1990-05-15'),
      phone: '+1-555-0101',
      address: '456 Patient Ave, Medical City',
    },
  });

  // Staff profiles for each demo staff member, each assigned to a different
  // department to show cross-department functionality.
  await prisma.staffProfile.create({
    data: {
      userId: doctorUser.id,
      departmentId: cardiology.id,
      specialization: 'Interventional Cardiology',
      phone: '+1-555-0201',
    },
  });

  await prisma.staffProfile.create({
    data: {
      userId: nurseUser.id,
      departmentId: emergency.id,
      specialization: 'Emergency Nursing',
      phone: '+1-555-0301',
    },
  });

  await prisma.staffProfile.create({
    data: {
      userId: adminUser.id,
      departmentId: radiology.id,
      specialization: 'Healthcare Administration',
      phone: '+1-555-0401',
    },
  });

  console.log('Seeding beds...');

  const bedData = [
    { departmentId: cardiology.id, bedNumber: 'CARD-B01' },
    { departmentId: cardiology.id, bedNumber: 'CARD-B02' },
    { departmentId: emergency.id, bedNumber: 'ER-B01' },
    { departmentId: emergency.id, bedNumber: 'ER-B02' },
    { departmentId: radiology.id, bedNumber: 'RAD-B01' },
  ];

  for (const bed of bedData) {
    await prisma.bed.create({ data: { ...bed, status: 'UNOCCUPIED' } });
  }

  console.log('Seeding medical devices...');

  const deviceData = [
    { departmentId: cardiology.id, name: 'ECG Machine', type: 'Diagnostic' },
    { departmentId: cardiology.id, name: 'Defibrillator', type: 'Life Support' },
    { departmentId: emergency.id, name: 'Ventilator', type: 'Life Support' },
    { departmentId: emergency.id, name: 'Infusion Pump', type: 'Therapeutic' },
    { departmentId: radiology.id, name: 'X-Ray Machine', type: 'Imaging' },
  ];

  for (const device of deviceData) {
    await prisma.medicalDevice.create({ data: { ...device, status: 'AVAILABLE' } });
  }

  console.log('Seeding time slots...');

  const doctorProfile = await prisma.staffProfile.findUnique({
    where: { userId: doctorUser.id },
  });

  // Slots are created for the next 5 days so they are always in the future.
  // This means the seed data stays usable even if the app hasn't been reset
  // in a few days (slots up to 5 days out are always available).
  const today = new Date();
  const timeSlots = [
    { date: addDays(today, 1), startTime: '09:00', endTime: '09:30' },
    { date: addDays(today, 1), startTime: '10:00', endTime: '10:30' },
    { date: addDays(today, 1), startTime: '11:00', endTime: '11:30' },
    { date: addDays(today, 2), startTime: '09:00', endTime: '09:30' },
    { date: addDays(today, 2), startTime: '10:00', endTime: '10:30' },
    { date: addDays(today, 3), startTime: '14:00', endTime: '14:30' },
    { date: addDays(today, 3), startTime: '15:00', endTime: '15:30' },
    { date: addDays(today, 4), startTime: '09:00', endTime: '09:30' },
    { date: addDays(today, 4), startTime: '11:00', endTime: '11:30' },
    { date: addDays(today, 5), startTime: '10:00', endTime: '10:30' },
  ];

  for (const slot of timeSlots) {
    await prisma.timeSlot.create({
      data: {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        doctorId: doctorProfile!.id,
        departmentId: cardiology.id,
        isBooked: false,
      },
    });
  }

  console.log('Seeding medical records...');

  const patientProfile = await prisma.patientProfile.findUnique({
    where: { userId: patientUser.id },
  });

  // Record 1: hypertension diagnosis with a prescription and an allergy.
  const record1 = await prisma.medicalRecord.create({
    data: {
      patientId: patientProfile!.id,
      diagnosis: 'Hypertension',
      notes: 'Stage 1 hypertension diagnosed during annual checkup. Monitor BP regularly.',
      date: new Date('2026-01-15'),
    },
  });

  // Record 2: diabetes diagnosis with its own prescription and a different allergy.
  // Having two records demonstrates the list view and per-record scoping of
  // allergies and prescriptions.
  const record2 = await prisma.medicalRecord.create({
    data: {
      patientId: patientProfile!.id,
      diagnosis: 'Type 2 Diabetes',
      notes: 'Elevated HbA1c levels detected. Dietary changes recommended.',
      date: new Date('2026-03-10'),
    },
  });

  await prisma.prescription.create({
    data: {
      medicalRecordId: record1.id,
      medication: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-07-15'),
    },
  });

  await prisma.prescription.create({
    data: {
      medicalRecordId: record2.id,
      medication: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily with meals',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-09-10'),
    },
  });

  await prisma.allergy.create({
    data: {
      medicalRecordId: record1.id,
      allergen: 'Penicillin',
      severity: 'HIGH',
      reaction: 'Rash and difficulty breathing',
    },
  });

  await prisma.allergy.create({
    data: {
      medicalRecordId: record2.id,
      allergen: 'Peanuts',
      severity: 'MEDIUM',
      reaction: 'Hives and swelling',
    },
  });

  console.log('Seeding triage cases...');

  const nurseProfile = await prisma.staffProfile.findUnique({
    where: { userId: nurseUser.id },
  });

  // Three triage cases demonstrating the workflow states:
  // - HIGH/IN_PROGRESS: actively being handled
  // - MEDIUM/WAITING: in the queue
  // - LOW/COMPLETED: already discharged
  await prisma.triageCase.create({
    data: {
      patientId: patientProfile!.id,
      nurseId: nurseProfile!.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      symptoms: 'Chest pain radiating to left arm, shortness of breath',
      notes: 'Patient administered aspirin. ECG pending.',
    },
  });

  await prisma.triageCase.create({
    data: {
      patientId: patientProfile!.id,
      priority: 'MEDIUM',
      status: 'WAITING',
      symptoms: 'Fever of 38.5°C, persistent cough for 3 days',
      notes: 'Awaiting COVID-19 test results.',
    },
  });

  await prisma.triageCase.create({
    data: {
      patientId: patientProfile!.id,
      nurseId: nurseProfile!.id,
      priority: 'LOW',
      status: 'COMPLETED',
      symptoms: 'Mild headache, requested routine checkup',
      notes: 'Vitals normal. Patient discharged with advice.',
    },
  });

  console.log('Seeding schedules and shifts...');

  // Doctor: morning shifts on day+1 and day+2
  const schedule1 = await prisma.schedule.create({
    data: {
      staffId: doctorProfile!.id,
      departmentId: cardiology.id,
      date: addDays(today, 1),
    },
  });

  await prisma.shift.create({
    data: {
      scheduleId: schedule1.id,
      startTime: '08:00',
      endTime: '16:00',
      type: 'Morning',
    },
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      staffId: doctorProfile!.id,
      departmentId: cardiology.id,
      date: addDays(today, 2),
    },
  });

  await prisma.shift.create({
    data: {
      scheduleId: schedule2.id,
      startTime: '08:00',
      endTime: '16:00',
      type: 'Morning',
    },
  });

  // Nurse: evening shifts on day+1 and day+3
  const schedule3 = await prisma.schedule.create({
    data: {
      staffId: nurseProfile!.id,
      departmentId: emergency.id,
      date: addDays(today, 1),
    },
  });

  await prisma.shift.create({
    data: {
      scheduleId: schedule3.id,
      startTime: '14:00',
      endTime: '22:00',
      type: 'Evening',
    },
  });

  const schedule4 = await prisma.schedule.create({
    data: {
      staffId: nurseProfile!.id,
      departmentId: emergency.id,
      date: addDays(today, 3),
    },
  });

  await prisma.shift.create({
    data: {
      scheduleId: schedule4.id,
      startTime: '14:00',
      endTime: '22:00',
      type: 'Evening',
    },
  });

  console.log('Seeding audit logs...');

  // 16 audit log entries covering every seeded entity type for a meaningful admin view.
  // The admin dashboard displays these to show the history of system changes.
  const auditEntries = [
    { action: 'CREATE', entity: 'HospitalNetwork', entityId: network.id, details: `Created network "${network.name}"` },
    { action: 'CREATE', entity: 'Hospital', entityId: hospital.id, details: `Created hospital "${hospital.name}"` },
    { action: 'CREATE', entity: 'Department', entityId: cardiology.id, details: `Created department "${cardiology.name}"` },
    { action: 'CREATE', entity: 'Department', entityId: emergency.id, details: `Created department "${emergency.name}"` },
    { action: 'CREATE', entity: 'Department', entityId: radiology.id, details: `Created department "${radiology.name}"` },
    { action: 'CREATE', entity: 'StaffProfile', entityId: doctorUser.id, details: `Created DOCTOR account "Jane Smith"` },
    { action: 'CREATE', entity: 'StaffProfile', entityId: nurseUser.id, details: `Created NURSE account "Emily Jones"` },
    { action: 'CREATE', entity: 'StaffProfile', entityId: adminUser.id, details: `Created ADMIN account "Robert Wilson"` },
    { action: 'CREATE', entity: 'PatientProfile', entityId: patientUser.id, details: `Created PATIENT account "John Doe"` },
    { action: 'SEED_BEDS', entity: 'Bed', entityId: 0, details: 'Seeded 5 beds across departments' },
    { action: 'SEED_DEVICES', entity: 'MedicalDevice', entityId: 0, details: 'Seeded 5 medical devices across departments' },
    { action: 'SEED_TIMESLOTS', entity: 'TimeSlot', entityId: 0, details: 'Seeded 10 appointment time slots' },
    { action: 'SEED_RECORDS', entity: 'MedicalRecord', entityId: 0, details: 'Seeded 2 medical records with allergies and prescriptions' },
    { action: 'SEED_TRIAGE', entity: 'TriageCase', entityId: 0, details: 'Seeded 3 triage cases at varying priorities' },
    { action: 'SEED_SCHEDULES', entity: 'Schedule', entityId: 0, details: 'Seeded 4 schedules with shifts' },
    { action: 'SEED_COMPLETE', entity: 'System', entityId: 0, details: 'Initial database seeding completed successfully.' },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: { adminId: adminUser.id, ...entry },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
