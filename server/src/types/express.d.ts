import { UserRole } from '@prisma/client';

// Global augmentation so every Route handler sees req.user (set by authMiddleware).
// Avoids manual typecasting in every controller.
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: UserRole;
        email: string;
        name: string;
      };
    }
  }
}
