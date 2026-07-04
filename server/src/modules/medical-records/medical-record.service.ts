import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class MedicalRecordService {
  static async getPatientRecords(patientId: number) {
    return prisma.medicalRecord.findMany({
      where: { patientId },
      include: { allergies: true, prescriptions: true },
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
    const existing = await prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!existing) {
      throw new AppError('Medical record not found', 404);
    }

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
