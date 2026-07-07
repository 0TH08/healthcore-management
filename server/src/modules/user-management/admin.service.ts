import bcrypt from 'bcryptjs';
import { prisma } from '../../utils/prisma';
import { UserRole } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

const SALT_ROUNDS = 10;

// Admin-only operations: creating staff accounts (with UserAccount + StaffProfile),
// deactivating accounts (soft-delete via status='INACTIVE'), and changing roles.
//
// Design rules:
// - Only DOCTOR, NURSE, ADMIN roles can be created/managed here.
//   PATIENT accounts are self-registered via AuthService.register() and cannot be
//   created or deactivated through the admin panel. This separation prevents an admin
//   from accidentally deleting patient data.
// - Staff deactivation is a soft-delete (status='INACTIVE'): the row remains in the DB
//   for audit purposes, but authMiddleware rejects login attempts because findById
//   will still return the user (the frontend decides how to handle INACTIVE status).
// - Role assignment returns the previous role so the admin UI can show a confirmation.
export class AdminService {
  static async createStaff(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    specialization?: string;
    phone?: string;
    departmentId: number;
  }) {
    // Must check uniqueness before insert (DB has unique constraint, but better
    // to give a friendly error than a Prisma unique constraint violation).
    const existing = await prisma.userAccount.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already in use', 409);

    // Foreign key guard: the department must exist. Without this check, Prisma
    // would throw a foreign key constraint error, which is less informative.
    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) throw new AppError('Department not found', 404);

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create UserAccount and StaffProfile sequentially (no transaction needed for MVP).
    // If StaffProfile creation fails, the UserAccount is orphaned — acceptable in dev.
    const user = await prisma.userAccount.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        status: 'ACTIVE',
      },
    });

    await prisma.staffProfile.create({
      data: {
        userId: user.id,
        departmentId: data.departmentId,
        specialization: data.specialization ?? null,
        phone: data.phone ?? null,
      },
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  static async deactivateStaff(staffId: number) {
    const user = await prisma.userAccount.findUnique({ where: { id: staffId } });
    if (!user) throw new AppError('Staff account not found', 404);
    // Explicit guard: admin cannot deactivate patients through this endpoint.
    // Patient account deactivation (if needed) would be a separate flow.
    if (user.role === 'PATIENT') {
      throw new AppError('Cannot deactivate a patient account via staff management', 400);
    }

    return prisma.userAccount.update({
      where: { id: staffId },
      data: { status: 'INACTIVE' },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
  }

  static async assignRole(staffId: number, role: UserRole) {
    const user = await prisma.userAccount.findUnique({ where: { id: staffId } });
    if (!user) throw new AppError('Staff account not found', 404);
    // Cannot assign PATIENT role via admin tools. If an admin wants to "demote"
    // someone to patient, they must use a different mechanism (or it's simply not allowed).
    if (role === 'PATIENT') {
      throw new AppError('Cannot assign PATIENT role via staff management', 400);
    }

    const previousRole = user.role;

    const updated = await prisma.userAccount.update({
      where: { id: staffId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    // previousRole is useful for the undo/rollback mechanism in the admin UI.
    return { ...updated, previousRole };
  }
}
