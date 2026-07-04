import { prisma } from '../../utils/prisma';
import { UserRole, AccountStatus } from '@prisma/client';

export class UserAccountService {
  static async findByEmail(email: string) {
    return prisma.userAccount.findUnique({ where: { email } });
  }

  static async findById(id: number) {
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
    return prisma.userAccount.create({ data });
  }
}
