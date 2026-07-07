import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';

// Zod schemas validate request bodies before reaching the service layer.
// This keeps the controller thin — validation, response shaping, and error handling only.
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const recoverPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data.email, data.password, data.name);
      res.status(201).json({ status: 'ok', ...result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data.email, data.password);
      res.json({ status: 'ok', ...result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  // Logout is stateless — the client discards the JWT.
  static async logout(_req: Request, res: Response) {
    res.json({ status: 'ok', message: 'Logged out successfully' });
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.userId);
      res.json({ status: 'ok', user });
    } catch (err) {
      next(err);
    }
  }

  // Returns a generic success message regardless of whether the email exists
  // (prevents email enumeration by attackers).
  static async recoverPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = recoverPasswordSchema.parse(req.body);
      const result = await AuthService.recoverPassword(data.email);
      res.json({ status: 'ok', ...result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }
}
