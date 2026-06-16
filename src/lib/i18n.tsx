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

export type Lang = "uz" | "uz_cyrl" | "ru" | "en";

const STORAGE_KEY = "jojo_admin_lang";
const DEFAULT_LANG: Lang = "uz";

const SUPPORTED_LANGS: Lang[] = ["uz", "uz_cyrl", "ru", "en"];

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
  return SUPPORTED_LANGS.includes(stored as Lang)
    ? (stored as Lang)
    : DEFAULT_LANG;
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}

// O'zbek Lotin → Kirill transliteratsiyasi. Admin paneldagi tarjimalar
// faqat Lotin'da yozilgan, lekin foydalanuvchi "Ў3" (Kirill) tilini tanlasa
// matnlar avtomatik konvertatsiya qilinadi.
//
// Qoidalar:
//   1. Digraphlar (ch, sh, ng, yo, yu, ya, ts, o', g') birinchi
//   2. So'z boshida "e" → "э", boshqa joyda → "е"
//   3. So'z boshida "ye" → "е" (alohida kelmasligi uchun)
//   4. Bosh harf — "Sh" → "Ш", "SH" → "Ш"
//
// "{var}" placeholder'lar transliteratsiyadan tashqarida qoladi.
const LATIN_TO_CYRILLIC_PAIRS: Array<[string, string]> = [
  ["o'", "ў"], ["O'", "Ў"],
  ["g'", "ғ"], ["G'", "Ғ"],
  ["ch", "ч"], ["Ch", "Ч"], ["CH", "Ч"],
  ["sh", "ш"], ["Sh", "Ш"], ["SH", "Ш"],
  ["yo", "ё"], ["Yo", "Ё"], ["YO", "Ё"],
  ["yu", "ю"], ["Yu", "Ю"], ["YU", "Ю"],
  ["ya", "я"], ["Ya", "Я"], ["YA", "Я"],
  // "ye" — so'z boshida ham, ichida ham → "е" (Етказилди, кейинги).
  ["ye", "е"], ["Ye", "Е"], ["YE", "Е"],
  ["ts", "ц"], ["Ts", "Ц"], ["TS", "Ц"],
  ["ng", "нг"], ["Ng", "Нг"], ["NG", "НГ"],
];

const SINGLE_LATIN_TO_CYRILLIC: Record<string, string> = {
  a: "а", b: "б", d: "д", f: "ф", g: "г", h: "ҳ", i: "и",
  j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п",
  q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х",
  y: "й", z: "з",
  A: "А", B: "Б", D: "Д", F: "Ф", G: "Г", H: "Ҳ", I: "И",
  J: "Ж", K: "К", L: "Л", M: "М", N: "Н", O: "О", P: "П",
  Q: "Қ", R: "Р", S: "С", T: "Т", U: "У", V: "В", X: "Х",
  Y: "Й", Z: "З",
  "'": "ъ",
};

function transliterateToken(token: string): string {
  let out = token;
  for (const [from, to] of LATIN_TO_CYRILLIC_PAIRS) {
    out = out.split(from).join(to);
  }
  let result = "";
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    if (ch === "e" || ch === "E") {
      // So'z boshida → э / Э, ichida → е / Е
      const isStart =
        i === 0 || !/[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ]/.test(out[i - 1]);
      if (isStart) {
        result += ch === "E" ? "Э" : "э";
      } else {
        result += ch === "E" ? "Е" : "е";
      }
      continue;
    }
    if (ch === "c" || ch === "C") {
      // 'c' alohida tovush emas — odatda 's' ga yaqin (loanword'larda)
      result += ch === "C" ? "С" : "с";
      continue;
    }
    if (ch === "w" || ch === "W") {
      // O'zbek alifbosida yo'q — qoldiramiz
      result += ch;
      continue;
    }
    result += SINGLE_LATIN_TO_CYRILLIC[ch] ?? ch;
  }
  return result;
}

export function latinToCyrillic(text: string): string {
  if (!text) return text;
  // {var} placeholder'larni saqlaymiz — interpolate'dan oldin yoki keyin
  // bir xil ishlasin. Shu yerda interpolate'dan keyin chaqirilayotgan
  // bo'lsa placeholder allaqachon o'rnatilgan; baribir HTML/var sintaksisini
  // buzmaslik uchun {…} bloklarini transliterate qilmaymiz.
  const parts = text.split(/(\{\w+\})/g);
  return parts
    .map((p) => (p.startsWith("{") && p.endsWith("}") ? p : transliterateToken(p)))
    .join("");
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
      const interpolated = interpolate(value, vars);
      // uz_cyrl jadvali Lotin matnlarni saqlaydi — ko'rsatishda Kirillga
      // konvertatsiya qilamiz. Ruscha/inglizcha jadvallar to'g'ridan-to'g'ri
      // o'z alifbosida qaytadi.
      if (lang === "uz_cyrl") return latinToCyrillic(interpolated);
      return interpolated;
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
