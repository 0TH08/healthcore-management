import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DeviceStatus } from '@prisma/client';
import { BedService } from './bed.service';
import { MedicalDeviceService } from './medical-device.service';

const deviceStatusSchema = z.object({
  status: z.nativeEnum(DeviceStatus, {
    errorMap: () => ({ message: 'Status must be AVAILABLE, IN_USE, or UNDER_MAINTENANCE' }),
  }),
});

export class ResourceController {
  static async getBeds(_req: Request, res: Response, next: NextFunction) {
    try {
      const beds = await BedService.getAll();
      res.json({ status: 'ok', beds });
    } catch (err) { next(err); }
  }

  static async assignBed(req: Request, res: Response, next: NextFunction) {
    try {
      const bedId = Number(req.params.bedId);
      if (!Number.isInteger(bedId) || bedId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid bed ID' });
        return;
      }
      const bed = await BedService.assign(bedId);
      res.json({ status: 'ok', bed: { id: bed.id, bedNumber: bed.bedNumber, status: bed.status } });
    } catch (err) { next(err); }
  }

  static async releaseBed(req: Request, res: Response, next: NextFunction) {
    try {
      const bedId = Number(req.params.bedId);
      if (!Number.isInteger(bedId) || bedId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid bed ID' });
        return;
      }
      const bed = await BedService.release(bedId);
      res.json({ status: 'ok', bed: { id: bed.id, bedNumber: bed.bedNumber, status: bed.status } });
    } catch (err) { next(err); }
  }

  static async getDevices(_req: Request, res: Response, next: NextFunction) {
    try {
      const devices = await MedicalDeviceService.getAll();
      res.json({ status: 'ok', devices });
    } catch (err) { next(err); }
  }

  static async assignDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const deviceId = Number(req.params.deviceId);
      if (!Number.isInteger(deviceId) || deviceId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid device ID' });
        return;
      }
      const device = await MedicalDeviceService.assign(deviceId);
      res.json({ status: 'ok', device: { id: device.id, name: device.name, status: device.status } });
    } catch (err) { next(err); }
  }

  static async updateDeviceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const deviceId = Number(req.params.deviceId);
      if (!Number.isInteger(deviceId) || deviceId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid device ID' });
        return;
      }
      const data = deviceStatusSchema.parse(req.body);
      const device = await MedicalDeviceService.updateStatus(deviceId, data.status);
      res.json({ status: 'ok', device: { id: device.id, name: device.name, status: device.status } });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }
}
