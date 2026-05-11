import dotenv from 'dotenv';
import { Pool, PoolConfig } from 'pg';

dotenv.config();

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'DEEPL_API_KEY', 'CLIENT_URL'] as const;

export const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

export const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

if (Number.isNaN(PORT)) {
  throw new Error('PORT must be a valid number');
}

export const JWT_SECRET = process.env.JWT_SECRET ?? '';
export const DEEPL_API_KEY = process.env.DEEPL_API_KEY ?? '';
export const CLIENT_URL = process.env.CLIENT_URL ?? '';

function createPoolConfig(connectionString: string): PoolConfig {
  const needsSsl =
    /supabase\.co/i.test(connectionString) || /sslmode=require/i.test(connectionString);
  return {
    connectionString,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

function createMissingDatabasePool(): Pool {
  const error = () => {
    const err = new Error('Missing required environment variable: DATABASE_URL') as Error & {
      status?: number;
    };
    err.status = 500;
    throw err;
  };

  return {
    query: error,
    connect: error,
  } as unknown as Pool;
}

export const pool = process.env.DATABASE_URL
  ? new Pool(createPoolConfig(process.env.DATABASE_URL))
  : createMissingDatabasePool();
