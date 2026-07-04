import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';

export class PrescriptionService {
  static async generate(recordId: number, data: {
    medication: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }) {
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
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }
}
