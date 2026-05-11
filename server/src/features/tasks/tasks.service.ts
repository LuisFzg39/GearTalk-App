import { pool } from '../../config';
import {
  CreateTaskRequest,
  ManagerSpecialistOverview,
  Task,
  TaskStatus,
  TaskWithUsers,
} from './tasks.types';
import * as translationService from '../translation/translation.service';

const taskJsonSelect = `
       'id', id,
       'title', title,
       'instruction_original', instruction_original,
       'instruction_translated', instruction_translated,
       'status', CASE WHEN status IN ('accepted', 'alert') THEN 'active' ELSE status END,
       'manager_id', manager_id,
       'specialist_id', specialist_id,
       'created_at', created_at`;

export const createTask = async (data: CreateTaskRequest, managerId: string): Promise<Task> => {
  const { title, instruction_original } = data;

  const result = await pool.query<{ task: Task }>(
    `INSERT INTO tasks (
       title,
       instruction_original,
       instruction_translated,
       status,
       manager_id,
       specialist_id
     )
     VALUES ($1, $2, NULL, 'pending', $3, NULL)
     RETURNING json_build_object(
       ${taskJsonSelect}
     ) AS task`,
    [title.trim(), instruction_original.trim(), managerId]
  );

  return result.rows[0].task;
};

export const acceptTask = async (taskId: string, specialistId: string): Promise<Task> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const locked = await client.query<{
      id: string;
      manager_id: string;
      instruction_original: string;
      status: string;
      specialist_id: string | null;
    }>(
      `SELECT id, manager_id, instruction_original, status, specialist_id
       FROM tasks
       WHERE id = $1
       FOR UPDATE`,
      [taskId]
    );

    const row = locked.rows[0];
    if (!row) {
      const err = new Error('Task not found') as Error & { status?: number };
      err.status = 404;
      throw err;
    }

    if (row.status !== 'pending' || row.specialist_id !== null) {
      const err = new Error('This task is no longer available to accept') as Error & { status?: number };
      err.status = 409;
      throw err;
    }

    // Plain text for now (no translation service on accept)
    const instruction_translated = row.instruction_original;

    const updated = await client.query<{ task: Task }>(
      `UPDATE tasks
       SET specialist_id = $1,
           status = 'active',
           instruction_translated = $2,
           updated_at = NOW()
       WHERE id = $3 AND status = 'pending' AND specialist_id IS NULL
       RETURNING json_build_object(
         ${taskJsonSelect}
       ) AS task`,
      [specialistId, instruction_translated, taskId]
    );

    if (updated.rowCount === 0 || !updated.rows[0]) {
      const err = new Error('This task is no longer available to accept') as Error & { status?: number };
      err.status = 409;
      throw err;
    }

    await client.query('COMMIT');

    return updated.rows[0].task;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export const getTasksByManager = async (managerId: string): Promise<TaskWithUsers[]> => {
  const result = await pool.query<{ task: TaskWithUsers }>(
    `SELECT json_build_object(
       'id', t.id,
       'title', t.title,
       'instruction_original', t.instruction_original,
       'instruction_translated', t.instruction_translated,
       'status', CASE WHEN t.status IN ('accepted', 'alert') THEN 'active' ELSE t.status END,
       'manager_id', t.manager_id,
       'specialist_id', t.specialist_id,
       'created_at', t.created_at,
       'manager_name', m.name,
       'specialist_name', s.name,
       'specialist_language', s.preferred_language
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

export const getSpecialistOverviewByManager = async (
  managerId: string
): Promise<ManagerSpecialistOverview[]> => {
  const result = await pool.query<ManagerSpecialistOverview>(
    `WITH ranked_active_tasks AS (
       SELECT
         t.id,
         t.title,
         t.instruction_original,
         t.specialist_id,
         ROW_NUMBER() OVER (PARTITION BY t.specialist_id ORDER BY t.created_at DESC) AS rn
       FROM tasks t
       WHERE t.manager_id = $1
         AND t.status IN ('active', 'accepted', 'alert')
         AND t.specialist_id IS NOT NULL
     )
     SELECT
       u.id AS specialist_id,
       u.name,
       u.preferred_language AS language,
       CASE WHEN rat.id IS NULL THEN 'available' ELSE 'active' END AS status,
       rat.id AS task_id,
       rat.title AS task_title,
       rat.instruction_original AS task_description
     FROM users u
     LEFT JOIN ranked_active_tasks rat
       ON rat.specialist_id = u.id AND rat.rn = 1
     WHERE u.role = 'specialist'
     ORDER BY
       CASE WHEN rat.id IS NULL THEN 1 ELSE 0 END,
       u.name ASC`,
    [managerId]
  );

  return result.rows;
};

/** Pool (pending, unassigned) + tasks claimed by this specialist */
export const getTasksForSpecialist = async (specialistId: string): Promise<Task[]> => {
  const result = await pool.query<{ task: Task }>(
    `SELECT
       json_build_object(
         'id', t.id,
         'title', t.title,
         'instruction_original', t.instruction_original,
         'instruction_translated', t.instruction_translated,
         'status', CASE WHEN t.status IN ('accepted', 'alert') THEN 'active' ELSE t.status END,
         'manager_id', t.manager_id,
         'specialist_id', t.specialist_id,
         'created_at', t.created_at
       ) AS task
     FROM tasks t
     WHERE (t.status = 'pending' AND t.specialist_id IS NULL)
        OR (t.specialist_id = $1)
     ORDER BY
       CASE WHEN t.status = 'pending' AND t.specialist_id IS NULL THEN 0 ELSE 1 END,
       t.created_at DESC`,
    [specialistId]
  );

  const specialistLanguage = await translationService.getPreferredLanguage(specialistId);
  const translated = await Promise.all(
    result.rows.map(async ({ task }) => {
      try {
        const [translatedTitle, translatedDescription] =
          await translationService.translateManyTexts(
            [task.title, task.instruction_original],
            'auto',
            specialistLanguage
          );

        return {
          ...task,
          title: translatedTitle ?? task.title,
          instruction_translated: translatedDescription ?? task.instruction_original,
        };
      } catch (err) {
        console.error('getTasksForSpecialist: task translation failed', err);
        return task;
      }
    })
  );

  return translated;
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  requesterId: string
): Promise<Task> => {
  if (status !== 'done') {
    const error = new Error('Only marking a task as done is supported') as Error & { status?: number };
    error.status = 400;
    throw error;
  }

  const ownership = await pool.query<{ id: string }>(
    `SELECT id
     FROM tasks
     WHERE id = $1 AND manager_id = $2 AND status IN ('active', 'accepted', 'alert')`,
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
       ${taskJsonSelect}
     ) AS task`,
    [status, taskId]
  );

  return result.rows[0].task;
};

export const tasksService = {
  createTask,
  acceptTask,
  getTasksByManager,
  getSpecialistOverviewByManager,
  getTasksForSpecialist,
  updateTaskStatus,
};
