import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

// Higher-order function that returns an Express middleware which checks
// whether req.user.role is in the allowed list.
//
// Logic:
// - Called AFI authMiddleware (which sets req.user). If req.user is missing,
//   it means authMiddleware wasn't run or didn't attach it — treat as 401.
// - Uses a variadic argument (...roles) so route definitions read naturally:
//   roleMiddleware('NURSE', 'ADMIN') — no array literal needed.
// - Returns 403 if the role doesn't match, allowing the client to distinguish
//   "not logged in" (401) from "logged in but not allowed" (403).
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
