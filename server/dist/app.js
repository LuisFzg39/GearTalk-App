"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_router_1 = __importDefault(require("./features/auth/auth.router"));
const tasks_router_1 = __importDefault(require("./features/tasks/tasks.router"));
const translation_router_1 = __importDefault(require("./features/translation/translation.router"));
const messages_router_1 = __importDefault(require("./features/messages/messages.router"));
const app = (0, express_1.default)();
exports.app = app;
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', req.headers['access-control-request-method'] ?? 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Vary', 'Access-Control-Request-Headers, Access-Control-Request-Method');
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    next();
});
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.json({
        name: 'GearTalk API',
        health: '/api/health',
        routes: {
            auth: '/api/auth',
            tasks: '/api/tasks',
            translation: '/api/translation',
            messages: '/api/messages',
        },
        client: config_1.CLIENT_URL,
    });
});
app.get('/api/health', (_req, res) => {
    res.json({
        status: config_1.missingEnv.length === 0 ? 'ok' : 'misconfigured',
        missingEnv: config_1.missingEnv,
    });
});
app.use('/api/auth', auth_router_1.default);
app.use('/api/tasks', tasks_router_1.default);
app.use('/api/translation', translation_router_1.default);
app.use('/api/messages', messages_router_1.default);
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
