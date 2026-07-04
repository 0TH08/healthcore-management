import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';
import paymentRoutes from './modules/payments/payment.routes';
import medicalRecordRoutes from './modules/medical-records/medical-record.routes';
import triageRoutes from './modules/triage/triage.routes';
import resourceRoutes from './modules/resources/resource.routes';
import infrastructureRoutes from './modules/infrastructure/infrastructure.routes';
import auditRoutes from './modules/audit/audit.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', paymentRoutes);
app.use('/api', medicalRecordRoutes);
app.use('/api', triageRoutes);
app.use('/api', resourceRoutes);
app.use('/api', infrastructureRoutes);
app.use('/api', auditRoutes);

app.use(errorMiddleware);

export default app;
