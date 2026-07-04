import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from './audit-log.service';

export class AuditController {
  static async getAuditLogs(_req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await AuditLogService.getAll();
      res.json({ status: 'ok', logs });
    } catch (err) {
      next(err);
    }
  }
}
