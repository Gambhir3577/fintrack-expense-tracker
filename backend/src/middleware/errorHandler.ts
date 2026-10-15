import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Safe sanitization: Log only message and method/path, avoiding body or auth headers
  const status = err.status || err.statusCode || 500;
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - Error ${status}: ${err.message || 'Internal error'}`);

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { code: err.code } : {}),
  });
}
