import { Router } from 'express';
import { ResourceController } from './resource.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

// Bed and device listings are open to any authenticated user;
// mutations (assign, release, update status) are NURSE-only.
const router = Router();

router.get('/resources/beds', authMiddleware, ResourceController.getBeds);
router.patch(
  '/resources/beds/:bedId/assign',
  authMiddleware,
  roleMiddleware('NURSE'),
  ResourceController.assignBed,
);
router.patch(
  '/resources/beds/:bedId/release',
  authMiddleware,
  roleMiddleware('NURSE'),
  ResourceController.releaseBed,
);

router.get('/resources/devices', authMiddleware, ResourceController.getDevices);
router.patch(
  '/resources/devices/:deviceId/assign',
  authMiddleware,
  roleMiddleware('NURSE'),
  ResourceController.assignDevice,
);
router.patch(
  '/resources/devices/:deviceId/status',
  authMiddleware,
  roleMiddleware('NURSE'),
  ResourceController.updateDeviceStatus,
);

export default router;
