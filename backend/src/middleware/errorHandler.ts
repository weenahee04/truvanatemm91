import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ('statusCode' in err) {
    const { statusCode, message } = err;
    
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    return res.status(statusCode).json({
      status: 'error',
      statusCode,
      message,
    });
  }

  // Unhandled errors
  logger.error(`500 - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error('Error stack:', err.stack);
  logger.error('Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    // Include error details in development or if explicitly enabled
    ...(process.env.NODE_ENV !== 'production' || process.env.ENABLE_ERROR_DETAILS === 'true' ? {
      error: err.message,
      stack: err.stack,
    } : {}),
  });
};
