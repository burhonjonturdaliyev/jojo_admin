import type { Lang } from "./i18n";

/**
 * Two-tier translation pipeline:
 *  1. Google's free public endpoint (translate.googleapis.com `gtx` client) —
 *     wide character allowance, supports uz↔ru cleanly. Primary engine.
 *  2. MyMemory — kept as a fallback when Google is unreachable / blocked.
 *
 * Results are cached in localStorage so re-edits are free.
 */

const CACHE_KEY = "jojo_admin_translate_cache_v3";
const MAX_CHUNK_BYTES = 1200;

const GOOGLE_ENDPOINT =
  "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";

/** MyMemory needs full IETF tags for Uzbek; Google accepts the bare code. */
const GOOGLE_CODE: Record<Lang, string> = { uz: "uz", ru: "ru", en: "en" };
const MM_LOCALE: Record<Lang, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-GB",
};

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

const byteLen = (s: string) => new TextEncoder().encode(s).length;

/**
 * Split a long text into translation-friendly chunks of at most
 * MAX_CHUNK_BYTES bytes each, preferring sentence/paragraph boundaries.
 * Output preserves the exact separators between chunks so we can join the
 * translations back without losing structure.
 */
function chunkText(text: string): { parts: string[]; seps: string[] } {
  if (byteLen(text) <= MAX_CHUNK_BYTES) return { parts: [text], seps: [] };

  const atoms: { text: string; sep: string }[] = [];

  const paragraphs = text.split(/(\n{2,})/);
  for (let i = 0; i < paragraphs.length; i += 2) {
    const para = paragraphs[i];
    const sep = paragraphs[i + 1] ?? "";
    if (!para) continue;

    const sentences = para
      .split(/(?<=[.!?。！？…])\s+/)
      .filter((s) => s.length > 0);

    for (let s = 0; s < sentences.length; s++) {
      const isLast = s === sentences.length - 1;
      atoms.push({
        text: sentences[s],
        sep: isLast ? sep : " ",
      });
    }
  }

  const parts: string[] = [];
  const seps: string[] = [];
  let current = "";
  let currentSep = "";

  const flush = () => {
    if (current) {
      parts.push(current);
      seps.push(currentSep);
    }
    current = "";
    currentSep = "";
  };

  const pushAtom = (txt: string, sep: string) => {
    if (!txt) return;
    if (byteLen(txt) > MAX_CHUNK_BYTES) {
      const words = txt.split(/(\s+)/);
      let buf = "";
      for (const w of words) {
        if (byteLen(buf + w) > MAX_CHUNK_BYTES && buf) {
          pushAtom(buf, " ");
          buf = w.trimStart();
        } else {
          buf += w;
        }
      }
      if (buf) pushAtom(buf, sep);
      return;
    }

    if (current && byteLen(current + currentSep + txt) > MAX_CHUNK_BYTES) {
      flush();
    }
    if (current) current += currentSep;
    current += txt;
    currentSep = sep;
  };

  for (const a of atoms) pushAtom(a.text, a.sep);
  flush();

  return { parts, seps };
}

export class TranslateError extends Error {}

/**
 * Google Translate's public `gtx` client returns a deeply nested array.
 * Top-level shape: `[[ [translatedSegment, sourceSegment, ?, ?, ?], ... ], ...]`
 * Each top-level row in `data[0]` is one segment; concatenating them gives
 * the full translation.
 */
