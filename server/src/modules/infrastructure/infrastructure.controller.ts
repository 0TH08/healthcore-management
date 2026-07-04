import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BedStatus, UserRole } from '@prisma/client';
import { HospitalService } from './hospital.service';
import { DepartmentService } from './department.service';
import { AdminService } from '../user-management/admin.service';
import { AuditLogService } from '../audit/audit-log.service';
import { BedService } from '../resources/bed.service';
import { MedicalDeviceService } from '../resources/medical-device.service';

const createHospitalSchema = z.object({
  name: z.string().min(1, 'Hospital name is required'),
  address: z.string().min(1, 'Address is required'),
  networkId: z.number().int().positive('Valid networkId is required'),
});

const updateHospitalSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  networkId: z.number().int().positive().optional(),
});

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  hospitalId: z.number().int().positive('Valid hospitalId is required'),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  hospitalId: z.number().int().positive().optional(),
});

const createBedSchema = z.object({
  bedNumber: z.string().min(1, 'Bed number is required'),
  departmentId: z.number().int().positive('Valid departmentId is required'),
});

const updateBedSchema = z.object({
  bedNumber: z.string().min(1).optional(),
  departmentId: z.number().int().positive().optional(),
  status: z.nativeEnum(BedStatus).optional(),
});

const createDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required'),
  type: z.string().min(1, 'Device type is required'),
  departmentId: z.number().int().positive('Valid departmentId is required'),
});

const createStaffSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Role must be DOCTOR, NURSE, or ADMIN' }),
  }).refine((r) => r !== 'PATIENT', { message: 'Cannot create PATIENT via staff management' }),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.number().int().positive('Valid departmentId is required'),
});

const roleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Role must be DOCTOR, NURSE, or ADMIN' }),
  }).refine((r) => r !== 'PATIENT', { message: 'Cannot assign PATIENT role via staff management' }),
});

