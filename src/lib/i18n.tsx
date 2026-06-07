import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations } from "../locales";

export type Lang = "uz" | "ru" | "en";

const STORAGE_KEY = "jojo_admin_lang";
const DEFAULT_LANG: Lang = "uz";

type Vars = Record<string, string | number>;

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readStored(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "uz" || stored === "ru" || stored === "en"
    ? stored
    : DEFAULT_LANG;
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStored());

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    window.localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const table = translations[lang] ?? translations[DEFAULT_LANG];
      const fallback = translations[DEFAULT_LANG];
      const value = table[key] ?? fallback[key] ?? key;
      return interpolate(value, vars);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
