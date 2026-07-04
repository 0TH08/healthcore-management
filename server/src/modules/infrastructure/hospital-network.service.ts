import { prisma } from '../../utils/prisma';

export class HospitalNetworkService {
  static async list() {
    return prisma.hospitalNetwork.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findById(id: number) {
    return prisma.hospitalNetwork.findUnique({ where: { id } });
  }
}
