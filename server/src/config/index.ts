import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'DEEPL_API_KEY', 'CLIENT_URL'] as const;

for (const key of requiredEnv) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

if (Number.isNaN(PORT)) {
  throw new Error('PORT must be a valid number');
}

export const JWT_SECRET = process.env.JWT_SECRET as string;
export const DEEPL_API_KEY = process.env.DEEPL_API_KEY as string;
export const CLIENT_URL = process.env.CLIENT_URL as string;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
