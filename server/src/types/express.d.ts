import { UserRole } from '@prisma/client';

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
