import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PaymentTransactionService } from './payment-transaction.service';

const authorizeSchema = z.object({
  appointmentId: z.number().int().positive('Valid appointmentId is required'),
  cardNumber: z.string().min(1, 'Card number is required'),
  amount: z.number().positive('Amount must be positive'),
});

const validateSchema = z.object({
  transactionId: z.number().int().positive('Valid transactionId is required'),
});

export class PaymentController {
  static async authorize(req: Request, res: Response, next: NextFunction) {
    try {
      const data = authorizeSchema.parse(req.body);
      const result = await PaymentTransactionService.authorize(
        req.user!.userId,
        data.appointmentId,
        data.cardNumber,
        data.amount,
      );

      if (result.success) {
        res.status(201).json({ status: 'ok', transaction: result.transaction });
      } else {
        res.status(402).json({ status: 'error', message: result.message });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validateSchema.parse(req.body);
      const result = await PaymentTransactionService.validate(
        req.user!.userId,
        data.transactionId,
      );
      res.json({ status: 'ok', transaction: result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ status: 'error', message: err.errors[0].message });
        return;
      }
      next(err);
    }
  }

  static async getTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const transactionId = Number(req.params.transactionId);

      if (!Number.isInteger(transactionId) || transactionId < 1) {
        res.status(400).json({ status: 'error', message: 'Invalid transactionId' });
        return;
      }

      const result = await PaymentTransactionService.getTransaction(
        req.user!.userId,
        transactionId,
      );
      res.json({ status: 'ok', transaction: result });
    } catch (err) {
      next(err);
    }
  }
}
