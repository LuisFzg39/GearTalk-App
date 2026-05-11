import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { api } from './AxiosProvider';
import { UI_STRINGS_EN } from '../i18n/uiStrings.en';
import { BrandLogo } from '../components/shared/BrandLogo';

export interface I18nContextValue {
  t: (key: string) => string;
  lang: string;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const UI_BUNDLE_CACHE_PREFIX = 'geartalk_ui_bundle_v5_';

function resolveLangCode(user: User | null): string {
  const fromUser = user?.preferred_language?.trim();
  if (fromUser) return fromUser.slice(0, 2).toLowerCase();
  return 'en';
}

function readCachedBundle(lang: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(`${UI_BUNDLE_CACHE_PREFIX}${lang}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : null;
  } catch {
    return null;
  }
}

function writeCachedBundle(lang: string, strings: Record<string, string>): void {
  try {
    localStorage.setItem(`${UI_BUNDLE_CACHE_PREFIX}${lang}`, JSON.stringify(strings));
  } catch {
    /* Cache is an optimization only. */
  }
}

function initialI18nState(user: User | null): {
  lang: string;
  strings: Record<string, string>;
  ready: boolean;
} {
  const lang = resolveLangCode(user);
  if (!user || lang === 'en') {
    return { lang, strings: UI_STRINGS_EN, ready: true };
  }

  const cached = readCachedBundle(lang);
  return {
    lang,
    strings: cached ? { ...UI_STRINGS_EN, ...cached } : UI_STRINGS_EN,
    ready: Boolean(cached),
  };
}

const I18nBootScreen = () => (
  <div className="flex min-h-dvh items-center justify-center bg-geartalk-canvas px-4">
    <div className="rounded-3xl border border-slate-200/80 bg-white px-8 py-7 shadow-card">
      <BrandLogo variant="dark" />
    </div>
  </div>
);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const initial = initialI18nState(user);
  const [strings, setStrings] = useState<Record<string, string>>(initial.strings);
  const [ready, setReady] = useState(initial.ready);

  const lang = resolveLangCode(user);

  useEffect(() => {
    if (!user) {
      setStrings(UI_STRINGS_EN);
      setReady(true);
      return;
    }

    if (lang === 'en') {
      setStrings(UI_STRINGS_EN);
      setReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const cached = readCachedBundle(lang);
      if (cached && !cancelled) {
        setStrings({ ...UI_STRINGS_EN, ...cached });
        setReady(true);
      } else if (!cancelled) {
        setReady(false);
      }

      try {
        const { data } = await api.post<{ strings: Record<string, string> }>(
          '/api/translation/ui-bundle',
          { target_lang: lang }
        );
        if (!cancelled && data.strings) {
          writeCachedBundle(lang, data.strings);
          setStrings({ ...UI_STRINGS_EN, ...data.strings });
        }
      } catch {
        if (!cancelled && !cached) setStrings(UI_STRINGS_EN);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.preferred_language, lang]);

  const activeStrings = user ? strings : UI_STRINGS_EN;

  const t = useCallback(
    (key: string) => activeStrings[key] ?? UI_STRINGS_EN[key] ?? key,
    [activeStrings]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ t, lang, ready }),
    [t, lang, ready]
  );

  return (
    <I18nContext.Provider value={value}>
      {user && !ready ? <I18nBootScreen /> : children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
};
