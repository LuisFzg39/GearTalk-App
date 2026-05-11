const FLAGS: Record<string, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
  de: '🇩🇪',
  fr: '🇫🇷',
  pt: '🇵🇹',
  it: '🇮🇹',
  nl: '🇳🇱',
  pl: '🇵🇱',
  ru: '🇷🇺',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ko: '🇰🇷',
};

const labelFromIntl = (code: string, locale: string): string | null => {
  try {
    const display = new Intl.DisplayNames([locale], { type: 'language' });
    return display.of(code) ?? null;
  } catch {
    return null;
  }
};

export function formatLanguageDisplay(
  code: string | null | undefined,
  locale = 'en'
): { flag: string; label: string } {
  if (!code || !code.trim()) {
    return { flag: '', label: '—' };
  }
  const key = code.trim().toLowerCase().slice(0, 2);
  const label = labelFromIntl(key, locale) ?? code;
  const flag = FLAGS[key] ?? '🌐';
  return { flag, label };
}
