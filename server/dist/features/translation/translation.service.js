"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationService = exports.translateUiBundle = exports.translateManyTexts = exports.translateText = exports.getPreferredLanguage = exports.normalizeLangCode = void 0;
const config_1 = require("../../config");
const uiStrings_1 = require("../../i18n/uiStrings");
const deeplLanguages_1 = require("./deeplLanguages");
const https_1 = __importDefault(require("https"));
const DEEPL_TRANSLATE_URL = process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com/v2/translate';
const uiBundleCache = new Map();
const uiBundleInFlight = new Map();
const textTranslationCache = new Map();
const normalizeLangCode = (code) => {
    const trimmed = code.trim();
    if (!trimmed)
        return 'EN';
    return trimmed.length === 2 ? trimmed.toUpperCase() : trimmed;
};
exports.normalizeLangCode = normalizeLangCode;
/** Same signup language (ISO-2) — avoids useless EN→EN-US DeepL calls for chat. */
function sameNaturalLanguage(a, b) {
    return (0, exports.normalizeLangCode)(a).slice(0, 2) === (0, exports.normalizeLangCode)(b).slice(0, 2);
}
const isAutoSource = (sourceLang) => sourceLang.trim().toLowerCase() === 'auto';
let loggedTlsFallback = false;
const isCertificateChainError = (err) => {
    const code = err?.cause?.code ??
        err?.code;
    return (code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
        code === 'CERT_HAS_EXPIRED');
};
const postDeepLWithFetch = async (payload) => {
    const response = await fetch(DEEPL_TRANSLATE_URL, {
        method: 'POST',
        headers: {
            Authorization: `DeepL-Auth-Key ${config_1.DEEPL_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: payload,
    });
    return {
        ok: response.ok,
        status: response.status,
        text: await response.text(),
    };
};
const postDeepLWithRelaxedTls = (payload) => new Promise((resolve, reject) => {
    const url = new URL(DEEPL_TRANSLATE_URL);
    const request = https_1.default.request({
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        agent: new https_1.default.Agent({ rejectUnauthorized: false }),
        headers: {
            Authorization: `DeepL-Auth-Key ${config_1.DEEPL_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
        },
    }, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => {
            resolve({
                ok: Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 300),
                status: response.statusCode ?? 0,
                text: Buffer.concat(chunks).toString('utf8'),
            });
        });
    });
    request.on('error', reject);
    request.write(payload);
    request.end();
});
const postDeepL = async (body) => {
    const payload = JSON.stringify(body);
    try {
        return await postDeepLWithFetch(payload);
    }
    catch (err) {
        if (!isCertificateChainError(err)) {
            throw err;
        }
        if (!loggedTlsFallback) {
            console.warn('[DeepL] Node could not verify the TLS certificate chain; retrying DeepL with a scoped relaxed TLS agent.');
            loggedTlsFallback = true;
        }
        return postDeepLWithRelaxedTls(payload);
    }
};
/**
 * DeepL JSON API: Authorization header + JSON body (current DeepL docs).
 * UI strings use source_lang EN (generic English); user prefs map to target_lang (e.g. ZH-HANS, PT-BR).
 */
