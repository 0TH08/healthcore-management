import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

// Creates a prescription linked to an existing medical record.
// Validates the medical record exists before creating.
//
// Why a separate service from MedicalRecordService:
// Prescriptions have their own lifecycle and validation rules. A medical record
// can have zero or many prescriptions, and a prescription can be created or renewed
// independently of the record's diagnosis/notes. Keeping them separate avoids
// bloating the MedicalRecordService with prescription-specific concerns.
export class PrescriptionService {
  static async generate(recordId: number, data: {
    medication: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }) {
    // Foreign key guard: the medical record must exist. Prisma would reject this
    // with a foreign key violation anyway, but a 404 is more informative.
    const record = await prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!record) {
      throw new AppError('Medical record not found', 404);
    }

    return prisma.prescription.create({
      data: {
        medicalRecordId: recordId,
        medication: data.medication,
        dosage: data.dosage,
        frequency: data.frequency,
        startDate: new Date(data.startDate),
        // endDate is optional — a prescription may be ongoing with no set end date.
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }
}
