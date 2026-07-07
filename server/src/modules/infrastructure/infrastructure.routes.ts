import { Router } from 'express';
import { InfrastructureController } from './infrastructure.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

// All infrastructure and staff-management routes are ADMIN-only.
// Note: only CREATE for medical devices (no update/delete) per constraint D2.
const router = Router();

router.get('/admin/hospitals', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.getHospitals);
router.post('/admin/hospitals', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.createHospital);
router.patch('/admin/hospitals/:hospitalId', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.updateHospital);
router.delete('/admin/hospitals/:hospitalId', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.deleteHospital);

router.post('/admin/departments', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.createDepartment);
router.patch('/admin/departments/:departmentId', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.updateDepartment);
router.delete('/admin/departments/:departmentId', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.deleteDepartment);

router.post('/admin/beds', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.createBed);
router.patch('/admin/beds/:bedId', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.updateBed);
router.delete('/admin/beds/:bedId', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.deleteBed);

router.post('/admin/medical-devices', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.createMedicalDevice);

router.post('/admin/staff', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.createStaff);
router.patch('/admin/staff/:staffId/deactivate', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.deactivateStaff);
router.patch('/admin/staff/:staffId/role', authMiddleware, roleMiddleware('ADMIN'), InfrastructureController.assignRole);

export default router;
