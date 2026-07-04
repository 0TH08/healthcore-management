import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserAccountService } from '../modules/user-management/user-account.service';

interface JwtPayload {
  userId: number;
  role: string;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ status: 'error', message: 'No token provided' });
      return;
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await UserAccountService.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ status: 'error', message: 'User not found' });
      return;
    }

    req.user = { userId: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch {
    res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}
