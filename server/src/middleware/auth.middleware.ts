import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserAccountService } from '../modules/user-management/user-account.service';

interface JwtPayload {
  userId: number;
  role: string;
}

// Stateless JWT authentication. Every protected route calls this first.
//
// Logic:
// 1. Extract the token from "Authorization: Bearer <token>".
// 2. Verify the JWT signature using the secret — this confirms the token was
//    issued by the server and hasn't been tampered with.
// 3. Look up the user in the database using the userId from the token.
//    This catches deactivated accounts: even if the JWT is still valid (not expired),
//    an admin may have set the account to INACTIVE since the token was issued.
// 4. Attach { userId, role, email, name } to req.user for downstream middleware/controllers.
//
// The catch block handles both JWT verification errors (expired, malformed, wrong secret)
// and any unexpected DB errors.
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
