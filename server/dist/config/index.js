"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.CLIENT_URL = exports.DEEPL_API_KEY = exports.JWT_SECRET = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'DEEPL_API_KEY', 'CLIENT_URL'];
for (const key of requiredEnv) {
    const value = process.env[key];
    if (value === undefined || value === '') {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}
exports.PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
if (Number.isNaN(exports.PORT)) {
    throw new Error('PORT must be a valid number');
}
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.DEEPL_API_KEY = process.env.DEEPL_API_KEY;
exports.CLIENT_URL = process.env.CLIENT_URL;
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
