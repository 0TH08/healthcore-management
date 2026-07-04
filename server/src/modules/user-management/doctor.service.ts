import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { MedicalRecordService } from '../medical-records/medical-record.service';

export class DoctorService {
  static async searchPatients(searchTerm: string) {
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
              orderBy: { date: 'desc' },
              take: 5,
            },
          },
        },
      },
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
    const patient = await prisma.patientProfile.findUnique({ where: { userId } });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    return MedicalRecordService.getPatientRecords(patient.id);
  }
}
