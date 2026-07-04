import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class NurseService {
  static async findByUserId(userId: number) {
    const profile = await prisma.staffProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, role: true } } },
    });

    if (!profile || profile.user.role !== 'NURSE') {
      throw new AppError('Nurse profile not found', 404);
    }

    return profile;
  }
}
