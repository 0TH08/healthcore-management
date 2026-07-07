import { prisma } from '../../utils/prisma';

// Records every admin action and retrieves the full log.
// Called from InfrastructureController after every successful admin mutation.
//
// Why not middleware: Audit logging is selective — we only log admin CRUD operations,
// not every request (e.g., patient-facing endpoints don't need audit). The controller
// layer decides what's worth logging and calls record() explicitly after success.
// This also ensures we only log operations that actually completed (not failed attempts).
export class AuditLogService {
  static async record(adminId: number, action: string, entity: string, entityId: number, details?: string) {
    return prisma.auditLog.create({
      data: { adminId, action, entity, entityId, details },
    });
  }

  static async getAll() {
    return prisma.auditLog.findMany({
      include: { admin: { select: { id: true, name: true, email: true } } },
      // Most recent first — the admin dashboard shows the latest activity at the top.
      orderBy: { createdAt: 'desc' },
    });
  }
}
