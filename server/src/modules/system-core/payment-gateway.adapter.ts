export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message?: string;
}

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
    return {
      success: true,
      transactionId: gatewayTransactionId,
      message: 'Transaction is valid',
    };
  }
}
