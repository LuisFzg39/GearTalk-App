/**
 * Map ISO-style registration codes (and legacy DB values) to DeepL API codes.
 * @see https://developers.deepl.com/docs/resources/supported-languages
 */
const REGISTRATION_TO_DEEPL: Record<string, string> = {
  en: 'EN-US',
  zh: 'ZH-HANS',
  hi: 'HI',
  es: 'ES',
  fr: 'FR',
  ar: 'AR',
  bn: 'BN',
  pt: 'PT-BR',
  ru: 'RU',
  ja: 'JA',
};

const REGISTRATION_TO_DEEPL_SOURCE: Record<string, string> = {
  en: 'EN',
  zh: 'ZH',
  hi: 'HI',
  es: 'ES',
  fr: 'FR',
  ar: 'AR',
  bn: 'BN',
  pt: 'PT',
  ru: 'RU',
  ja: 'JA',
};

/**
 * Marker for UI bundle source — {@link translation.service} maps this to DeepL `source_lang` **EN**
 * (generic English), not EN-US.
 */
export const UI_SOURCE_LANG = 'EN';

export function isEnglishTargetPreference(code: string): boolean {
  const t = code.trim().toLowerCase();
  return t === 'en' || t.startsWith('en-');
}

/**
 * Normalize stored preference or API input into a DeepL `target_lang` / chat `source_lang` value.
 */
export function toDeepLLang(code: string): string {
  const raw = code.trim();
  if (!raw) return 'EN-US';

  const lower = raw.toLowerCase();

  if (lower === 'zh-hans' || lower.startsWith('zh-hans')) return 'ZH-HANS';
  if (lower === 'zh-hant' || lower.startsWith('zh-hant')) return 'ZH-HANT';
  if (lower === 'pt-br' || lower.startsWith('pt-br')) return 'PT-BR';
  if (lower === 'pt-pt' || lower.startsWith('pt-pt')) return 'PT-PT';
  if (lower === 'en-us' || lower.startsWith('en-us')) return 'EN-US';
  if (lower === 'en-gb' || lower.startsWith('en-gb')) return 'EN-GB';

  const key = lower.slice(0, 2);
  if (REGISTRATION_TO_DEEPL[key]) {
    return REGISTRATION_TO_DEEPL[key];
  }

  return raw.toUpperCase();
}

/**
 * DeepL source language codes are not always the same as target codes:
 * English source is EN (not EN-US/EN-GB), Portuguese source is PT (not PT-BR/PT-PT),
 * and Chinese source is ZH (not ZH-HANS/ZH-HANT).
 */
export function toDeepLSourceLang(code: string): string {
  const raw = code.trim();
  if (!raw) return 'EN';

  const lower = raw.toLowerCase();
  const key = lower.slice(0, 2);

  if (REGISTRATION_TO_DEEPL_SOURCE[key]) {
    return REGISTRATION_TO_DEEPL_SOURCE[key];
  }

  return raw.toUpperCase();
}
