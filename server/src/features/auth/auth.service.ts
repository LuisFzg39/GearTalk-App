import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, pool } from '../../config';
import { AuthPayload, LoginRequest, RegisterRequest } from './auth.types';

type HttpStatusError = Error & { status: number };

const httpError = (message: string, status: number): never => {
  const err = new Error(message) as HttpStatusError;
  err.status = status;
  throw err;
};

interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'specialist';
  preferred_language: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

const BCRYPT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

const signToken = (payload: AuthPayload): string => {
  if (!JWT_SECRET) {
    httpError('Server is missing JWT_SECRET', 500);
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const { name, email, password, role, preferred_language } = data;

  const existing = await pool.query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS exists',
    [email]
  );

  if (existing.rows[0]?.exists) {
    httpError('Email already in use', 409);
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const inserted = await pool.query<{ user: User }>(
    `INSERT INTO users (name, email, password_hash, role, preferred_language)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING json_build_object(
       'id', id,
       'name', name,
       'email', email,
       'role', role,
       'preferred_language', preferred_language
     ) AS user`,
    [name, email, password_hash, role, preferred_language]
  );

  const user = inserted.rows[0].user;
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return { token, user };
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const { email, password } = data;

  const result = await pool.query<{
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'specialist';
    preferred_language: string;
    password_hash: string;
  }>(
    `SELECT id, name, email, role, preferred_language, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );

  const row = result.rows[0];
  if (!row) {
    httpError('Invalid credentials', 401);
  }

  const matches = await bcrypt.compare(password, row.password_hash);
  if (!matches) {
    httpError('Invalid credentials', 401);
  }

  const user: User = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    preferred_language: row.preferred_language,
  };

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return { token, user };
};

export const authService = { register, login };