async function deepLTranslateJson(texts, sourceLang, targetLang) {
    if (texts.length === 0)
        return [];
    const src = isAutoSource(sourceLang)
        ? undefined
        : sourceLang === deeplLanguages_1.UI_SOURCE_LANG
            ? 'EN'
            : (0, deeplLanguages_1.toDeepLSourceLang)(sourceLang);
    const tgt = (0, deeplLanguages_1.toDeepLLang)(targetLang);
    if (src && src === tgt) {
        return [...texts];
    }
    const body = {
        text: texts,
        target_lang: tgt,
    };
    if (src) {
        body.source_lang = src;
    }
    const response = await postDeepL(body);
    if (!response.ok) {
        console.error('[DeepL]', response.status, response.text.slice(0, 500));
        const err = new Error(`DeepL translate failed: ${response.status}`);
        err.status = 502;
        throw err;
    }
    let data;
    try {
        data = JSON.parse(response.text);
    }
    catch {
        const err = new Error('DeepL invalid JSON response');
        err.status = 502;
        throw err;
    }
    const arr = data.translations ?? [];
    if (arr.length !== texts.length) {
        console.error('[DeepL] translation count mismatch', arr.length, 'vs', texts.length);
        const err = new Error('DeepL batch length mismatch');
        err.status = 502;
        throw err;
    }
    return arr.map((item, i) => item.text ?? texts[i] ?? '');
}
const getPreferredLanguage = async (userId) => {
    const result = await config_1.pool.query(`SELECT preferred_language FROM users WHERE id = $1`, [userId]);
    const raw = result.rows[0]?.preferred_language;
    return (0, exports.normalizeLangCode)(raw ?? 'EN');
};
exports.getPreferredLanguage = getPreferredLanguage;
const translateText = async (text, sourceLang, targetLang) => {
    const trimmed = text.trim();
    if (!trimmed)
        return text;
    if (!isAutoSource(sourceLang) && sameNaturalLanguage(sourceLang, targetLang)) {
        return text;
    }
    const [out] = await deepLTranslateJson([trimmed], sourceLang, targetLang);
    return out ?? text;
};
exports.translateText = translateText;
const BATCH_SIZE = 1000;
const textCacheKey = (sourceLang, targetLang, text) => `${(0, exports.normalizeLangCode)(sourceLang)}>${(0, exports.normalizeLangCode)(targetLang)}:${text}`;
const translateManyTexts = async (texts, sourceLang, targetLang) => {
    if (texts.length === 0)
        return [];
    const out = new Array(texts.length);
    const missing = [];
    texts.forEach((text, index) => {
        const key = textCacheKey(sourceLang, targetLang, text);
        const cached = textTranslationCache.get(key);
        if (cached !== undefined) {
            out[index] = cached;
        }
        else {
            missing.push({ index, text, key });
        }
    });
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const slice = missing.slice(i, i + BATCH_SIZE);
        const input = slice.map((item) => item.text);
        const batchOut = await deepLTranslateJson(input, sourceLang, targetLang);
        slice.forEach((item, j) => {
            const translated = batchOut[j] ?? item.text;
            textTranslationCache.set(item.key, translated);
            out[item.index] = translated;
        });
    }
    return out.map((value, index) => value ?? texts[index] ?? '');
};
exports.translateManyTexts = translateManyTexts;
const translateUiBundle = async (targetLangRaw) => {
    if ((0, deeplLanguages_1.isEnglishTargetPreference)(targetLangRaw)) {
        return { ...uiStrings_1.UI_STRINGS_EN };
    }
    const cacheKey = (0, exports.normalizeLangCode)(targetLangRaw);
    const cached = uiBundleCache.get(cacheKey);
    if (cached) {
        return { ...cached };
    }
    const inFlight = uiBundleInFlight.get(cacheKey);
    if (inFlight) {
        return { ...(await inFlight) };
    }
    const entries = Object.entries(uiStrings_1.UI_STRINGS_EN);
    const keys = entries.map(([k]) => k);
    const texts = entries.map(([, v]) => v);
    const promise = (async () => {
        const translatedChunks = await (0, exports.translateManyTexts)(texts, deeplLanguages_1.UI_SOURCE_LANG, targetLangRaw);
        const result = {};
        keys.forEach((key, i) => {
            result[key] = translatedChunks[i] ?? uiStrings_1.UI_STRINGS_EN[key];
        });
        return result;
    })();
    uiBundleInFlight.set(cacheKey, promise);
    try {
        const result = await promise;
        uiBundleCache.set(cacheKey, result);
        return { ...result };
    }
    catch (e) {
        console.error('translateUiBundle: falling back to English', e);
        return { ...uiStrings_1.UI_STRINGS_EN };
    }
    finally {
        uiBundleInFlight.delete(cacheKey);
    }
};
exports.translateUiBundle = translateUiBundle;
exports.translationService = {
    normalizeLangCode: exports.normalizeLangCode,
    getPreferredLanguage: exports.getPreferredLanguage,
    translateText: exports.translateText,
    translateManyTexts: exports.translateManyTexts,
    translateUiBundle: exports.translateUiBundle,
};
