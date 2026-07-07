import { prisma } from '../../utils/prisma';
import { AppError } from '../../middleware/error.middleware';
import { PatientService } from '../user-management/patient.service';
import { PaymentGatewayAdapter } from '../system-core/payment-gateway.adapter';
import { NotificationServiceAdapter } from '../system-core/notification-service.adapter';

// Handles authorize (with card check via mocked gateway), validate, and getTransaction.
// Enforces ownership: a patient can only pay for their own appointments.
// Uses $transaction for atomic create-transaction + update-appointment on success.
//
// Design decisions:
// - Ownership check on appointment.patientId: we first resolve userId→PatientProfile,
//   then verify the appointment belongs to that profile. This prevents Patient A from
//   paying for Patient B's appointment even if Patient A knows Patient B's appointment ID.
// - Status validation: payment is only allowed when appointment.status === 'BOOKED'.
//   Already-paid (PAID) or cancelled appointments cannot be paid again.
// - Duplicate payment prevention: we check for an existing PaymentTransaction on this
//   appointment before calling the gateway. 409 Conflict for retries.
// - Audit trail: even failed payments create a PaymentTransaction row with status FAILED.
//   This ensures there's a record of every attempted transaction for dispute resolution.
export class PaymentTransactionService {
  static async authorize(userId: number, appointmentId: number, cardNumber: string, amount: number) {
    // Step 1: resolve user → patient profile. Guards against non-patient users attempting payment.
    const patient = await PatientService.findByUserId(userId);

    // Step 2: fetch appointment with the patient's contact info (needed for notification later).
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: { select: { email: true, name: true } } } },
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Step 3: ownership + state guards. These must happen before any side effects.
    if (appointment.patientId !== patient.id) {
      throw new AppError('This appointment does not belong to you', 403);
    }

    if (appointment.status !== 'BOOKED') {
      throw new AppError('Appointment is not in a bookable state for payment', 400);
    }

    // Step 4: idempotency check. If payment already exists, reject.
    // This catches the case where the frontend double-submits the payment form.
    const existingPayment = await prisma.paymentTransaction.findUnique({
      where: { appointmentId },
    });

    if (existingPayment) {
      throw new AppError('Payment already exists for this appointment', 409);
    }

    // Step 5: call the (mocked) external payment gateway.
    const gatewayResult = PaymentGatewayAdapter.authorizePayment(cardNumber, amount);

    // Step 6a: success path — atomic DB update + notification (outside the transaction).
    if (gatewayResult.success) {
      // The $transaction ensures: if the PaymentTransaction row is created but the
      // Appointment status update fails, both are rolled back. This prevents an
      // "orphan" payment with no corresponding appointment status change.
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

      // Notification is fire-and-forget. If it fails (e.g., SMTP down), the transaction
      // still succeeded. The notification could be retried asynchronously.
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

    // Step 6b: failure path — still record the attempt. No transaction needed here
    // because there's no appointment status to roll back with.
    // The FAILED status allows the patient service representative to see what went wrong.
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
    // Ownership guard: only the patient who owns the transaction can validate it.
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

    // Only PENDING transactions need re-validation. COMPLETED or FAILED ones are
    // already final — calling validate again is a no-op aside from returning current status.
    if (transaction.status === 'PENDING') {
      const gatewayResult = PaymentGatewayAdapter.validateTransaction(
        `TXN-${transaction.id}`,
      );

      if (gatewayResult.success) {
        // We use two separate updates (not a transaction) because both are idempotent.
        // If the first succeeds and the second fails, the inconsistency is detectable
        // (payment COMPLETED but appointment still BOOKED) and recoverable.
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

    // Re-fetch to get the latest status (in case the update above changed it).
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
    // Read-only endpoint, but still enforces ownership. A patient cannot see
    // another patient's transaction details.
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
