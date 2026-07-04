import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { PatientService } from '../user-management/patient.service';
import { PaymentGatewayAdapter } from '../system-core/payment-gateway.adapter';
import { NotificationServiceAdapter } from '../system-core/notification-service.adapter';

export class PaymentTransactionService {
  static async authorize(userId: number, appointmentId: number, cardNumber: string, amount: number) {
    const patient = await PatientService.findByUserId(userId);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: { select: { email: true, name: true } } } },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.patientId !== patient.id) {
      throw new AppError('This appointment does not belong to you', 403);
    }

    if (appointment.status !== 'BOOKED') {
      throw new AppError('Appointment is not in a bookable state for payment', 400);
    }

    const existingPayment = await prisma.paymentTransaction.findUnique({
      where: { appointmentId },
    });

    if (existingPayment) {
      throw new AppError('Payment already exists for this appointment', 409);
    }

    const gatewayResult = PaymentGatewayAdapter.authorizePayment(cardNumber, amount);

    if (gatewayResult.success) {
      const [transaction] = await prisma.$transaction([
        prisma.paymentTransaction.create({
          data: {
            appointmentId: appointment.id,
            amount,
            status: 'COMPLETED',
            paymentDate: new Date(),
          },
        }),
        prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: 'PAID' },
        }),
      ]);

      NotificationServiceAdapter.sendBookingConfirmation(
        appointment.patient.user.email,
        appointment.patient.user.name,
        appointment.id,
      );

      return {
        success: true,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          paymentDate: transaction.paymentDate,
          gatewayTransactionId: gatewayResult.transactionId,
        },
      };
    }

    await prisma.paymentTransaction.create({
      data: {
        appointmentId: appointment.id,
        amount,
        status: 'FAILED',
      },
    });

    return {
      success: false,
      message: gatewayResult.message,
    };
  }

  static async validate(userId: number, transactionId: number) {
    const patient = await PatientService.findByUserId(userId);

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        appointment: {
          include: { patient: true },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Payment transaction not found', 404);
    }

    if (transaction.appointment.patientId !== patient.id) {
      throw new AppError('This payment does not belong to you', 403);
    }

    if (transaction.status === 'PENDING') {
      const gatewayResult = PaymentGatewayAdapter.validateTransaction(
        `TXN-${transaction.id}`,
      );

      if (gatewayResult.success) {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED', paymentDate: new Date() },
        });
        await prisma.appointment.update({
          where: { id: transaction.appointmentId },
          data: { status: 'PAID' },
        });
      }
    }

    const updated = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    return {
      id: updated!.id,
      amount: updated!.amount,
      status: updated!.status,
      paymentDate: updated!.paymentDate,
    };
  }

  static async getTransaction(userId: number, transactionId: number) {
    const patient = await PatientService.findByUserId(userId);

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: { include: { user: { select: { name: true } } } },
            timeSlot: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Payment transaction not found', 404);
    }

    if (transaction.appointment.patientId !== patient.id) {
      throw new AppError('This payment does not belong to you', 403);
    }

    return {
      id: transaction.id,
      amount: transaction.amount,
      status: transaction.status,
      paymentDate: transaction.paymentDate,
      appointment: {
        id: transaction.appointment.id,
        status: transaction.appointment.status,
        doctorName: transaction.appointment.doctor.user.name,
        date: transaction.appointment.timeSlot.date,
        startTime: transaction.appointment.timeSlot.startTime,
      },
    };
  }
}
