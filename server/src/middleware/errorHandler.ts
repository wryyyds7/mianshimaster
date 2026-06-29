import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(public readonly errors: { field: string; message: string }[]) {
    super('Validation failed', 'VALIDATION_ERROR', 422);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '未提供认证令牌') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '无权限访问') {
    super(message, 'FORBIDDEN', 403);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = req.requestId || 'unknown';

  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
    });
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      requestId,
    });
  }

  logger.error('Unexpected server error', {
    requestId,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    requestId,
  });
}
