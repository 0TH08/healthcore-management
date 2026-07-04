import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import appointmentRoutes from './modules/appointments/appointment.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', appointmentRoutes);

app.use(errorMiddleware);

export default app;
