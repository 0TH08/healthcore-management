export class NotificationServiceAdapter {
  static sendPasswordRecoveryEmail(email: string, name: string): void {
    console.log(`[MOCK EMAIL] Password recovery email sent to ${email} for user ${name}`);
  }
}
