import { Request, Response, NextFunction } from 'express';

export function roleMiddleware(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}
