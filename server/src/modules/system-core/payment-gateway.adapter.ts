export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message?: string;
}

// Mocked external payment gateway adapter.
// Only card "4242424242424242" (spaces ignored) succeeds;
// any other card is declined with a 402 error in the controller.
//
// Adapter pattern: PaymentTransactionService calls this adapter to simulate
// authorization and validation. In production, these methods would make HTTP
// calls to a real payment processor (Stripe, Adyen, etc.).
// The CardTest page in the frontend is designed around this mock — it knows
// which card number works and displays appropriate UI for both success/failure.
//
// The separator normalization (removing spaces) allows users to enter
// "4242 4242 4242 4242" (with spaces) or "4242424242424242" (without).
export class PaymentGatewayAdapter {
  static readonly SUCCESS_CARD = '4242424242424242';

  static authorizePayment(cardNumber: string, amount: number): PaymentResult {
    const normalized = cardNumber.replace(/\s+/g, '');

    if (normalized === PaymentGatewayAdapter.SUCCESS_CARD) {
      return {
        success: true,
        transactionId: `GATEWAY-TXN-${Date.now()}`,
        message: 'Payment authorized successfully',
      };
    }

    return {
      success: false,
      message: 'Card declined. Please check your card details and try again.',
    };
  }

  static validateTransaction(gatewayTransactionId: string): PaymentResult {
    // The mock always returns success for validation. In production, this would
    // call the payment provider's API to confirm the transaction status.
    return {
      success: true,
      transactionId: gatewayTransactionId,
      message: 'Transaction is valid',
    };
  }
}
