import { prisma } from '../../utils/prisma';

export class TimeSlotService {
  static async findAvailable(filters: {
    departmentId?: number;
    doctorId?: number;
    date?: string;
  }) {
    const where: Record<string, unknown> = { isBooked: false };

    if (filters.departmentId) {
      where.departmentId = Number(filters.departmentId);
    }
    if (filters.doctorId) {
      where.doctorId = Number(filters.doctorId);
    }
    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    const slots = await prisma.timeSlot.findMany({
      where,
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
        department: { select: { name: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return slots.map((slot) => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked,
      doctorId: slot.doctorId,
      doctorName: slot.doctor.user.name,
      departmentName: slot.department.name,
    }));
  }
}
