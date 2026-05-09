import { pool } from '../../config';
import * as translationService from '../translation/translation.service';
import { MessageRecord } from './messages.types';

interface TaskParties {
  manager_id: string;
  specialist_id: string | null;
}

interface MessageRowDb {
  id: string;
  task_id: string;
  sender_id: string;
  original_text: string;
  translated_text: string;
  created_at: Date;
}

const toRecord = (row: MessageRowDb): MessageRecord => ({
  id: row.id,
  task_id: row.task_id,
  sender_id: row.sender_id,
  original_text: row.original_text,
  translated_text: row.translated_text,
  created_at: row.created_at.toISOString(),
});

const loadTaskParties = async (taskId: string): Promise<TaskParties | null> => {
  const result = await pool.query<TaskParties>(
    `SELECT manager_id, specialist_id
     FROM tasks
     WHERE id = $1`,
    [taskId]
  );
  return result.rows[0] ?? null;
};

const assertTaskParticipant = (
  parties: TaskParties,
  requesterId: string
): void => {
  const allowed =
    requesterId === parties.manager_id || requesterId === parties.specialist_id;
  if (!allowed) {
    const err = new Error('Task not found or not authorized') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
};

export const listByTask = async (
  taskId: string,
  requesterId: string
): Promise<MessageRecord[]> => {
  const parties = await loadTaskParties(taskId);
  if (!parties) {
    const err = new Error('Task not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  assertTaskParticipant(parties, requesterId);

  const result = await pool.query<MessageRowDb>(
    `SELECT id, task_id, sender_id, original_text, translated_text, created_at
     FROM messages
     WHERE task_id = $1
     ORDER BY created_at ASC`,
    [taskId]
  );

  return result.rows.map(toRecord);
};

export const sendForTask = async (
  taskId: string,
  senderId: string,
  originalText: string
): Promise<MessageRecord> => {
  const trimmed = originalText.trim();
  if (!trimmed) {
    const err = new Error('original_text is required') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const parties = await loadTaskParties(taskId);
  if (!parties) {
    const err = new Error('Task not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  assertTaskParticipant(parties, senderId);

  if (!parties.specialist_id) {
    const err = new Error('Task has no specialist assigned') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const recipientId =
    senderId === parties.manager_id ? parties.specialist_id : parties.manager_id;

  const [senderLang, recipientLang] = await Promise.all([
    translationService.getPreferredLanguage(senderId),
    translationService.getPreferredLanguage(recipientId),
  ]);

  const translatedText = await translationService.translateText(
    trimmed,
    senderLang,
    recipientLang
  );

  const result = await pool.query<MessageRowDb>(
    `INSERT INTO messages (task_id, sender_id, original_text, translated_text)
     VALUES ($1, $2, $3, $4)
     RETURNING id, task_id, sender_id, original_text, translated_text, created_at`,
    [taskId, senderId, trimmed, translatedText]
  );

  return toRecord(result.rows[0]);
};

export const messagesService = {
  listByTask,
  sendForTask,
};
