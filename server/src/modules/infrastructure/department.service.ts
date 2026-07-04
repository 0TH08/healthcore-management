import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class DepartmentService {
  static async create(data: { name: string; hospitalId: number }) {
    const hospital = await prisma.hospital.findUnique({ where: { id: data.hospitalId } });
    if (!hospital) throw new AppError('Hospital not found', 404);

    return prisma.department.create({
      data: { name: data.name, hospitalId: data.hospitalId },
    });
  }

  static async update(departmentId: number, data: { name?: string; hospitalId?: number }) {
    const existing = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!existing) throw new AppError('Department not found', 404);

    if (data.hospitalId) {
      const hospital = await prisma.hospital.findUnique({ where: { id: data.hospitalId } });
      if (!hospital) throw new AppError('Hospital not found', 404);
    }

    return prisma.department.update({ where: { id: departmentId }, data });
  }

  static async delete(departmentId: number) {
    const existing = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        staffProfiles: { take: 1 },
        timeSlots: { take: 1 },
        beds: { take: 1 },
        medicalDevices: { take: 1 },
        schedules: { take: 1 },
      },
    });
    if (!existing) throw new AppError('Department not found', 404);

    const hasDeps = existing.staffProfiles.length > 0
      || existing.timeSlots.length > 0
      || existing.beds.length > 0
      || existing.medicalDevices.length > 0
      || existing.schedules.length > 0;
    if (hasDeps) throw new AppError('Cannot delete department with existing dependencies', 409);

    await prisma.department.delete({ where: { id: departmentId } });
    return existing;
  }
}
