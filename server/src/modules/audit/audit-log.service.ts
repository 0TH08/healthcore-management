import { prisma } from '../../utils/prisma';

export class AuditLogService {
  static async record(adminId: number, action: string, entity: string, entityId: number, details?: string) {
    return prisma.auditLog.create({
      data: { adminId, action, entity, entityId, details },
    });
  }

  static async getAll() {
    return prisma.auditLog.findMany({
      include: { admin: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
