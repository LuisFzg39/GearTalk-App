import { NextFunction, Request, Response } from 'express';
import * as tasksService from './tasks.service';
import { CreateTaskRequest, TaskStatus, UpdateTaskStatusRequest } from './tasks.types';

const VALID_STATUSES: readonly TaskStatus[] = ['pending', 'active', 'alert', 'done'];

const requireUser = (req: Request) => {
  if (!req.user) {
    const error = new Error('Unauthorized') as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  return req.user;
};

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { instruction_original, specialist_id } = req.body as Partial<CreateTaskRequest>;

    if (!instruction_original || !specialist_id) {
      res.status(400).json({ message: 'instruction_original and specialist_id are required' });
      return;
    }

    const task = await tasksService.createTask(
      { instruction_original, specialist_id },
      user.id
    );
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const getMyTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);

    const tasks =
      user.role === 'manager'
        ? await tasksService.getTasksByManager(user.id)
        : await tasksService.getTasksBySpecialist(user.id);

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    const { status } = req.body as Partial<UpdateTaskStatusRequest>;

    if (!status || !VALID_STATUSES.includes(status)) {
      res
        .status(400)
        .json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const updated = await tasksService.updateTaskStatus(id, status, user.id);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const tasksController = { createTask, getMyTasks, updateStatus };
