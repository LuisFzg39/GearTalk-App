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
exports.messagesService = exports.sendForTask = exports.listByTask = void 0;
const config_1 = require("../../config");
const translationService = __importStar(require("../translation/translation.service"));
const toRecord = (row) => ({
    id: row.id,
    task_id: row.task_id,
    sender_id: row.sender_id,
    original_text: row.original_text,
    translated_text: row.translated_text,
    created_at: row.created_at.toISOString(),
});
const loadTaskParties = async (taskId) => {
    const result = await config_1.pool.query(`SELECT manager_id, specialist_id
     FROM tasks
     WHERE id = $1`, [taskId]);
    return result.rows[0] ?? null;
};
const assertTaskParticipant = (parties, requesterId) => {
    const allowed = requesterId === parties.manager_id || requesterId === parties.specialist_id;
    if (!allowed) {
        const err = new Error('Task not found or not authorized');
        err.status = 404;
        throw err;
    }
};
const listByTask = async (taskId, requesterId) => {
    const parties = await loadTaskParties(taskId);
    if (!parties) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    assertTaskParticipant(parties, requesterId);
    const result = await config_1.pool.query(`SELECT id, task_id, sender_id, original_text, translated_text, created_at
     FROM messages
     WHERE task_id = $1
     ORDER BY created_at ASC`, [taskId]);
    return result.rows.map(toRecord);
};
exports.listByTask = listByTask;
const sendForTask = async (taskId, senderId, originalText) => {
    const trimmed = originalText.trim();
    if (!trimmed) {
        const err = new Error('original_text is required');
        err.status = 400;
        throw err;
    }
    const parties = await loadTaskParties(taskId);
    if (!parties) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    assertTaskParticipant(parties, senderId);
    if (!parties.specialist_id) {
        const err = new Error('Task has no specialist assigned');
        err.status = 400;
        throw err;
    }
    const recipientId = senderId === parties.manager_id ? parties.specialist_id : parties.manager_id;
    const senderLang = await translationService.getPreferredLanguage(senderId);
    const recipientLang = await translationService.getPreferredLanguage(recipientId);
    let translatedForRecipient = trimmed;
    try {
        translatedForRecipient = await translationService.translateText(trimmed, senderLang, recipientLang);
    }
    catch {
        translatedForRecipient = trimmed;
    }
    const result = await config_1.pool.query(`INSERT INTO messages (task_id, sender_id, original_text, translated_text)
     VALUES ($1, $2, $3, $4)
     RETURNING id, task_id, sender_id, original_text, translated_text, created_at`, [taskId, senderId, trimmed, translatedForRecipient]);
    return toRecord(result.rows[0]);
};
exports.sendForTask = sendForTask;
exports.messagesService = {
    listByTask: exports.listByTask,
    sendForTask: exports.sendForTask,
};
