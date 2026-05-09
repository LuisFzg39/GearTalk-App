import { NextFunction, Request, Response } from 'express';
import * as messagesService from './messages.service';
import { SendMessageBody } from './messages.types';

const requireUser = (req: Request) => {
  if (!req.user) {
    const error = new Error('Unauthorized') as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  return req.user;
};

export const listForTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { taskId } = req.params;
    if (!taskId) {
      res.status(400).json({ message: 'taskId is required' });
      return;
    }
    const messages = await messagesService.listByTask(taskId, user.id);
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
};

export const createForTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { taskId } = req.params;
    const { original_text } = req.body as Partial<SendMessageBody>;

    if (!taskId) {
      res.status(400).json({ message: 'taskId is required' });
      return;
    }
    if (original_text === undefined || typeof original_text !== 'string') {
      res.status(400).json({ message: 'original_text is required' });
      return;
    }

    const message = await messagesService.sendForTask(taskId, user.id, original_text);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

export const messagesController = { listForTask, createForTask };