async function callGoogle(
  chunk: string,
  fromCode: string,
  toCode: string,
): Promise<string> {
  const url = `${GOOGLE_ENDPOINT}?client=gtx&sl=${fromCode}&tl=${toCode}&dt=t&q=${encodeURIComponent(chunk)}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new TranslateError(
      "Tarjima xizmati bilan bog'lana olmadi. Internet ulanishini tekshiring.",
    );
  }
  if (!response.ok) {
    throw new TranslateError(`Tarjima xatoligi: HTTP ${response.status}`);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new TranslateError("Tarjima javobini o'qib bo'lmadi.");
  }

  // Validate structure defensively — public endpoints can change.
  if (!Array.isArray(data) || !Array.isArray((data as unknown[])[0])) {
    throw new TranslateError("Tarjima formati noto'g'ri.");
  }

  const segments = (data as unknown[][])[0] as unknown[];
  const pieces: string[] = [];
  for (const segRaw of segments) {
    const seg = segRaw as unknown[];
    if (typeof seg?.[0] === "string") pieces.push(seg[0] as string);
  }
  const joined = pieces.join("").trim();
  if (!joined) {
    throw new TranslateError("Tarjima qaytarilmadi.");
  }
  return joined;
}

async function callMyMemory(
  chunk: string,
  fromTag: string,
  toTag: string,
): Promise<string> {
  const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(chunk)}&langpair=${fromTag}|${toTag}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new TranslateError(
      "Tarjima xizmati bilan bog'lana olmadi. Internet ulanishini tekshiring.",
    );
  }
  if (!response.ok) {
    throw new TranslateError(`Tarjima xatoligi: HTTP ${response.status}`);
  }

  let data: {
    responseStatus?: number | string;
    responseDetails?: string;
    responseData?: { translatedText?: string; match?: number };
  };
  try {
    data = await response.json();
  } catch {
    throw new TranslateError("Tarjima javobini o'qib bo'lmadi.");
  }

  const status =
    typeof data.responseStatus === "string"
      ? parseInt(data.responseStatus, 10) || 0
      : data.responseStatus ?? 0;

  if (status >= 400 && data.responseDetails) {
    throw new TranslateError(`Tarjima xatosi: ${data.responseDetails}`);
  }

  const translated = data.responseData?.translatedText?.trim();
  if (!translated) {
    throw new TranslateError("Tarjima qaytarilmadi.");
  }

  if (
    data.responseData?.match === 0 &&
    translated.toLowerCase() === chunk.toLowerCase()
  ) {
    throw new TranslateError("Tarjima topilmadi.");
  }

  return translated;
}

/**
 * Try Google first (high quality, generous limits, real uz↔ru support);
 * if it fails (network/CORS/quota), fall back to MyMemory. When the direct
 * MyMemory pair is unsupported we bridge through English.
 */
async function translateChunk(
  chunk: string,
  from: Lang,
  to: Lang,
): Promise<string> {
  // Primary: Google.
  try {
    return await callGoogle(chunk, GOOGLE_CODE[from], GOOGLE_CODE[to]);
  } catch {
    // Fallback to MyMemory.
  }

  try {
    return await callMyMemory(chunk, MM_LOCALE[from], MM_LOCALE[to]);
  } catch (directErr) {
    if (from !== "en" && to !== "en") {
      try {
        const viaEn = await callMyMemory(chunk, MM_LOCALE[from], MM_LOCALE.en);
        return await callMyMemory(viaEn, MM_LOCALE.en, MM_LOCALE[to]);
      } catch {
        // Surface the original direct error so it's the most informative.
      }
    }
    throw directErr;
  }
}

/**
 * Translate a string. Cached in localStorage. Long inputs are split into
 * chunks at sentence / paragraph boundaries, translated in parallel, and
 * rejoined with the original separators.
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
  const fullKey = cacheKey(trimmed, from, to);
  if (cache[fullKey]) return cache[fullKey];

  const { parts, seps } = chunkText(trimmed);

  const translated = await Promise.all(
    parts.map(async (chunk) => {
      const key = cacheKey(chunk, from, to);
      if (cache[key]) return cache[key];
      const result = await translateChunk(chunk, from, to);
      cache[key] = result;
      return result;
    }),
  );

  let joined = "";
  for (let i = 0; i < translated.length; i++) {
    joined += translated[i];
    if (i < translated.length - 1) joined += seps[i] ?? " ";
  }

  cache[fullKey] = joined;
  writeCache(cache);

  return joined;
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
        out[lang] = "";
        throw e;
      }
    }),
  );
  return out as Record<Lang, string>;
}
