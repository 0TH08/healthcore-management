import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { TimeSlotService } from './timeslot.service';
import { AppointmentService } from './appointment.service';

const bookSchema = z.object({
  timeSlotId: z.number().int().positive('Valid timeSlotId is required'),
});

export class AppointmentController {
  static async getDepartments(_req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await prisma.department.findMany({
        include: { hospital: { select: { name: true } } },
        orderBy: { name: 'asc' },
      });

      res.json({
        status: 'ok',
        departments: departments.map((d) => ({
          id: d.id,
          name: d.name,
          hospitalName: d.hospital.name,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = req.query.departmentId
        ? Number(req.query.departmentId)
        : undefined;

      const where: Record<string, unknown> = {
        user: { role: 'DOCTOR' },
      };

      if (departmentId) {
        where.departmentId = departmentId;
      }

      const doctors = await prisma.staffProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { id: 'asc' },
      });

      res.json({
        status: 'ok',
        doctors: doctors.map((d) => ({
          id: d.id,
          name: d.user.name,
          email: d.user.email,
          specialization: d.specialization,
          departmentId: d.department.id,
          departmentName: d.department.name,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTimeSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = req.query.departmentId
        ? Number(req.query.departmentId)
        : undefined;
      const doctorId = req.query.doctorId
        ? Number(req.query.doctorId)
        : undefined;
      const date = req.query.date as string | undefined;

      const slots = await TimeSlotService.findAvailable({
        departmentId,
        doctorId,
        date,
      });

      res.json({ status: 'ok', timeSlots: slots });
    } catch (err) {
      next(err);
    }
  }

  static async book(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bookSchema.parse(req.body);
      const result = await AppointmentService.book(req.user!.userId, data.timeSlotId);
      res.status(201).json({ status: 'ok', appointment: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  static async getMyAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const appointments = await AppointmentService.getPatientAppointments(
        req.user!.userId,
      );
      res.json({ status: 'ok', appointments });
    } catch (err) {
      next(err);
    }
  }
}
