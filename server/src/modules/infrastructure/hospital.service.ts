import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class HospitalService {
  static async getAll() {
    return prisma.hospital.findMany({
      include: { network: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  static async create(data: { name: string; address: string; networkId: number }) {
    const network = await prisma.hospitalNetwork.findUnique({ where: { id: data.networkId } });
    if (!network) throw new AppError('Hospital network not found', 404);

    return prisma.hospital.create({
      data: { name: data.name, address: data.address, networkId: data.networkId },
    });
  }

  static async update(hospitalId: number, data: { name?: string; address?: string; networkId?: number }) {
    const existing = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!existing) throw new AppError('Hospital not found', 404);

    if (data.networkId) {
      const network = await prisma.hospitalNetwork.findUnique({ where: { id: data.networkId } });
      if (!network) throw new AppError('Hospital network not found', 404);
    }

    return prisma.hospital.update({ where: { id: hospitalId }, data });
  }

  static async delete(hospitalId: number) {
    const existing = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: { departments: { take: 1 } },
    });
    if (!existing) throw new AppError('Hospital not found', 404);
    if (existing.departments.length > 0) {
      throw new AppError('Cannot delete hospital with existing departments', 409);
    }

    await prisma.hospital.delete({ where: { id: hospitalId } });
    return existing;
  }
}
