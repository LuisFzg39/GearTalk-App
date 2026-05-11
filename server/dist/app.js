"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_router_1 = __importDefault(require("./features/auth/auth.router"));
const tasks_router_1 = __importDefault(require("./features/tasks/tasks.router"));
const translation_router_1 = __importDefault(require("./features/translation/translation.router"));
const messages_router_1 = __importDefault(require("./features/messages/messages.router"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({
    origin: config_1.CLIENT_URL,
    credentials: true,
}));
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
    res.json({ status: 'ok' });
});
app.use('/api/auth', auth_router_1.default);
app.use('/api/tasks', tasks_router_1.default);
app.use('/api/translation', translation_router_1.default);
app.use('/api/messages', messages_router_1.default);
app.use(error_middleware_1.errorMiddleware);
app.listen(config_1.PORT, () => {
    console.log(`Server listening on http://localhost:${config_1.PORT}`);
});
