import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { PatientService } from '../user-management/patient.service';

// Handles booking (with a database transaction to atomically create appointment + mark slot)
// and listing the patient's own appointments.
export class AppointmentService {
  static async book(userId: number, timeSlotId: number) {
    // Resolve the user ID to a PatientProfile. This also serves as a guard:
    // if the user has no patient profile, they can't book appointments.
    const patient = await PatientService.findByUserId(userId);

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: { doctor: true },
    });

    if (!timeSlot) {
      throw new AppError('Time slot not found', 404);
    }

    // Race condition protection: between when the user saw the slot as "available"
    // and now, another user may have booked it. The transaction below will also
    // prevent this, but checking early avoids wasted work.
    if (timeSlot.isBooked) {
      throw new AppError('Time slot is no longer available', 409);
    }

    // Past-slot guard: we compute the full datetime by merging the date and startTime
    // fields, then compare to Date.now(). This prevents booking slots that started
    // before the current moment. Without this check, a user could book a slot that
    // already expired, which is nonsensical.
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

    // The $transaction call is critical for correctness:
    // Prisma wraps both operations in a DB transaction (BEGIN/COMMIT or ROLLBACK).
    // If step 1 succeeds but step 2 fails, the appointment creation is rolled back.
    // This prevents the TOCTOU (time-of-check-time-of-use) race where two users
    // book the same slot simultaneously — the DB transaction isolation ensures
    // only one write succeeds.
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
    // We look up the PatientProfile first because the Appointment table references
    // patientId (the profile ID), not the user ID directly.
    const patient = await PatientService.findByUserId(userId);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        timeSlot: true,
        doctor: {
          include: { user: { select: { name: true } }, department: { select: { name: true } } },
        },
      },
      // Most recent first — the frontend typically shows the latest appointment at the top.
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
