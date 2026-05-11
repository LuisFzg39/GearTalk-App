import { Request, Response, NextFunction } from 'express';

interface HttpError extends Error {
  status?: number;
}

function databaseConnectivityMessage(raw: string): string | null {
  if (
    raw.includes('Tenant or user not found') ||
    raw.includes('password authentication failed') ||
    raw.includes('no pg_hba.conf entry')
  ) {
    return (
      'Cannot connect to the database. In server/.env, set DATABASE_URL to the Postgres URI from your Supabase project ' +
      '(Project Settings → Database → Connection string → URI). Paste the database password from that page ' +
      '(not the anon or service_role API keys). After updating .env, restart the API server.'
    );
  }
  return null;
}

export const errorMiddleware = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  const connectivity = databaseConnectivityMessage(err.message);
  if (connectivity) {
    res.status(503).json({
      message: connectivity,
      status: 503,
    });
    return;
  }

  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    status,
  });
};
