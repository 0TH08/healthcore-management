import { prisma } from '../../utils/prisma';

// Queries only unbooked time slots with optional filters for department, doctor, and date.
// Returns a flat DTO with doctorName and departmentName for the frontend to display directly.
//
// Design notes:
// - Only returns unbooked slots (isBooked: false) because the purpose is to show
//   the patient what's available. Booked slots are hidden from the patient view
//   to avoid confusion.
// - For date filtering, we expand the single date string to a full-day range
//   (start-of-day to end-of-day) because the DB stores DateTime with time components.
//   If we only did equality on the date, we'd miss slots whose stored DateTime has
//   a non-midnight time component.
// - The Record<string, unknown> dynamic where builder is intentional: it allows
//   the caller to pass any subset of the three filters without having to branch
//   on which combination was provided. Each filter is independently applied.
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
      // Build a date-range filter: [start-of-day, end-of-day].
      // We use getTime-based comparison because the JSON transport may strip timezone info.
      // Using gte/lte makes the query inclusive on both ends.
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
      // Ascending date, then ascending start time: shows earliest slots first,
      // which is the most natural ordering for a patient choosing an appointment.
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
