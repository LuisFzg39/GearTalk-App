import { NextFunction, Request, Response } from 'express';
import * as tasksService from './tasks.service';
import { CreateTaskRequest, TaskStatus, UpdateTaskStatusRequest } from './tasks.types';

const VALID_STATUSES: readonly TaskStatus[] = ['pending', 'active', 'done'];

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

    if (user.role !== 'manager') {
      res.status(403).json({ message: 'Only managers can create tasks' });
      return;
    }

    const { title, instruction_original } = req.body as Partial<CreateTaskRequest>;

    const titleTrim = typeof title === 'string' ? title.trim() : '';
    const instructionTrim =
      typeof instruction_original === 'string' ? instruction_original.trim() : '';

    if (!titleTrim || !instructionTrim) {
      res.status(400).json({ message: 'title and instruction_original (description) are required' });
      return;
    }

    const task = await tasksService.createTask(
      { title: titleTrim, instruction_original: instructionTrim },
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
        : await tasksService.getTasksForSpecialist(user.id);

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

export const getSpecialistOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);

    if (user.role !== 'manager') {
      res.status(403).json({ message: 'Only managers can view specialist overview' });
      return;
    }

    const specialists = await tasksService.getSpecialistOverviewByManager(user.id);
    res.status(200).json(specialists);
  } catch (err) {
    next(err);
  }
};

export const acceptTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);

    if (user.role !== 'specialist') {
      res.status(403).json({ message: 'Only specialists can accept tasks' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'task id is required' });
      return;
    }

    const task = await tasksService.acceptTask(id, user.id);
    res.status(200).json(task);
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

export const tasksController = {
  createTask,
  getMyTasks,
  getSpecialistOverview,
  acceptTask,
  updateStatus,
};
