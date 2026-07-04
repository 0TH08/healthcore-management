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
