import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserAccountService } from '../user-management/user-account.service';
import { NotificationServiceAdapter } from '../system-core/notification-service.adapter';
import { AppError } from '../../middleware/error.middleware';
import { prisma } from '../../utils/prisma';

// Handles all auth flows: register, login, session check, password recovery.
//
// Design decisions:
// - Registration auto-logs in: returns a JWT immediately so the frontend
//   doesn't need a separate login step after sign-up.
// - Only PATIENT role is allowed via self-registration. DOCTOR/NURSE/ADMIN
//   accounts are created exclusively through the admin staff management panel.
// - Password recovery returns the same message regardless of whether the email
//   exists. This prevents attackers from probing which emails are registered
//   (enumeration attack prevention).
// - bcrypt hash rounds = 10: balances security (~100ms per hash) with UX for login.
export class AuthService {
  static async register(email: string, password: string, name: string) {
    // Check for duplicate email first. Must do this BEFORE creating the user
    // to avoid a unique constraint violation (the DB has a unique index on email).
    const existing = await UserAccountService.findByEmail(email);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Role is hardcoded to PATIENT. Staff accounts use AdminService.createStaff() instead.
    const user = await UserAccountService.create({
      email,
      password: hashedPassword,
      name,
      role: 'PATIENT',
    });

    // Every Patient needs a PatientProfile row. We create one with sensible defaults;
    // the patient can update their info later. The dateOfBirth is a placeholder because
    // the schema marks it as required but the registration form doesn't collect it.
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
    // Use a generic "Invalid email or password" message rather than distinguishing
    // "email not found" vs "wrong password" — same anti-enumeration reasoning.
    const user = await UserAccountService.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // bcrypt.compare() handles the salt extraction — the hash stored in the DB
    // includes the salt, so we only need to pass the plaintext password.
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
    // Used by the frontend on page refresh to verify the stored JWT is still valid
    // and to get the current user data (including profile).
    const user = await UserAccountService.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Attach the appropriate profile (patient or staff) so the frontend can display
    // role-specific information without a second API call.
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      profile: user.patientProfile || user.staffProfile || null,
    };
  }

  // Returns the same message for both existing and non-existing emails.
  // An attacker who sends many recovery requests cannot distinguish valid users.
  static async recoverPassword(email: string) {
    const user = await UserAccountService.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a recovery link has been sent.' };
    }

    // In production this would call an actual email service. Here we use the mock adapter
    // which logs to console.
    NotificationServiceAdapter.sendPasswordRecoveryEmail(email, user.name);

    return { message: 'If the email exists, a recovery link has been sent.' };
  }

  // JWT includes only userId and role — no email or name. Keeping the token small
  // reduces header size on every request. The 24h expiry is a reasonable trade-off
  // between security (short-lived tokens) and UX (infrequent re-login).
  private static generateToken(userId: number, role: string): string {
    return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '24h' });
  }
}
