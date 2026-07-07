// Mocked external email notification adapter.
// Logs to console instead of sending real emails — used during password recovery
// and after successful payment.
//
// Adapter pattern: The AuthService and PaymentTransactionService depend on this
// interface, not on a concrete email implementation. To switch to a real email
// service (e.g., SendGrid, AWS SES), replace the method bodies while keeping
// the same signatures. This also makes testing easy — the mock is the default.
export class NotificationServiceAdapter {
  static sendPasswordRecoveryEmail(email: string, name: string): void {
    console.log(`[MOCK EMAIL] Password recovery email sent to ${email} for user ${name}`);
  }

  static sendBookingConfirmation(email: string, name: string, appointmentId: number): void {
    console.log(
      `[MOCK EMAIL] Booking confirmation sent to ${email} for user ${name} (appointment #${appointmentId})`,
    );
  }
}
