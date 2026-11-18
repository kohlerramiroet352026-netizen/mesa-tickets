// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.error(`[Error] ${statusCode} - ${err.message}`);
  if (isDevelopment) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor',
    ...(isDevelopment && err.stack ? { stack: err.stack } : {}),
  });
}

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}
