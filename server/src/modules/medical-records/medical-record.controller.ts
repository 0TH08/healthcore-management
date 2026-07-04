import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PatientService } from '../user-management/patient.service';
import { DoctorService } from '../user-management/doctor.service';
import { MedicalRecordService } from './medical-record.service';
import { PrescriptionService } from './prescription.service';

const updateRecordSchema = z.object({
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});

const prescriptionSchema = z.object({
  medication: z.string().min(1, 'Medication is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

export class MedicalRecordController {
  static async getMyRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.findByUserId(req.user!.userId);
      const records = await MedicalRecordService.getPatientRecords(patient.id);
      res.json({ status: 'ok', records });
    } catch (err) {
      next(err);
    }
  }

  static async exportMyRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.findByUserId(req.user!.userId);
      const content = await MedicalRecordService.exportRecords(patient.id);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="medical-records.txt"');
      res.send(content);
    } catch (err) {
      next(err);
    }
  }

  static async searchPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const searchTerm = (req.query.search as string) || '';
      const patients = await DoctorService.searchPatients(searchTerm);
      res.json({ status: 'ok', patients });
    } catch (err) {
      next(err);
    }
  }

  static async getPatientRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = Number(req.params.patientId);
      if (!Number.isInteger(patientId) || patientId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid patient ID' });
        return;
      }
      const records = await DoctorService.consultMedicalRecords(patientId);
      res.json({ status: 'ok', records });
    } catch (err) {
      next(err);
    }
  }

  static async updateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const recordId = Number(req.params.recordId);
      if (!Number.isInteger(recordId) || recordId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid record ID' });
        return;
      }
      const data = updateRecordSchema.parse(req.body);
      const record = await MedicalRecordService.updateRecord(recordId, data);
      res.json({ status: 'ok', record });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  static async createPrescription(req: Request, res: Response, next: NextFunction) {
    try {
      const recordId = Number(req.params.recordId);
      if (!Number.isInteger(recordId) || recordId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid record ID' });
        return;
      }
      const data = prescriptionSchema.parse(req.body);
      const prescription = await PrescriptionService.generate(recordId, data);
      res.status(201).json({ status: 'ok', prescription });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }
}
