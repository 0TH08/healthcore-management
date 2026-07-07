import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { MedicalRecordService } from '../medical-records/medical-record.service';

// Doctor-focused queries: searching patients by name/email and consulting their records.
//
// Design notes:
// - searchPatients returns the patient profile plus their 5 most recent medical records
//   in a single query. This avoids N+1 queries when the doctor sees a list of patients
//   and needs quick context on each one.
// - consultMedicalRecords is a thin wrapper around MedicalRecordService.getPatientRecords
//   with an ownership guard (resolves userId → patientProfile). This is the doctor-side
//   read access point.
export class DoctorService {
  static async searchPatients(searchTerm: string) {
    // Searches across both name and email using WHERE role='PATIENT' to exclude staff.
    // Prisma's `contains` is case-insensitive by default on PostgreSQL (case-sensitive
    // on MySQL). Since we use PostgreSQL, this will match "John", "john", "JOHN", etc.
    const users = await prisma.userAccount.findMany({
      where: {
        role: 'PATIENT',
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
        ],
      },
      include: {
        patientProfile: {
          include: {
            medicalRecords: {
              include: { allergies: true, prescriptions: true },
              // Most recent first, limited to 5. This gives the doctor enough context
              // to understand the patient's recent history without overwhelming the UI.
              orderBy: { date: 'desc' },
              take: 5,
            },
          },
        },
      },
      // Alphabetical order makes it easy for the doctor to scan the list.
      orderBy: { name: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      dateOfBirth: u.patientProfile?.dateOfBirth ?? null,
      phone: u.patientProfile?.phone ?? null,
      address: u.patientProfile?.address ?? null,
      recentRecords: u.patientProfile?.medicalRecords ?? [],
    }));
  }

  static async consultMedicalRecords(userId: number) {
    // Resolve user ID to PatientProfile first. If the user doesn't have a patient
    // profile (e.g., they're a staff member), we return 404 rather than exposing data.
    const patient = await prisma.patientProfile.findUnique({ where: { userId } });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // Delegates to the shared MedicalRecordService to avoid duplicating query logic.
    return MedicalRecordService.getPatientRecords(patient.id);
  }
}
