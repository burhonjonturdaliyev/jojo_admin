import type { Lang } from "./i18n";

const CACHE_KEY = "jojo_admin_translate_cache_v2";
const ENDPOINT = "https://api.mymemory.translated.net/get";

/**
 * MyMemory's free endpoint rejects requests where the URL-encoded `q`
 * parameter exceeds ~500 bytes. Multibyte chars (Cyrillic, etc.) inflate
 * the byte count, so we keep the per-chunk byte ceiling well under the limit.
 */
const MAX_CHUNK_BYTES = 450;

/**
 * MyMemory is much more reliable with full IETF locale tags than with the
 * bare ISO-639 code. Uzbek in particular often returns "language pair not
 * supported" against just `uz`, but works against `uz-UZ`.
 */
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

  // Tokenise the source into atoms with their following separator. The
  // separator is whatever whitespace follows the atom (paragraph break,
  // sentence-ending space, plain space, newline) so we can recompose later.
  const atoms: { text: string; sep: string }[] = [];

  // First level: paragraphs. \n{2,} is a strong boundary.
  const paragraphs = text.split(/(\n{2,})/);
  for (let i = 0; i < paragraphs.length; i += 2) {
    const para = paragraphs[i];
    const sep = paragraphs[i + 1] ?? "";
    if (!para) continue;

    // Inside a paragraph: split by sentence terminator. Keep the terminator
    // attached to the left side.
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

  // Greedy pack atoms into chunks under MAX_CHUNK_BYTES. If a single atom is
  // still too large (one very long sentence), break it further by words.
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
      // Break this oversize atom by words.
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

async function callMyMemory(
  chunk: string,
  fromTag: string,
  toTag: string,
): Promise<string> {
  const url = `${ENDPOINT}?q=${encodeURIComponent(chunk)}&langpair=${fromTag}|${toTag}`;
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

  // MyMemory returns 200 with an error string in responseDetails when, e.g.,
  // the language pair is unsupported or the query is oversized.
  if (status >= 400 && data.responseDetails) {
    throw new TranslateError(`Tarjima xatosi: ${data.responseDetails}`);
  }

  const translated = data.responseData?.translatedText?.trim();
  if (!translated) {
    throw new TranslateError("Tarjima qaytarilmadi. Keyinroq urinib ko'ring.");
  }

  // MyMemory sometimes echoes the source back unchanged with match=0 when
  // it had no real hit for the requested pair. Treat that as a failure so
  // the bridge fallback can take over.
  if (
    data.responseData?.match === 0 &&
    translated.toLowerCase() === chunk.toLowerCase()
  ) {
    throw new TranslateError("Tarjima topilmadi.");
  }

  return translated;
}

/**
 * Translate one chunk with a bridge fallback. The `uz|ru` direction is the
 * weakest in MyMemory's free corpus — when the direct call fails or echoes
 * the source back, we route through `en` (uz → en → ru and vice versa).
 */
async function translateChunk(
  chunk: string,
  from: Lang,
  to: Lang,
): Promise<string> {
  try {
    return await callMyMemory(chunk, MM_LOCALE[from], MM_LOCALE[to]);
  } catch (directErr) {
    // Bridge through English if neither side is already English.
    if (from !== "en" && to !== "en") {
      try {
        const viaEn = await callMyMemory(chunk, MM_LOCALE[from], MM_LOCALE.en);
        return await callMyMemory(viaEn, MM_LOCALE.en, MM_LOCALE[to]);
      } catch {
        // Fall through to the original error so the user sees the real cause.
      }
    }
    throw directErr;
  }
}

/**
 * Translate a string. Cached in localStorage. Long inputs are split into
 * sub-500-byte chunks at sentence / paragraph boundaries, translated in
 * parallel, and rejoined with the original separators.
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

  // Translate each chunk (cache them too so re-edits only re-translate what
  // changed). Run in parallel for speed.
  const translated = await Promise.all(
    parts.map(async (chunk) => {
      const key = cacheKey(chunk, from, to);
      if (cache[key]) return cache[key];
      const result = await translateChunk(chunk, from, to);
      cache[key] = result;
      return result;
    }),
  );

  // Recompose with original separators (parts.length === seps.length + 1 or
  // matches; we tolerate both).
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
        // Surface as empty; the caller can re-try.
        out[lang] = "";
        throw e;
      }
    }),
  );
  return out as Record<Lang, string>;
}
