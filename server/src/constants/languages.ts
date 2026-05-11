/** ISO 639-1 codes — ten widely spoken languages for registration & validation */
export const ALLOWED_LANGUAGE_CODES = [
  'en',
  'zh',
  'hi',
  'es',
  'fr',
  'ar',
  'bn',
  'pt',
  'ru',
  'ja',
] as const;

export type AllowedLanguageCode = (typeof ALLOWED_LANGUAGE_CODES)[number];

export function isAllowedLanguage(code: string): code is AllowedLanguageCode {
  return (ALLOWED_LANGUAGE_CODES as readonly string[]).includes(code);
}
