"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.CLIENT_URL = exports.DEEPL_API_KEY = exports.JWT_SECRET = exports.PORT = exports.missingEnv = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'DEEPL_API_KEY', 'CLIENT_URL'];
exports.missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (exports.missingEnv.length > 0) {
    console.error(`Missing required environment variables: ${exports.missingEnv.join(', ')}`);
}
exports.PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
if (Number.isNaN(exports.PORT)) {
    throw new Error('PORT must be a valid number');
}
exports.JWT_SECRET = process.env.JWT_SECRET ?? '';
exports.DEEPL_API_KEY = process.env.DEEPL_API_KEY ?? '';
exports.CLIENT_URL = process.env.CLIENT_URL ?? '';
function createPoolConfig(connectionString) {
    const needsSsl = /supabase\.co/i.test(connectionString) || /sslmode=require/i.test(connectionString);
    return {
        connectionString,
        ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
}
function createMissingDatabasePool() {
    const error = () => {
        const err = new Error('Missing required environment variable: DATABASE_URL');
        err.status = 500;
        throw err;
    };
    return {
        query: error,
        connect: error,
    };
}
exports.pool = process.env.DATABASE_URL
    ? new pg_1.Pool(createPoolConfig(process.env.DATABASE_URL))
    : createMissingDatabasePool();
