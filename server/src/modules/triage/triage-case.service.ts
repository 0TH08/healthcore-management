import { prisma } from '../../utils/prisma';
import { TriagePriority, TriageStatus } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { InformationDisplayAdapter } from '../system-core/information-display.adapter';

const PRIORITY_ORDER: Record<TriagePriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export class TriageCaseService {
  static async getQueue() {
    const cases = await prisma.triageCase.findMany({
      include: {
        patient: {
          include: { user: { select: { id: true, name: true } } },
        },
        nurse: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return cases
      .sort((a, b) => {
        const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (p !== 0) return p;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .map((c) => ({
        id: c.id,
        patientId: c.patient.user.id,
        patientName: c.patient.user.name,
        priority: c.priority,
        status: c.status,
        symptoms: c.symptoms,
        notes: c.notes,
        nurseName: c.nurse?.user.name ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
  }

  static async create(
    nurseUserId: number,
    data: {
      patientUserId: number;
      symptoms: string;
      notes?: string;
    },
  ) {
    const nurseProfile = await prisma.staffProfile.findUnique({
      where: { userId: nurseUserId },
    });

    if (!nurseProfile) {
      throw new AppError('Nurse profile not found', 404);
    }

    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: data.patientUserId },
    });

    if (!patientProfile) {
      throw new AppError('Patient profile not found', 404);
    }

    const triageCase = await prisma.triageCase.create({
      data: {
        patientId: patientProfile.id,
        nurseId: nurseProfile.id,
        symptoms: data.symptoms,
        notes: data.notes ?? null,
        priority: 'LOW',
        status: 'WAITING',
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        nurse: { include: { user: { select: { name: true } } } },
      },
    });

    return {
      id: triageCase.id,
      patientName: triageCase.patient.user.name,
      priority: triageCase.priority,
      status: triageCase.status,
      symptoms: triageCase.symptoms,
      notes: triageCase.notes,
      nurseName: triageCase.nurse?.user.name ?? null,
      createdAt: triageCase.createdAt,
    };
  }

  static async updatePriority(triageId: number, priority: TriagePriority) {
    const existing = await prisma.triageCase.findUnique({ where: { id: triageId } });
    if (!existing) {
      throw new AppError('Triage case not found', 404);
    }

    const updated = await prisma.triageCase.update({
      where: { id: triageId },
      data: { priority },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        nurse: { include: { user: { select: { name: true } } } },
      },
    });

    return updated.id;
  }

  static async updateStatus(triageId: number, status: TriageStatus) {
    const existing = await prisma.triageCase.findUnique({ where: { id: triageId } });
    if (!existing) {
      throw new AppError('Triage case not found', 404);
    }

    const updated = await prisma.triageCase.update({
      where: { id: triageId },
      data: { status },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        nurse: { include: { user: { select: { name: true } } } },
      },
    });

    return updated.id;
  }

  static async broadcast() {
    const queue = await this.getQueue();
    InformationDisplayAdapter.broadcastTriageQueue(queue);
    return queue;
  }
}
