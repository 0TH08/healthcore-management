import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export function roleMiddleware(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
