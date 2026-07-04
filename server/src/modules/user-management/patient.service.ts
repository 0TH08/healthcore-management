import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class PatientService {
  static async findByUserId(userId: number) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError('Patient profile not found', 404);
    }

    return profile;
  }
}
