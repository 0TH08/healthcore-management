import { prisma } from '../../utils/prisma';
import { DeviceStatus } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

// Resource management for medical devices — CRUD + assign/release workflow.
//
// Device status states: AVAILABLE → IN_USE (via assign()), and general status
// updates via updateStatus() for transitions like maintenance or decommissioning.
// Unlike beds, devices have a more flexible status model (AVAILABLE, IN_USE, MAINTENANCE)
// managed through updateStatus() rather than paired assign/release methods.
export class MedicalDeviceService {
  static async getAll() {
    const devices = await prisma.medicalDevice.findMany({
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
      orderBy: [{ departmentId: 'asc' }, { name: 'asc' }],
    });

    return devices.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      status: d.status,
      departmentId: d.departmentId,
      departmentName: d.department.name,
      hospitalName: d.department.hospital.name,
    }));
  }

  static async create(data: { name: string; type: string; departmentId: number }) {
    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) throw new AppError('Department not found', 404);

    // New devices start as AVAILABLE. The type field is a free-text string
    // (e.g., "Ventilator", "MRI Scanner") that could be normalized to an enum later.
    return prisma.medicalDevice.create({
      data: { name: data.name, type: data.type, departmentId: data.departmentId, status: 'AVAILABLE' },
    });
  }

  static async assign(deviceId: number) {
    const device = await prisma.medicalDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new AppError('Medical device not found', 404);
    if (device.status === 'IN_USE') throw new AppError('Device is already in use', 409);

    return prisma.medicalDevice.update({
      where: { id: deviceId },
      data: { status: 'IN_USE' },
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
    });
  }

  // Generic status update for any state transition (e.g., IN_USE → MAINTENANCE,
  // MAINTENANCE → AVAILABLE). The frontend controls what transitions are offered.
  static async updateStatus(deviceId: number, status: DeviceStatus) {
    const device = await prisma.medicalDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new AppError('Medical device not found', 404);

    return prisma.medicalDevice.update({
      where: { id: deviceId },
      data: { status },
      include: {
        department: {
          select: { name: true, hospital: { select: { name: true } } },
        },
      },
    });
  }
}
