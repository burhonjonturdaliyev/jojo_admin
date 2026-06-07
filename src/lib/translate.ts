import type { Lang } from "./i18n";

const CACHE_KEY = "jojo_admin_translate_cache";
const ENDPOINT = "https://api.mymemory.translated.net/get";

type Cache = Record<string, string>;

function readCache(): Cache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Cache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

function cacheKey(text: string, from: Lang, to: Lang) {
  return `${from}>${to}:${text}`;
}

export class TranslateError extends Error {}

/**
 * Translate a single string. Cached in localStorage.
 * Uses MyMemory's public endpoint — no API key, free for low volume.
 */
export async function translateText(
  text: string,
  from: Lang,
  to: Lang,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (from === to) return text;

  const cache = readCache();
  const key = cacheKey(trimmed, from, to);
  if (cache[key]) return cache[key];

  const url = `${ENDPOINT}?q=${encodeURIComponent(trimmed)}&langpair=${from}|${to}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new TranslateError(
      "Tarjima xizmati bilan bog'lana olmadi. Internet ulanishini tekshiring.",
    );
  }
  if (!response.ok) {
    throw new TranslateError(`Tarjima xatoligi: HTTP ${response.status}`);
  }

  let data: {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };
  try {
    data = await response.json();
  } catch {
    throw new TranslateError("Tarjima javobini o'qib bo'lmadi.");
  }

  const translated = data.responseData?.translatedText?.trim();
  if (!translated) {
    throw new TranslateError("Tarjima qaytarilmadi. Keyinroq urinib ko'ring.");
  }

  cache[key] = translated;
  writeCache(cache);

  return translated;
}

/**
 * Translate the same source text into many target languages in parallel.
 * Returns a map keyed by target language. Targets equal to `from` resolve
 * to the source text unchanged.
 */
export async function translateInto(
  text: string,
  from: Lang,
  targets: Lang[],
): Promise<Record<Lang, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    targets.map(async (lang) => {
      if (lang === from) {
        out[lang] = text;
        return;
      }
      try {
        out[lang] = await translateText(text, from, lang);
      } catch (e) {
        // Surface as empty; the caller can re-try.
        out[lang] = "";
        throw e;
      }
    }),
  );
  return out as Record<Lang, string>;
}
