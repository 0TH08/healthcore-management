import { Router } from 'express';
import { TriageController } from './triage.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

// Triage endpoints: queue-viewing is open to NURSE, DOCTOR, and ADMIN but mutations
// (create, update priority/status, broadcast) are NURSE-only.
const router = Router();

router.get(
  '/triage/queue',
  authMiddleware,
  roleMiddleware('NURSE', 'DOCTOR', 'ADMIN'),
  TriageController.getQueue,
);

router.post(
  '/triage',
  authMiddleware,
  roleMiddleware('NURSE'),
  TriageController.create,
);

router.patch(
  '/triage/:triageId/priority',
  authMiddleware,
  roleMiddleware('NURSE'),
  TriageController.updatePriority,
);

router.patch(
  '/triage/:triageId/status',
  authMiddleware,
  roleMiddleware('NURSE'),
  TriageController.updateStatus,
);

router.post(
  '/triage/broadcast',
  authMiddleware,
  roleMiddleware('NURSE'),
  TriageController.broadcast,
);

export default router;
