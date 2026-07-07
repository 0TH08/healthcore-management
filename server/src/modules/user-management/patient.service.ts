import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

// Resolves a user ID to a PatientProfile.
// Used by appointment, payment, and medical-record services to verify the caller is a patient.
//
// This is intentionally separate from UserAccountService.findById(). There are two
// reasons: (1) the PatientProfile has a different ID than the UserAccount, and downstream
// services (Appointment, PaymentTransaction) reference patientId (the profile ID),
// so they need the profile, not the account; (2) this acts as a guard — if a DOCTOR
// user's ID is passed here, it will throw 404 because they have no PatientProfile.
export class PatientService {
  static async findByUserId(userId: number) {
    const profile = await prisma.patientProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError('Patient profile not found', 404);
    }
    return profile;
  }
}
