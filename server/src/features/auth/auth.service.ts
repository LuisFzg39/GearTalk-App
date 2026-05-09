import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../config';
import { JWT_SECRET } from '../../config';
import { AuthPayload, LoginRequest, RegisterRequest } from './auth.types';

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

const signToken = (payload: AuthPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const { name, email, password, role, preferred_language } = data;

  const existing = await pool.query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS exists',
    [email]
  );

  if (existing.rows[0]?.exists) {
    throw new Error('Email already in use');
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const RETURNING_USER = `RETURNING json_build_object(
       'id', id,
       'name', name,
       'email', email,
       'role', role,
       'preferred_language', preferred_language
     ) AS user`;

  const inserted =
    preferred_language !== undefined
      ? await pool.query<{ user: User }>(
          `INSERT INTO users (name, email, password_hash, role, preferred_language)
           VALUES ($1, $2, $3, $4, $5)
           ${RETURNING_USER}`,
          [name, email, password_hash, role, preferred_language]
        )
      : await pool.query<{ user: User }>(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES ($1, $2, $3, $4)
           ${RETURNING_USER}`,
          [name, email, password_hash, role]
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
    throw new Error('Invalid credentials');
  }

  const matches = await bcrypt.compare(password, row.password_hash);
  if (!matches) {
    throw new Error('Invalid credentials');
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
