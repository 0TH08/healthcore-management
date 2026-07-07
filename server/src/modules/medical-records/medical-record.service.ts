import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

// Used by both the patient (read own records / export) and doctor (consult & update) flows.
// exportRecords generates a plain-text file format for download.
//
// Design notes:
// - All methods that take patientId expect the PatientProfile ID (not UserAccount ID).
//   Callers like PatientService.findByUserId() resolve userId → patientId first.
// - The update method uses partial data (only diagnosis and notes are updatable).
//   Allergies and prescriptions are managed through separate services to keep
//   responsibilities clear.
// - The export format is deliberately simple (plain text, not CSV/PDF) to keep
//   the MVP scope small. The format is readable both as a text file and when
//   displayed in a <pre> tag on the frontend.
export class MedicalRecordService {
  static async getPatientRecords(patientId: number) {
    return prisma.medicalRecord.findMany({
      where: { patientId },
      include: { allergies: true, prescriptions: true },
      // Most recent first: the frontend usually shows the latest record at the top.
      orderBy: { date: 'desc' },
    });
  }

  static async getRecordById(recordId: number) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        allergies: true,
        prescriptions: true,
        patient: { include: { user: { select: { name: true } } } },
      },
    });

    if (!record) {
      throw new AppError('Medical record not found', 404);
    }

    return record;
  }

  static async updateRecord(recordId: number, data: { diagnosis?: string; notes?: string }) {
    // Check existence first to give a specific 404 rather than Prisma's generic error.
    const existing = await prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!existing) {
      throw new AppError('Medical record not found', 404);
    }

    // Prisma's update will only modify the fields that are provided (undefined fields
    // are left unchanged). This allows partial updates from the frontend form.
    return prisma.medicalRecord.update({
      where: { id: recordId },
      data,
      include: { allergies: true, prescriptions: true },
    });
  }

  static async exportRecords(patientId: number) {
    const records = await this.getPatientRecords(patientId);
    if (records.length === 0) {
      throw new AppError('No medical records found for export', 404);
    }

    // Generates a plain-text document structured with headers per record.
    // The format is designed to be both human-readable and parseable.
    // Each record section includes: date, diagnosis, notes, allergies list,
    // and prescriptions list with their details.
    const lines: string[] = ['MEDICAL RECORDS EXPORT', '=====================', ''];
    for (const r of records) {
      lines.push(`Record #${r.id}`);
      lines.push(`Date: ${r.date.toISOString().split('T')[0]}`);
      lines.push(`Diagnosis: ${r.diagnosis}`);
      lines.push(`Notes: ${r.notes || 'N/A'}`);
      lines.push('Allergies:');
      if (r.allergies.length === 0) {
        lines.push('  None');
      } else {
        for (const a of r.allergies) {
          lines.push(`  - ${a.allergen} (${a.severity})${a.reaction ? `: ${a.reaction}` : ''}`);
        }
      }
      lines.push('Prescriptions:');
      if (r.prescriptions.length === 0) {
        lines.push('  None');
      } else {
        for (const p of r.prescriptions) {
          lines.push(`  - ${p.medication} | ${p.dosage} | ${p.frequency} | ${p.startDate.toISOString().split('T')[0]}${p.endDate ? ` -> ${p.endDate.toISOString().split('T')[0]}` : ''}`);
        }
      }
      lines.push('---', '');
    }

    return lines.join('\n');
  }
}
