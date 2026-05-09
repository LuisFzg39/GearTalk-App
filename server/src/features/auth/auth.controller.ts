import { NextFunction, Request, Response } from 'express';
import * as authService from './auth.service';
import { LoginRequest, RegisterRequest } from './auth.types';

const VALID_ROLES = ['manager', 'specialist'] as const;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role, preferred_language } = req.body as Partial<RegisterRequest>;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'name, email, password and role are required' });
      return;
    }

    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ message: 'role must be either manager or specialist' });
      return;
    }

    const result = await authService.register({
      name,
      email,
      password,
      role,
      preferred_language,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as Partial<LoginRequest>;

    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' });
      return;
    }

    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const authController = { register, login };
