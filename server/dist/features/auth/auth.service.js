"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
// `bcryptjs` is pure JavaScript, so it works reliably in Vercel serverless.
// Native `bcrypt` can ship the wrong platform binary and crash with `invalid ELF header`.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcryptjs');
const httpError = (message, status) => {
    const err = new Error(message);
    err.status = status;
    throw err;
};
const BCRYPT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';
const signToken = (payload) => {
    if (!config_1.JWT_SECRET) {
        httpError('Server is missing JWT_SECRET', 500);
    }
    return jsonwebtoken_1.default.sign(payload, config_1.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
const register = async (data) => {
    const { name, email, password, role, preferred_language } = data;
    const existing = await config_1.pool.query('SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS exists', [email]);
    if (existing.rows[0]?.exists) {
        httpError('Email already in use', 409);
    }
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const inserted = await config_1.pool.query(`INSERT INTO users (name, email, password_hash, role, preferred_language)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING json_build_object(
       'id', id,
       'name', name,
       'email', email,
       'role', role,
       'preferred_language', preferred_language
     ) AS user`, [name, email, password_hash, role, preferred_language]);
    const user = inserted.rows[0].user;
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return { token, user };
};
exports.register = register;
const login = async (data) => {
    const { email, password } = data;
    const result = await config_1.pool.query(`SELECT id, name, email, role, preferred_language, password_hash
     FROM users
     WHERE email = $1`, [email]);
    const row = result.rows[0];
    if (!row) {
        httpError('Invalid credentials', 401);
    }
    const matches = await bcrypt.compare(password, row.password_hash);
    if (!matches) {
        httpError('Invalid credentials', 401);
    }
    const user = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        preferred_language: row.preferred_language,
    };
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return { token, user };
};
exports.login = login;
exports.authService = { register: exports.register, login: exports.login };
