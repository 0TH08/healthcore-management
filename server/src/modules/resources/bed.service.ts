import { prisma } from '../../utils/prisma';
import { BedStatus } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

// Resource management for hospital beds — CRUD + assign/release workflow.
//
// The assign/release pattern uses an explicit state machine:
// UNOCCUPIED ↔ OCCUPIED (with validation guards in both directions).
// This is a simplified version of a real bed management system that would
// also track patient assignments, cleaning cycles, and maintenance status.
export class BedService {
  static async getAll() {
    const beds = await prisma.bed.findMany({
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
      // Grouped by department, then sorted by bed number within each department.
      orderBy: [{ departmentId: 'asc' }, { bedNumber: 'asc' }],
    });

    return beds.map((b) => ({
      id: b.id,
      bedNumber: b.bedNumber,
      status: b.status,
      departmentId: b.departmentId,
      departmentName: b.department.name,
      hospitalName: b.department.hospital.name,
    }));
  }

  static async create(data: { bedNumber: string; departmentId: number }) {
    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) throw new AppError('Department not found', 404);

    // New beds start as UNOCCUPIED. There's no check for duplicate bedNumber within
    // a department — the DB could have a unique constraint on (departmentId, bedNumber)
    // if needed, but the MVP doesn't enforce this.
    return prisma.bed.create({
      data: { bedNumber: data.bedNumber, departmentId: data.departmentId, status: 'UNOCCUPIED' },
    });
  }

  static async update(bedId: number, data: { bedNumber?: string; departmentId?: number; status?: BedStatus }) {
    const existing = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!existing) throw new AppError('Bed not found', 404);

    if (data.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!department) throw new AppError('Department not found', 404);
    }

    return prisma.bed.update({ where: { id: bedId }, data });
  }

  static async delete(bedId: number) {
    const existing = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!existing) throw new AppError('Bed not found', 404);

    await prisma.bed.delete({ where: { id: bedId } });
    return existing;
  }

  static async assign(bedId: number) {
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) throw new AppError('Bed not found', 404);
    // Idempotency guard: you can't assign an already-occupied bed.
    // The caller should check bed status in the UI before calling assign().
    if (bed.status === 'OCCUPIED') throw new AppError('Bed is already occupied', 409);

    return prisma.bed.update({
      where: { id: bedId },
      data: { status: 'OCCUPIED' },
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
    });
  }

  static async release(bedId: number) {
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) throw new AppError('Bed not found', 404);
    // You can't release an already-unoccupied bed. This prevents accidental
    // double-release notifications to housekeeping.
    if (bed.status === 'UNOCCUPIED') throw new AppError('Bed is already unoccupied', 409);

    return prisma.bed.update({
      where: { id: bedId },
      data: { status: 'UNOCCUPIED' },
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
    });
  }
}
