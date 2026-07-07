import { prisma } from '../../utils/prisma';

// Read-only service for hospital networks (created by seed only, not exposed via API).
// Hospital networks are the top-level grouping in the infrastructure hierarchy.
// They are seeded from seed.ts and are not intended to be created/modified through
// the admin UI in the MVP. If needed later, CRUD endpoints can be added.
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
