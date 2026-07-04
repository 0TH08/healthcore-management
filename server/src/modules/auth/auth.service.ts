import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserAccountService } from '../user-management/user-account.service';
import { NotificationServiceAdapter } from '../system-core/notification-service.adapter';
import { AppError } from '../../middleware/error.middleware';
import { prisma } from '../../utils/prisma';

export class AuthService {
  static async register(email: string, password: string, name: string) {
    const existing = await UserAccountService.findByEmail(email);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserAccountService.create({
      email,
      password: hashedPassword,
      name,
      role: 'PATIENT',
    });

    await prisma.patientProfile.create({
      data: {
        userId: user.id,
        dateOfBirth: new Date('2000-01-01'),
        phone: '',
        address: '',
      },
    });

    const token = AuthService.generateToken(user.id, user.role);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  static async login(email: string, password: string) {
    const user = await UserAccountService.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = AuthService.generateToken(user.id, user.role);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  static async getMe(userId: number) {
    const user = await UserAccountService.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      profile: user.patientProfile || user.staffProfile || null,
    };
  }

  static async recoverPassword(email: string) {
    const user = await UserAccountService.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a recovery link has been sent.' };
    }

    NotificationServiceAdapter.sendPasswordRecoveryEmail(email, user.name);

    return { message: 'If the email exists, a recovery link has been sent.' };
  }

  private static generateToken(userId: number, role: string): string {
    return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '24h' });
  }
}
