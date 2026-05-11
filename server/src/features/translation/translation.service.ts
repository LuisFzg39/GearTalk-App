import { pool, DEEPL_API_KEY } from '../../config';
import { UI_STRINGS_EN } from '../../i18n/uiStrings';
import {
  isEnglishTargetPreference,
  toDeepLLang,
  toDeepLSourceLang,
  UI_SOURCE_LANG,
} from './deeplLanguages';
import https from 'https';

const DEEPL_TRANSLATE_URL =
  process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com/v2/translate';

const uiBundleCache = new Map<string, Record<string, string>>();
const uiBundleInFlight = new Map<string, Promise<Record<string, string>>>();
const textTranslationCache = new Map<string, string>();

export const normalizeLangCode = (code: string): string => {
  const trimmed = code.trim();
  if (!trimmed) return 'EN';
  return trimmed.length === 2 ? trimmed.toUpperCase() : trimmed;
};

/** Same signup language (ISO-2) — avoids useless EN→EN-US DeepL calls for chat. */
function sameNaturalLanguage(a: string, b: string): boolean {
  return normalizeLangCode(a).slice(0, 2) === normalizeLangCode(b).slice(0, 2);
}

const isAutoSource = (sourceLang: string): boolean =>
  sourceLang.trim().toLowerCase() === 'auto';

type DeepLHttpResponse = {
  ok: boolean;
  status: number;
  text: string;
};

let loggedTlsFallback = false;

const isCertificateChainError = (err: unknown): boolean => {
  const code = (err as { cause?: { code?: string }; code?: string })?.cause?.code ??
    (err as { code?: string })?.code;
  return (
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
    code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
    code === 'CERT_HAS_EXPIRED'
  );
};

const postDeepLWithFetch = async (payload: string): Promise<DeepLHttpResponse> => {
  const response = await fetch(DEEPL_TRANSLATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
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

const postDeepLWithRelaxedTls = (payload: string): Promise<DeepLHttpResponse> =>
  new Promise((resolve, reject) => {
    const url = new URL(DEEPL_TRANSLATE_URL);
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        agent: new https.Agent({ rejectUnauthorized: false }),
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => {
          resolve({
            ok: Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 300),
            status: response.statusCode ?? 0,
            text: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });

const postDeepL = async (body: Record<string, unknown>): Promise<DeepLHttpResponse> => {
  const payload = JSON.stringify(body);
  try {
    return await postDeepLWithFetch(payload);
  } catch (err) {
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
async function deepLTranslateJson(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
  if (texts.length === 0) return [];

  const src = isAutoSource(sourceLang)
    ? undefined
    : sourceLang === UI_SOURCE_LANG
      ? 'EN'
      : toDeepLSourceLang(sourceLang);
  const tgt = toDeepLLang(targetLang);

  if (src && src === tgt) {
    return [...texts];
  }

  const body: Record<string, unknown> = {
    text: texts,
    target_lang: tgt,
  };
  if (src) {
    body.source_lang = src;
  }

  const response = await postDeepL(body);

  if (!response.ok) {
    console.error('[DeepL]', response.status, response.text.slice(0, 500));
    const err = new Error(`DeepL translate failed: ${response.status}`) as Error & { status?: number };
    err.status = 502;
    throw err;
  }

  let data: { translations?: Array<{ text?: string }> };
  try {
    data = JSON.parse(response.text) as { translations?: Array<{ text?: string }> };
  } catch {
    const err = new Error('DeepL invalid JSON response') as Error & { status?: number };
    err.status = 502;
    throw err;
  }

  const arr = data.translations ?? [];
  if (arr.length !== texts.length) {
    console.error('[DeepL] translation count mismatch', arr.length, 'vs', texts.length);
    const err = new Error('DeepL batch length mismatch') as Error & { status?: number };
    err.status = 502;
    throw err;
  }

  return arr.map((item, i) => item.text ?? texts[i] ?? '');
}

export const getPreferredLanguage = async (userId: string): Promise<string> => {
  const result = await pool.query<{ preferred_language: string | null }>(
    `SELECT preferred_language FROM users WHERE id = $1`,
    [userId]
  );
  const raw = result.rows[0]?.preferred_language;
  return normalizeLangCode(raw ?? 'EN');
};

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  const trimmed = text.trim();
  if (!trimmed) return text;

  if (!isAutoSource(sourceLang) && sameNaturalLanguage(sourceLang, targetLang)) {
    return text;
  }

  const [out] = await deepLTranslateJson([trimmed], sourceLang, targetLang);
  return out ?? text;
};

const BATCH_SIZE = 1000;

const textCacheKey = (sourceLang: string, targetLang: string, text: string): string =>
  `${normalizeLangCode(sourceLang)}>${normalizeLangCode(targetLang)}:${text}`;

export const translateManyTexts = async (
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> => {
  if (texts.length === 0) return [];

  const out = new Array<string>(texts.length);
  const missing: Array<{ index: number; text: string; key: string }> = [];

  texts.forEach((text, index) => {
    const key = textCacheKey(sourceLang, targetLang, text);
    const cached = textTranslationCache.get(key);
    if (cached !== undefined) {
      out[index] = cached;
    } else {
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

export const translateUiBundle = async (targetLangRaw: string): Promise<Record<string, string>> => {
  if (isEnglishTargetPreference(targetLangRaw)) {
    return { ...UI_STRINGS_EN };
  }

  const cacheKey = normalizeLangCode(targetLangRaw);
  const cached = uiBundleCache.get(cacheKey);
  if (cached) {
    return { ...cached };
  }

  const inFlight = uiBundleInFlight.get(cacheKey);
  if (inFlight) {
    return { ...(await inFlight) };
  }

  const entries = Object.entries(UI_STRINGS_EN);
  const keys = entries.map(([k]) => k);
  const texts = entries.map(([, v]) => v);

  const promise = (async () => {
    const translatedChunks = await translateManyTexts(texts, UI_SOURCE_LANG, targetLangRaw);
    const result: Record<string, string> = {};
    keys.forEach((key, i) => {
      result[key] = translatedChunks[i] ?? UI_STRINGS_EN[key];
    });
    return result;
  })();

  uiBundleInFlight.set(cacheKey, promise);

  try {
    const result = await promise;
    uiBundleCache.set(cacheKey, result);
    return { ...result };
  } catch (e) {
    console.error('translateUiBundle: falling back to English', e);
    return { ...UI_STRINGS_EN };
  } finally {
    uiBundleInFlight.delete(cacheKey);
  }
};

export const translationService = {
  normalizeLangCode,
  getPreferredLanguage,
  translateText,
  translateManyTexts,
  translateUiBundle,
};
