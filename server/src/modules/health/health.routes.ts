import { Router, Request, Response } from 'express';

// Simple health-check endpoint. Useful for load balancers and monitoring.
const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    project: 'HealthCore Management',
    team: 'TechNova',
  });
});

export default router;
