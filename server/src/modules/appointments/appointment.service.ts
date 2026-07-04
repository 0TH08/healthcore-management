import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { PatientService } from '../user-management/patient.service';

export class AppointmentService {
  static async book(userId: number, timeSlotId: number) {
    const patient = await PatientService.findByUserId(userId);

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: { doctor: true },
    });

    if (!timeSlot) {
      throw new AppError('Time slot not found', 404);
    }

    if (timeSlot.isBooked) {
      throw new AppError('Time slot is no longer available', 409);
    }

    const slotDate = new Date(timeSlot.date);
    slotDate.setHours(
      parseInt(timeSlot.startTime.split(':')[0]),
      parseInt(timeSlot.startTime.split(':')[1]),
      0,
      0,
    );

    if (slotDate < new Date()) {
      throw new AppError('Cannot book a time slot in the past', 400);
    }

    const [appointment] = await prisma.$transaction([
      prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: timeSlot.doctorId,
          timeSlotId: timeSlot.id,
          status: 'BOOKED',
        },
        include: {
          timeSlot: true,
          doctor: {
            include: { user: { select: { name: true } } },
          },
          patient: {
            include: { user: { select: { name: true } } },
          },
        },
      }),
      prisma.timeSlot.update({
        where: { id: timeSlot.id },
        data: { isBooked: true },
      }),
    ]);

    return {
      id: appointment.id,
      status: appointment.status,
      date: appointment.timeSlot.date,
      startTime: appointment.timeSlot.startTime,
      endTime: appointment.timeSlot.endTime,
      doctorName: appointment.doctor.user.name,
      patientName: appointment.patient.user.name,
    };
  }

  static async getPatientAppointments(userId: number) {
    const patient = await PatientService.findByUserId(userId);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        timeSlot: true,
        doctor: {
          include: { user: { select: { name: true } }, department: { select: { name: true } } },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return appointments.map((a) => ({
      id: a.id,
      status: a.status,
      date: a.timeSlot.date,
      startTime: a.timeSlot.startTime,
      endTime: a.timeSlot.endTime,
      doctorName: a.doctor.user.name,
      departmentName: a.doctor.department.name,
      createdAt: a.createdAt,
    }));
  }
}
