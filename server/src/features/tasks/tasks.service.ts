import { pool } from '../../config';
import * as translationService from '../translation/translation.service';
import { CreateTaskRequest, Task, TaskStatus, TaskWithUsers } from './tasks.types';

export const createTask = async (
  data: CreateTaskRequest,
  managerId: string
): Promise<Task> => {
  const { instruction_original, specialist_id } = data;

  const [managerLang, specialistLang] = await Promise.all([
    translationService.getPreferredLanguage(managerId),
    translationService.getPreferredLanguage(specialist_id),
  ]);

  const instruction_translated = await translationService.translateText(
    instruction_original,
    managerLang,
    specialistLang
  );

  const result = await pool.query<{ task: Task }>(
    `INSERT INTO tasks (
       instruction_original,
       instruction_translated,
       status,
       manager_id,
       specialist_id
     )
     VALUES ($1, $2, 'pending', $3, $4)
     RETURNING json_build_object(
       'id', id,
       'instruction_original', instruction_original,
       'instruction_translated', instruction_translated,
       'status', status,
       'manager_id', manager_id,
       'specialist_id', specialist_id,
       'created_at', created_at
     ) AS task`,
    [instruction_original, instruction_translated, managerId, specialist_id]
  );

  return result.rows[0].task;
};

export const getTasksByManager = async (
  managerId: string
): Promise<TaskWithUsers[]> => {
  const result = await pool.query<{ task: TaskWithUsers }>(
    `SELECT json_build_object(
       'id', t.id,
       'instruction_original', t.instruction_original,
       'instruction_translated', t.instruction_translated,
       'status', t.status,
       'manager_id', t.manager_id,
       'specialist_id', t.specialist_id,
       'created_at', t.created_at,
       'manager_name', m.name,
       'specialist_name', s.name
     ) AS task
     FROM tasks t
     JOIN users m ON m.id = t.manager_id
     LEFT JOIN users s ON s.id = t.specialist_id
     WHERE t.manager_id = $1
     ORDER BY t.created_at DESC`,
    [managerId]
  );

  return result.rows.map((row) => row.task);
};

export const getTasksBySpecialist = async (specialistId: string): Promise<Task[]> => {
  const result = await pool.query<{ task: Task }>(
    `SELECT json_build_object(
       'id', id,
       'instruction_original', instruction_original,
       'instruction_translated', instruction_translated,
       'status', status,
       'manager_id', manager_id,
       'specialist_id', specialist_id,
       'created_at', created_at
     ) AS task
     FROM tasks
     WHERE specialist_id = $1
     ORDER BY created_at DESC`,
    [specialistId]
  );

  return result.rows.map((row) => row.task);
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  requesterId: string
): Promise<Task> => {
  const ownership = await pool.query<{ id: string }>(
    `SELECT id
     FROM tasks
     WHERE id = $1 AND (manager_id = $2 OR specialist_id = $2)`,
    [taskId, requesterId]
  );

  if (ownership.rowCount === 0) {
    const error = new Error('Task not found or not authorized') as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  const result = await pool.query<{ task: Task }>(
    `UPDATE tasks
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING json_build_object(
       'id', id,
       'instruction_original', instruction_original,
       'instruction_translated', instruction_translated,
       'status', status,
       'manager_id', manager_id,
       'specialist_id', specialist_id,
       'created_at', created_at
     ) AS task`,
    [status, taskId]
  );

  return result.rows[0].task;
};

export const tasksService = {
  createTask,
  getTasksByManager,
  getTasksBySpecialist,
  updateTaskStatus,
};
