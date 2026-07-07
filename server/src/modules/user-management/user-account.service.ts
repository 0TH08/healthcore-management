import { prisma } from '../../utils/prisma';
import { UserRole, AccountStatus } from '@prisma/client';

// Low-level user account queries used across auth, admin, and staff management services.
// This is intentionally kept thin — business logic (hashing, validation) lives in the
// consuming services (AuthService, AdminService), not here.
//
// Why not use Prisma directly in the callers?
// By centralizing queries here, we avoid repeating the include relationships
// (patientProfile, staffProfile with department) across multiple services. If the
// profile structure changes, only this file needs updating.
export class UserAccountService {
  static async findByEmail(email: string) {
    // The email column has a unique constraint in the DB, so findUnique is safe.
    return prisma.userAccount.findUnique({ where: { email } });
  }

  static async findById(id: number) {
    // Eagerly loads both profile types because the caller often needs them immediately
    // (e.g., getMe endpoint returns the profile for the frontend). Prisma handles the
    // optional 1:1 relationship gracefully — if no patientProfile exists for this user,
    // it returns null rather than failing.
    return prisma.userAccount.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        staffProfile: { include: { department: true } },
      },
    });
  }

  static async create(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    status?: AccountStatus;
  }) {
    // Raw create — no uniqueness check here. The caller (AuthService or AdminService)
    // is responsible for checking duplicates before calling this. This separation
    // allows different error messages for different contexts (e.g., "Email already
    // registered" vs "Email already in use").
    return prisma.userAccount.create({ data });
  }
}
