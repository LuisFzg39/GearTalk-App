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
exports.tasksController = exports.updateStatus = exports.acceptTask = exports.getSpecialistOverview = exports.getMyTasks = exports.createTask = void 0;
const tasksService = __importStar(require("./tasks.service"));
const VALID_STATUSES = ['pending', 'active', 'done'];
const requireUser = (req) => {
    if (!req.user) {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
    }
    return req.user;
};
const createTask = async (req, res, next) => {
    try {
        const user = requireUser(req);
        if (user.role !== 'manager') {
            res.status(403).json({ message: 'Only managers can create tasks' });
            return;
        }
        const { title, instruction_original } = req.body;
        const titleTrim = typeof title === 'string' ? title.trim() : '';
        const instructionTrim = typeof instruction_original === 'string' ? instruction_original.trim() : '';
        if (!titleTrim || !instructionTrim) {
            res.status(400).json({ message: 'title and instruction_original (description) are required' });
            return;
        }
        const task = await tasksService.createTask({ title: titleTrim, instruction_original: instructionTrim }, user.id);
        res.status(201).json(task);
    }
    catch (err) {
        next(err);
    }
};
exports.createTask = createTask;
const getMyTasks = async (req, res, next) => {
    try {
        const user = requireUser(req);
        const tasks = user.role === 'manager'
            ? await tasksService.getTasksByManager(user.id)
            : await tasksService.getTasksForSpecialist(user.id);
        res.status(200).json(tasks);
    }
    catch (err) {
        next(err);
    }
};
exports.getMyTasks = getMyTasks;
const getSpecialistOverview = async (req, res, next) => {
    try {
        const user = requireUser(req);
        if (user.role !== 'manager') {
            res.status(403).json({ message: 'Only managers can view specialist overview' });
            return;
        }
        const specialists = await tasksService.getSpecialistOverviewByManager(user.id);
        res.status(200).json(specialists);
    }
    catch (err) {
        next(err);
    }
};
exports.getSpecialistOverview = getSpecialistOverview;
const acceptTask = async (req, res, next) => {
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
    }
    catch (err) {
        next(err);
    }
};
exports.acceptTask = acceptTask;
const updateStatus = async (req, res, next) => {
    try {
        const user = requireUser(req);
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !VALID_STATUSES.includes(status)) {
            res
                .status(400)
                .json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
            return;
        }
        const updated = await tasksService.updateTaskStatus(id, status, user.id);
        res.status(200).json(updated);
    }
    catch (err) {
        next(err);
    }
};
exports.updateStatus = updateStatus;
exports.tasksController = {
    createTask: exports.createTask,
    getMyTasks: exports.getMyTasks,
    getSpecialistOverview: exports.getSpecialistOverview,
    acceptTask: exports.acceptTask,
    updateStatus: exports.updateStatus,
};
