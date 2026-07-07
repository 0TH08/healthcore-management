import { prisma } from '../../utils/prisma';
import { TriagePriority, TriageStatus } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { InformationDisplayAdapter } from '../system-core/information-display.adapter';

// Custom sort: CRITICAL first, then HIGH, MEDIUM, LOW. Within the same priority,
// FIFO ordering (oldest created first). We can't rely on Prisma's ORDER BY because
// Prisma sorts enums alphabetically by their string value, which would put
// CRITICAL in the middle, not first.
const PRIORITY_ORDER: Record<TriagePriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export class TriageCaseService {
  // Returns the full triage queue sorted by priority then time.
  // This is the main "waiting room view" that nurses and doctors see on the dashboard.
  static async getQueue() {
    // We fetch ALL cases (not just WAITING) so the UI can show a complete picture
    // including cases that are IN_CONSULTATION or COMPLETED. Filtering is done client-side.
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
        // FIFO within same priority: earlier createdAt first.
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
    // Both profiles must exist. This is the only place where a nurse acting on behalf
    // of a patient is explicitly validated — the nurseUserId comes from the auth token,
    // and the patientUserId is selected by the nurse from the patient search UI.
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

    // Default priority is LOW. The triage nurse is expected to update the priority
    // after initial assessment using updatePriority(). This two-step flow prevents
    // accidental mis-triage during the busy creation moment.
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

  // Separated from create() so the nurse can re-evaluate priority later without
  // recreating the case. The prior existence check prevents creating orphan updates.
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

  // Status transitions: WAITING → IN_CONSULTATION → COMPLETED.
  // The service doesn't enforce the ordering; the frontend controls valid transitions.
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

  // "Broadcasts" the queue to a mocked information display (like a hospital hallway monitor).
  // The adapter currently just logs to console, but this could be swapped for an actual
  // WebSocket push or hospital display system integration.
  static async broadcast() {
    const queue = await this.getQueue();
    InformationDisplayAdapter.broadcastTriageQueue(queue);
    return queue;
  }
}
