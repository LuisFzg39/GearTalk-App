import { pool, DEEPL_API_KEY } from '../../config';

const DEEPL_TRANSLATE_URL =
  process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com/v2/translate';

export const normalizeLangCode = (code: string): string => {
  const trimmed = code.trim();
  if (!trimmed) return 'EN';
  return trimmed.length === 2 ? trimmed.toUpperCase() : trimmed;
};

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
  const src = normalizeLangCode(sourceLang);
  const tgt = normalizeLangCode(targetLang);
  if (!text.trim() || src === tgt) {
    return text;
  }

  const params = new URLSearchParams();
  params.set('auth_key', DEEPL_API_KEY);
  params.set('text', text);
  params.set('source_lang', src);
  params.set('target_lang', tgt);

  const response = await fetch(DEEPL_TRANSLATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = new Error('Translation service error') as Error & { status?: number };
    err.status = 502;
    throw err;
  }

  const data = (await response.json()) as { translations?: Array<{ text?: string }> };
  const translated = data.translations?.[0]?.text;
  if (translated === undefined || translated === '') {
    const err = new Error('Invalid translation response') as Error & { status?: number };
    err.status = 502;
    throw err;
  }

  return translated;
};

export const translationService = {
  normalizeLangCode,
  getPreferredLanguage,
  translateText,
};
