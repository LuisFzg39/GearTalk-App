"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksService = exports.updateTaskStatus = exports.getTasksForSpecialist = exports.getSpecialistOverviewByManager = exports.getTasksByManager = exports.acceptTask = exports.createTask = void 0;
const config_1 = require("../../config");
const translationService = __importStar(require("../translation/translation.service"));
const taskJsonSelect = `
       'id', id,
       'title', title,
       'instruction_original', instruction_original,
       'instruction_translated', instruction_translated,
       'status', CASE WHEN status IN ('accepted', 'alert') THEN 'active' ELSE status END,
       'manager_id', manager_id,
       'specialist_id', specialist_id,
       'created_at', created_at`;
const createTask = async (data, managerId) => {
    const { title, instruction_original } = data;
    const result = await config_1.pool.query(`INSERT INTO tasks (
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
     ) AS task`, [title.trim(), instruction_original.trim(), managerId]);
    return result.rows[0].task;
};
exports.createTask = createTask;
const acceptTask = async (taskId, specialistId) => {
    const client = await config_1.pool.connect();
    try {
        await client.query('BEGIN');
        const locked = await client.query(`SELECT id, manager_id, instruction_original, status, specialist_id
       FROM tasks
       WHERE id = $1
       FOR UPDATE`, [taskId]);
        const row = locked.rows[0];
        if (!row) {
            const err = new Error('Task not found');
            err.status = 404;
            throw err;
        }
        if (row.status !== 'pending' || row.specialist_id !== null) {
            const err = new Error('This task is no longer available to accept');
            err.status = 409;
            throw err;
        }
        // Plain text for now (no translation service on accept)
        const instruction_translated = row.instruction_original;
        const updated = await client.query(`UPDATE tasks
       SET specialist_id = $1,
           status = 'active',
           instruction_translated = $2,
           updated_at = NOW()
       WHERE id = $3 AND status = 'pending' AND specialist_id IS NULL
       RETURNING json_build_object(
         ${taskJsonSelect}
       ) AS task`, [specialistId, instruction_translated, taskId]);
        if (updated.rowCount === 0 || !updated.rows[0]) {
            const err = new Error('This task is no longer available to accept');
            err.status = 409;
            throw err;
        }
        await client.query('COMMIT');
        return updated.rows[0].task;
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
};
exports.acceptTask = acceptTask;
const getTasksByManager = async (managerId) => {
    const result = await config_1.pool.query(`SELECT json_build_object(
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
     ORDER BY t.created_at DESC`, [managerId]);
    return result.rows.map((row) => row.task);
};
exports.getTasksByManager = getTasksByManager;
const getSpecialistOverviewByManager = async (managerId) => {
    const result = await config_1.pool.query(`WITH ranked_active_tasks AS (
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
       u.name ASC`, [managerId]);
    return result.rows;
};
exports.getSpecialistOverviewByManager = getSpecialistOverviewByManager;
/** Pool (pending, unassigned) + tasks claimed by this specialist */
const getTasksForSpecialist = async (specialistId) => {
    const result = await config_1.pool.query(`SELECT
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
       t.created_at DESC`, [specialistId]);
    const specialistLanguage = await translationService.getPreferredLanguage(specialistId);
    const translated = await Promise.all(result.rows.map(async ({ task }) => {
        try {
            const [translatedTitle, translatedDescription] = await translationService.translateManyTexts([task.title, task.instruction_original], 'auto', specialistLanguage);
            return {
                ...task,
                title: translatedTitle ?? task.title,
                instruction_translated: translatedDescription ?? task.instruction_original,
            };
        }
        catch (err) {
            console.error('getTasksForSpecialist: task translation failed', err);
            return task;
        }
    }));
    return translated;
};
exports.getTasksForSpecialist = getTasksForSpecialist;
const updateTaskStatus = async (taskId, status, requesterId) => {
    if (status !== 'done') {
        const error = new Error('Only marking a task as done is supported');
        error.status = 400;
        throw error;
    }
    const ownership = await config_1.pool.query(`SELECT id
     FROM tasks
     WHERE id = $1 AND manager_id = $2 AND status IN ('active', 'accepted', 'alert')`, [taskId, requesterId]);
    if (ownership.rowCount === 0) {
        const error = new Error('Task not found or not authorized');
        error.status = 404;
        throw error;
    }
    const result = await config_1.pool.query(`UPDATE tasks
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING json_build_object(
       ${taskJsonSelect}
     ) AS task`, [status, taskId]);
    return result.rows[0].task;
};
exports.updateTaskStatus = updateTaskStatus;
exports.tasksService = {
    createTask: exports.createTask,
    acceptTask: exports.acceptTask,
    getTasksByManager: exports.getTasksByManager,
    getSpecialistOverviewByManager: exports.getSpecialistOverviewByManager,
    getTasksForSpecialist: exports.getTasksForSpecialist,
    updateTaskStatus: exports.updateTaskStatus,
};
