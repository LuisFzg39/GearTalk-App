import { Request, Response, NextFunction } from 'express';

interface HttpError extends Error {
  status?: number;
}

export const errorMiddleware = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    status,
  });
};
