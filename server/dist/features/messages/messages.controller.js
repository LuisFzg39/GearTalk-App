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
exports.messagesController = exports.createForTask = exports.listForTask = void 0;
const messagesService = __importStar(require("./messages.service"));
const requireUser = (req) => {
    if (!req.user) {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
    }
    return req.user;
};
const listForTask = async (req, res, next) => {
    try {
        const user = requireUser(req);
        const { taskId } = req.params;
        if (!taskId) {
            res.status(400).json({ message: 'taskId is required' });
            return;
        }
        const messages = await messagesService.listByTask(taskId, user.id);
        res.status(200).json(messages);
    }
    catch (err) {
        next(err);
    }
};
exports.listForTask = listForTask;
const createForTask = async (req, res, next) => {
    try {
        const user = requireUser(req);
        const { taskId } = req.params;
        const { original_text } = req.body;
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
    }
    catch (err) {
        next(err);
    }
};
exports.createForTask = createForTask;
exports.messagesController = { listForTask: exports.listForTask, createForTask: exports.createForTask };
