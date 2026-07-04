import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class BedService {
  static async getAll() {
    const beds = await prisma.bed.findMany({
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
      orderBy: [{ departmentId: 'asc' }, { bedNumber: 'asc' }],
    });

    return beds.map((b) => ({
      id: b.id,
      bedNumber: b.bedNumber,
      status: b.status,
      departmentId: b.departmentId,
      departmentName: b.department.name,
      hospitalName: b.department.hospital.name,
    }));
  }

  static async assign(bedId: number) {
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) throw new AppError('Bed not found', 404);
    if (bed.status === 'OCCUPIED') throw new AppError('Bed is already occupied', 409);

    return prisma.bed.update({
      where: { id: bedId },
      data: { status: 'OCCUPIED' },
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
    });
  }

  static async release(bedId: number) {
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) throw new AppError('Bed not found', 404);
    if (bed.status === 'UNOCCUPIED') throw new AppError('Bed is already unoccupied', 409);

    return prisma.bed.update({
      where: { id: bedId },
      data: { status: 'UNOCCUPIED' },
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
    });
  }
}
