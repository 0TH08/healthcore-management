import bcrypt from 'bcryptjs';
import { prisma } from '../../utils/prisma';
import { UserRole } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

const SALT_ROUNDS = 10;

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
    const existing = await prisma.userAccount.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already in use', 409);

    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) throw new AppError('Department not found', 404);

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

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
    if (role === 'PATIENT') {
      throw new AppError('Cannot assign PATIENT role via staff management', 400);
    }

    const previousRole = user.role;

    const updated = await prisma.userAccount.update({
      where: { id: staffId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return { ...updated, previousRole };
  }
}