export class InfrastructureController {
  static async createHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createHospitalSchema.parse(req.body);
      const hospital = await HospitalService.create(data);
      await AuditLogService.record(req.user!.userId, 'CREATE', 'Hospital', hospital.id, `Created hospital "${data.name}"`);
      res.status(201).json({ status: 'ok', hospital });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }

  static async updateHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const hospitalId = Number(req.params.hospitalId);
      if (!Number.isInteger(hospitalId) || hospitalId < 1) { res.status(400).json({ status: 'error', message: 'Invalid hospital ID' }); return; }
      const data = updateHospitalSchema.parse(req.body);
      const hospital = await HospitalService.update(hospitalId, data);
      await AuditLogService.record(req.user!.userId, 'UPDATE', 'Hospital', hospitalId, `Updated hospital #${hospitalId}`);
      res.json({ status: 'ok', hospital });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }

  static async deleteHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const hospitalId = Number(req.params.hospitalId);
      if (!Number.isInteger(hospitalId) || hospitalId < 1) { res.status(400).json({ status: 'error', message: 'Invalid hospital ID' }); return; }
      const hospital = await HospitalService.delete(hospitalId);
      await AuditLogService.record(req.user!.userId, 'DELETE', 'Hospital', hospitalId, `Deleted hospital #${hospitalId} ("${hospital.name}")`);
      res.json({ status: 'ok', message: 'Hospital deleted' });
    } catch (err) {
      next(err);
    }
  }

  static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createDepartmentSchema.parse(req.body);
      const department = await DepartmentService.create(data);
      await AuditLogService.record(req.user!.userId, 'CREATE', 'Department', department.id, `Created department "${data.name}"`);
      res.status(201).json({ status: 'ok', department });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }

  static async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = Number(req.params.departmentId);
      if (!Number.isInteger(departmentId) || departmentId < 1) { res.status(400).json({ status: 'error', message: 'Invalid department ID' }); return; }
      const data = updateDepartmentSchema.parse(req.body);
      const department = await DepartmentService.update(departmentId, data);
      await AuditLogService.record(req.user!.userId, 'UPDATE', 'Department', departmentId, `Updated department #${departmentId}`);
      res.json({ status: 'ok', department });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }

  static async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = Number(req.params.departmentId);
      if (!Number.isInteger(departmentId) || departmentId < 1) { res.status(400).json({ status: 'error', message: 'Invalid department ID' }); return; }
      const department = await DepartmentService.delete(departmentId);
      await AuditLogService.record(req.user!.userId, 'DELETE', 'Department', departmentId, `Deleted department #${departmentId} ("${department.name}")`);
      res.json({ status: 'ok', message: 'Department deleted' });
    } catch (err) {
      next(err);
    }
  }

  static async createBed(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBedSchema.parse(req.body);
      const bed = await BedService.create(data);
      await AuditLogService.record(req.user!.userId, 'CREATE', 'Bed', bed.id, `Created bed "${data.bedNumber}"`);
      res.status(201).json({ status: 'ok', bed });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }

  static async updateBed(req: Request, res: Response, next: NextFunction) {
    try {
      const bedId = Number(req.params.bedId);
      if (!Number.isInteger(bedId) || bedId < 1) { res.status(400).json({ status: 'error', message: 'Invalid bed ID' }); return; }
      const data = updateBedSchema.parse(req.body);
      const bed = await BedService.update(bedId, data);
      await AuditLogService.record(req.user!.userId, 'UPDATE', 'Bed', bedId, `Updated bed #${bedId}`);
      res.json({ status: 'ok', bed });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }

  static async deleteBed(req: Request, res: Response, next: NextFunction) {
    try {
      const bedId = Number(req.params.bedId);
      if (!Number.isInteger(bedId) || bedId < 1) { res.status(400).json({ status: 'error', message: 'Invalid bed ID' }); return; }
      const bed = await BedService.delete(bedId);
      await AuditLogService.record(req.user!.userId, 'DELETE', 'Bed', bedId, `Deleted bed #${bedId} ("${bed.bedNumber}")`);
      res.json({ status: 'ok', message: 'Bed deleted' });
    } catch (err) {
      next(err);
    }
  }

  static async createMedicalDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createDeviceSchema.parse(req.body);
      const device = await MedicalDeviceService.create(data);
      await AuditLogService.record(req.user!.userId, 'CREATE', 'MedicalDevice', device.id, `Created device "${data.name}"`);
      res.status(201).json({ status: 'ok', device });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }

  static async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createStaffSchema.parse(req.body);
      const staff = await AdminService.createStaff(data);
      await AuditLogService.record(req.user!.userId, 'CREATE', 'StaffProfile', staff.id, `Created ${data.role} account "${data.name}" (${data.email})`);
      res.status(201).json({ status: 'ok', staff });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }

  static async deactivateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staffId = Number(req.params.staffId);
      if (!Number.isInteger(staffId) || staffId < 1) { res.status(400).json({ status: 'error', message: 'Invalid staff ID' }); return; }
      const staff = await AdminService.deactivateStaff(staffId);
      await AuditLogService.record(req.user!.userId, 'DEACTIVATE', 'StaffProfile', staffId, `Deactivated staff #${staffId} ("${staff.name}")`);
      res.json({ status: 'ok', staff });
    } catch (err) {
      next(err);
    }
  }

  static async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const staffId = Number(req.params.staffId);
      if (!Number.isInteger(staffId) || staffId < 1) { res.status(400).json({ status: 'error', message: 'Invalid staff ID' }); return; }
      const data = roleSchema.parse(req.body);
      const result = await AdminService.assignRole(staffId, data.role);
      await AuditLogService.record(req.user!.userId, 'ROLE_CHANGE', 'StaffProfile', staffId, `Changed role for staff #${staffId} from ${result.previousRole} to ${data.role}`);
      res.json({ status: 'ok', staff: { id: result.id, name: result.name, email: result.email, role: result.role } });
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ status: 'error', message: err.errors[0].message }); return; }
      next(err);
    }
  }
}
