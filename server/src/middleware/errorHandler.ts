import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Server Error:', err);

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    code: statusCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
