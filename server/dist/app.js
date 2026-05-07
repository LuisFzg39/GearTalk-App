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
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({
    origin: config_1.CLIENT_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// TODO Person 1: mount auth router here
// TODO Person 1: mount tasks router here
// TODO Person 2: mount messages router here
// TODO Person 2: mount translation router here
app.use(error_middleware_1.errorMiddleware);
app.listen(config_1.PORT, () => {
    console.log(`Server listening on http://localhost:${config_1.PORT}`);
});
