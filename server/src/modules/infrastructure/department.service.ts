import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

// CRUD for departments. Delete is blocked if any staff, slots, beds, devices, or schedules reference it.
//
// Referential integrity approach:
// Instead of relying solely on DB-level CASCADE or RESTRICT, we perform explicit checks
// in application code. This gives us control over error messages ("Cannot delete department
// with existing dependencies" vs. a raw foreign key violation). The { take: 1 } on each
// relation is an optimization: we only need to know if at least one dependency exists,
// not how many.
export class DepartmentService {
  static async create(data: { name: string; hospitalId: number }) {
    // Foreign key guard: validates parent hospital exists. Necessary because
    // the frontend sends hospitalId from a dropdown — it shouldn't happen, but
    // race conditions or stale data could cause a bad reference.
    const hospital = await prisma.hospital.findUnique({ where: { id: data.hospitalId } });
    if (!hospital) throw new AppError('Hospital not found', 404);

    return prisma.department.create({
      data: { name: data.name, hospitalId: data.hospitalId },
    });
  }

  static async update(departmentId: number, data: { name?: string; hospitalId?: number }) {
    const existing = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!existing) throw new AppError('Department not found', 404);

    // If the caller wants to move the department to a new hospital, validate that hospital.
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
