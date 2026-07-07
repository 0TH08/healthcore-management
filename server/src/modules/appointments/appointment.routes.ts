import { Router } from 'express';
import { AppointmentController } from './appointment.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

// Public-info routes (departments, doctors, timeslots) require auth but any role can view.
// Booking and viewing own appointments are PATIENT-only.
const router = Router();

router.get('/departments', authMiddleware, AppointmentController.getDepartments);
router.get('/doctors', authMiddleware, AppointmentController.getDoctors);
router.get('/timeslots', authMiddleware, AppointmentController.getTimeSlots);
router.post(
  '/appointments/book',
  authMiddleware,
  roleMiddleware('PATIENT'),
  AppointmentController.book,
);
router.get(
  '/appointments/me',
  authMiddleware,
  roleMiddleware('PATIENT'),
  AppointmentController.getMyAppointments,
);

export default router;
