import { Router } from 'express';
import { MedicalRecordController } from './medical-record.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

// Patients read and export their own records; doctors search patients, consult,
// update records, and create prescriptions. All endpoints require auth.
const router = Router();

router.get(
  '/medical-records/me',
  authMiddleware,
  roleMiddleware('PATIENT'),
  MedicalRecordController.getMyRecords,
);

router.get(
  '/medical-records/me/export',
  authMiddleware,
  roleMiddleware('PATIENT'),
  MedicalRecordController.exportMyRecords,
);

router.get(
  '/patients',
  authMiddleware,
  roleMiddleware('DOCTOR'),
  MedicalRecordController.searchPatients,
);

router.get(
  '/medical-records/:patientId',
  authMiddleware,
  roleMiddleware('DOCTOR'),
  MedicalRecordController.getPatientRecords,
);

router.patch(
  '/medical-records/:recordId',
  authMiddleware,
  roleMiddleware('DOCTOR'),
  MedicalRecordController.updateRecord,
);

router.post(
  '/medical-records/:recordId/prescriptions',
  authMiddleware,
  roleMiddleware('DOCTOR'),
  MedicalRecordController.createPrescription,
);

export default router;
