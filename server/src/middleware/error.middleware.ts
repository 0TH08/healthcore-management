import { Request, Response, NextFunction } from 'express';

// Custom error class with an HTTP status code.
//
// Why extend Error instead of using a plain object?
// Express error middleware catches Error instances thrown via next(err) or
// thrown in async handlers (via express-async-errors or manual next(err)).
// Subclassing Error ensures instanceof checks work and stack traces are preserved.
//
// Why Object.setPrototypeOf?
// TypeScript subclassing of built-ins can break instanceof in some transpilation
// targets. setPrototypeOf restores the prototype chain.
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Global Express error handler — registered LAST in app.use() order.
//
// Logic:
// - Express only reaches this middleware when an error is explicitly passed
//   via next(err) or thrown in an async route (which Express 4.x catches if
//   the controller calls next(err) explicitly).
// - Distinguishes AppError from generic Error: an AppError was intentionally
//   thrown by the application (e.g. "Patient not found" → 404), while a generic
//   Error is an unexpected bug that should return 500.
// - Always returns a consistent JSON shape so the client can rely on the
//   { status, statusCode, message } format.
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
}
