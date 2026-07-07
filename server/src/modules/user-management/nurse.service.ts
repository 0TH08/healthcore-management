import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

// Resolves a user ID to a StaffProfile and verifies the user's role is NURSE.
// Used by triage services to guard that only nurses can create/manage triage cases.
//
// Why this exists as a separate service (vs. PatientService being reused):
// The StaffProfile and PatientProfile are different tables linked by userId with
// a 1:1 relationship. A user can have a StaffProfile or a PatientProfile but not
// both. This service specifically validates the StaffProfile + NURSE role combo.
export class NurseService {
  static async findByUserId(userId: number) {
    const profile = await prisma.staffProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, role: true } } },
    });

    // Two failure modes: no profile at all, or profile exists but role isn't NURSE.
    // Both return the same error to avoid leaking information about the user's role.
    if (!profile || profile.user.role !== 'NURSE') {
      throw new AppError('Nurse profile not found', 404);
    }

    return profile;
  }
}
