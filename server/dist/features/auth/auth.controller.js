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
exports.authController = exports.login = exports.register = void 0;
const authService = __importStar(require("./auth.service"));
const languages_1 = require("../../constants/languages");
const VALID_ROLES = ['manager', 'specialist'];
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, preferred_language } = req.body;
        if (!name || !email || !password || !role) {
            res.status(400).json({ message: 'name, email, password and role are required' });
            return;
        }
        if (!VALID_ROLES.includes(role)) {
            res.status(400).json({ message: 'role must be either manager or specialist' });
            return;
        }
        if (!preferred_language || typeof preferred_language !== 'string' || !(0, languages_1.isAllowedLanguage)(preferred_language)) {
            res.status(400).json({
                message: 'preferred_language is required and must be one of: en, zh, hi, es, fr, ar, bn, pt, ru, ja',
            });
            return;
        }
        const result = await authService.register({
            name,
            email,
            password,
            role,
            preferred_language,
        });
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'email and password are required' });
            return;
        }
        const result = await authService.login({ email, password });
        res.status(200).json(result);
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
exports.authController = { register: exports.register, login: exports.login };
