import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TriagePriority, TriageStatus } from '@prisma/client';
import { TriageCaseService } from './triage-case.service';

const createSchema = z.object({
  patientUserId: z.number().int().positive('Valid patientUserId is required'),
  symptoms: z.string().min(1, 'Symptoms are required'),
  notes: z.string().optional(),
});

const prioritySchema = z.object({
  priority: z.nativeEnum(TriagePriority, { errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, HIGH, or CRITICAL' }) }),
});

const statusSchema = z.object({
  status: z.nativeEnum(TriageStatus, { errorMap: () => ({ message: 'Status must be WAITING, IN_PROGRESS, or COMPLETED' }) }),
});

export class TriageController {
  static async getQueue(_req: Request, res: Response, next: NextFunction) {
    try {
      const queue = await TriageCaseService.getQueue();
      res.json({ status: 'ok', queue });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const triageCase = await TriageCaseService.create(req.user!.userId, data);
      res.status(201).json({ status: 'ok', triageCase });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  static async updatePriority(req: Request, res: Response, next: NextFunction) {
    try {
      const triageId = Number(req.params.triageId);
      if (!Number.isInteger(triageId) || triageId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid triage ID' });
        return;
      }

      const data = prioritySchema.parse(req.body);
      const id = await TriageCaseService.updatePriority(triageId, data.priority);
      res.json({ status: 'ok', triageCaseId: id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const triageId = Number(req.params.triageId);
      if (!Number.isInteger(triageId) || triageId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid triage ID' });
        return;
      }

      const data = statusSchema.parse(req.body);
      const id = await TriageCaseService.updateStatus(triageId, data.status);
      res.json({ status: 'ok', triageCaseId: id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  static async broadcast(_req: Request, res: Response, next: NextFunction) {
    try {
      const queue = await TriageCaseService.broadcast();
      res.json({ status: 'ok', broadcast: true, queue });
    } catch (err) {
      next(err);
    }
  }
}
