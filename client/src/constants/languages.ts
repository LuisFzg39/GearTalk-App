/** Same codes as server `ALLOWED_LANGUAGE_CODES` — ten widely spoken languages */
export const REGISTRATION_LANGUAGES = [
  { code: 'en', label: 'English (Inglés)' },
  { code: 'zh', label: '中文 Mandarin' },
  { code: 'hi', label: 'हिन्दी Hindi' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français (Francés)' },
  { code: 'ar', label: 'العربية Árabe' },
  { code: 'bn', label: 'বাংলা Bengalí' },
  { code: 'pt', label: 'Português (Portugués)' },
  { code: 'ru', label: 'Русский Ruso' },
  { code: 'ja', label: '日本語 Japonés' },
] as const;

export type RegistrationLanguageCode = (typeof REGISTRATION_LANGUAGES)[number]['code'];
