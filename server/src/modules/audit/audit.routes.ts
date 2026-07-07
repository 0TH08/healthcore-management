import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

// Single endpoint to list all audit logs (ADMIN-only).
const router = Router();

router.get('/admin/audit-logs', authMiddleware, roleMiddleware('ADMIN'), AuditController.getAuditLogs);

export default router;
