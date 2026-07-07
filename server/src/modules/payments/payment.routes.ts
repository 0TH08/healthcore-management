import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

// All payment endpoints are PATIENT-only — only patients can pay for their appointments.
const router = Router();

router.post(
  '/payments/authorize',
  authMiddleware,
  roleMiddleware('PATIENT'),
  PaymentController.authorize,
);

router.post(
  '/payments/validate',
  authMiddleware,
  roleMiddleware('PATIENT'),
  PaymentController.validate,
);

router.get(
  '/payments/:transactionId',
  authMiddleware,
  roleMiddleware('PATIENT'),
  PaymentController.getTransaction,
);

export default router;
