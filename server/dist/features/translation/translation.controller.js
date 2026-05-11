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
exports.translationController = exports.bundleUi = exports.translate = void 0;
const translationService = __importStar(require("./translation.service"));
const requireUser = (req) => {
    if (!req.user) {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
    }
    return req.user;
};
const translate = async (req, res, next) => {
    try {
        const user = requireUser(req);
        const { text, source_lang, target_lang } = req.body;
        if (!text || typeof text !== 'string') {
            res.status(400).json({ message: 'text is required' });
            return;
        }
        if (!target_lang || typeof target_lang !== 'string') {
            res.status(400).json({ message: 'target_lang is required' });
            return;
        }
        const sourceLang = source_lang && typeof source_lang === 'string'
            ? translationService.normalizeLangCode(source_lang)
            : await translationService.getPreferredLanguage(user.id);
        const targetLang = translationService.normalizeLangCode(target_lang);
        const translated = await translationService.translateText(text, sourceLang, targetLang);
        res.status(200).json({
            text: translated,
            source_lang: sourceLang,
            target_lang: targetLang,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.translate = translate;
const bundleUi = async (req, res, next) => {
    try {
        const raw = req.body?.target_lang;
        let targetLang;
        if (typeof raw === 'string' && raw.trim()) {
            targetLang = translationService.normalizeLangCode(raw);
        }
        else if (req.user) {
            targetLang = await translationService.getPreferredLanguage(req.user.id);
        }
        if (!targetLang) {
            res.status(400).json({ message: 'target_lang is required when not signed in' });
            return;
        }
        const strings = await translationService.translateUiBundle(targetLang);
        res.status(200).json({ target_lang: targetLang, strings });
    }
    catch (err) {
        next(err);
    }
};
exports.bundleUi = bundleUi;
exports.translationController = { translate: exports.translate, bundleUi: exports.bundleUi };
