import { translateApi, type TranslateLang } from "./resources";
import type { Lang } from "./i18n";

/**
 * Three-tier translation pipeline, ordered by output quality:
 *
 *  1. **Backend `/admin/translate/`** — the same endpoint Products and
 *     Categories pages use. The backend holds the paid API key (Google
 *     Cloud / DeepL / similar) and can apply server-side glossary +
 *     uz_cyrl transliteration. Highest quality. *Primary*.
 *  2. **Google public `gtx`** — unofficial free endpoint, decent quality,
 *     used as soon as the backend is unreachable / errors out.
 *  3. **MyMemory** — last-resort fallback, low quality. Used only when
 *     both Google paths fail; for uz↔ru it bridges through English.
 *
 * Before each call we mask brand names, URLs, emails, and {placeholder}
 * tokens so translation engines can't mangle them. Unmasking after the
 * response restores the originals byte-for-byte.
 *
 * Results are cached in localStorage so re-edits and re-translations
 * of the same string are free across the whole admin.
 */

// Cache bump (v4): backend-primary changes most outputs; old v3 entries
// would now mix lower-quality strings with the new professional ones.
const CACHE_KEY = "jojo_admin_translate_cache_v4";
const MAX_CHUNK_BYTES = 1200;

const GOOGLE_ENDPOINT =
  "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";

/** MyMemory needs full IETF tags for Uzbek; Google accepts the bare code.
 * uz_cyrl uchun haqiqiy tarjima emas — backend transliteratsiya qiladi.
 * Bu jadvallarda yo'q tilga so'rov ketsa, fallback `uz` ishlatadi. */
const GOOGLE_CODE: Record<Lang, string> = {
  uz: "uz",
  uz_cyrl: "uz",
  ru: "ru",
  en: "en",
};
const MM_LOCALE: Record<Lang, string> = {
  uz: "uz-UZ",
  uz_cyrl: "uz-UZ",
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

// ============================================================================
// Glossary / masking
// ============================================================================

// Tokens that must survive translation unchanged. Casing matters for brand
// names — we re-insert them exactly as they were. The list is ordered:
// longer phrases first so "JoJo Kids" doesn't get half-replaced when "JoJo"
// would also match.
const GLOSSARY: readonly string[] = [
  "JoJo Kids",
  "JoJo Parent",
  "Jojo Parent",
  "Jojo Kids",
  "Jojo Studio",
  "Jojolingo",
  "Jojobot",
  "JoJo",
  "Jojo",
];

const URL_RE = /\bhttps?:\/\/\S+/gi;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// `{name}` style placeholders used by the broadcast templating layer.
const PLACEHOLDER_RE = /\{[a-zA-Z_][\w.]*\}/g;

interface MaskResult {
  masked: string;
  tokens: string[];
}

/**
 * Replace each protected segment (brand name, URL, email, placeholder) with
 * an opaque marker that won't tempt any translator into rewording it. We use
 * zero-width-joined ASCII so the marker survives URL encoding cleanly.
 */
function maskProtected(text: string): MaskResult {
  const tokens: string[] = [];
  const stamp = (segment: string) => {
    tokens.push(segment);
    // Wrap in zero-width brackets so neither Google nor MyMemory tries to
    // interpret the index as a number to translate.
    return `⁣${tokens.length - 1}⁣`;
  };

  let out = text;
  for (const entry of GLOSSARY) {
    // Word-boundaryish — accept the brand surrounded by non-letter chars
    // (start/end of string, space, punctuation).
    const escaped = entry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^A-Za-z0-9])${escaped}(?=[^A-Za-z0-9]|$)`, "g");
    out = out.replace(re, (_match, before: string) => `${before}${stamp(entry)}`);
  }
  out = out.replace(URL_RE, (m) => stamp(m));
  out = out.replace(EMAIL_RE, (m) => stamp(m));
  out = out.replace(PLACEHOLDER_RE, (m) => stamp(m));
  return { masked: out, tokens };
}

const MARKER_RE = /⁣(\d+)⁣/g;

function unmask(text: string, tokens: string[]): string {
  if (tokens.length === 0) return text;
  return text.replace(MARKER_RE, (_match, idx: string) => {
    const i = Number.parseInt(idx, 10);
    return tokens[i] ?? "";
  });
}

// ============================================================================
// Backend translate (primary)
// ============================================================================

/**
 * Backend `/admin/translate/` with one source → one target. Used for chunked
 * single-language translations. Errors out via TranslateError so the chunk
 * loop falls through to Google.
 */
async function callBackendOne(
  chunk: string,
  from: Lang,
  to: Lang,
): Promise<string> {
  try {
    const result = await translateApi.one(
      chunk,
      from as TranslateLang,
      to as TranslateLang,
    );
    const out = result.text?.trim();
    if (!out) throw new TranslateError("Tarjima qaytarilmadi.");
    return out;
  } catch (err) {
    if (err instanceof TranslateError) throw err;
    throw new TranslateError(
      (err as { message?: string }).message ??
        "Backend tarjima xizmati javob bermadi.",
    );
  }
}

/**
 * Backend `/admin/translate/` with one source → ALL languages in a single
 * round-trip. Returns whatever subset the backend produced; the caller can
 * fall back to per-language calls for the missing ones.
 */
async function callBackendAll(
  chunk: string,
  from: Lang,
): Promise<Partial<Record<Lang, string>>> {
  try {
    const result = await translateApi.all(chunk, from as TranslateLang);
    const map = result.translations ?? {};
    const cleaned: Partial<Record<Lang, string>> = {};
    for (const k of Object.keys(map) as Lang[]) {
      const v = (map as Record<string, string>)[k]?.trim();
      if (v) cleaned[k] = v;
    }
    return cleaned;
  } catch (err) {
    if (err instanceof TranslateError) throw err;
    throw new TranslateError(
      (err as { message?: string }).message ??
        "Backend tarjima xizmati javob bermadi.",
    );
  }
}

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
 * Pipeline order:
 *  1. Backend `/admin/translate/` — paid translator with brand glossary.
 *  2. Google public `gtx` — decent free quality.
 *  3. MyMemory — last-resort, via English when the direct pair fails.
 *
 * Brand names, URLs, emails, and {placeholders} are masked before *every*
 * engine call and restored once a translation comes back.
 */
async function translateChunk(
  chunk: string,
  from: Lang,
  to: Lang,
): Promise<string> {
  const { masked, tokens } = maskProtected(chunk);

  // Primary: backend (professional engine, server-side glossary).
  try {
    const out = await callBackendOne(masked, from, to);
    return unmask(out, tokens);
  } catch {
    // Fall through to Google.
  }

  // Secondary: Google's public gtx endpoint.
  try {
    const out = await callGoogle(masked, GOOGLE_CODE[from], GOOGLE_CODE[to]);
    return unmask(out, tokens);
  } catch {
    // Fall through to MyMemory.
  }

  try {
    const out = await callMyMemory(masked, MM_LOCALE[from], MM_LOCALE[to]);
    return unmask(out, tokens);
  } catch (directErr) {
    if (from !== "en" && to !== "en") {
      try {
        const viaEn = await callMyMemory(masked, MM_LOCALE[from], MM_LOCALE.en);
        const out = await callMyMemory(viaEn, MM_LOCALE.en, MM_LOCALE[to]);
        return unmask(out, tokens);
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
 * Translate the same source text into many target languages.
 *
 * Strategy: ask the backend for **all** translations in a single round-trip
 * (`translateApi.all`). Short text → one HTTP call covers everything,
 * including uz_cyrl which the backend transliterates server-side. Any
 * targets the backend skipped fall back to per-language `translateText`
 * (which itself walks backend → Google → MyMemory).
 *
 * Cache is checked first so repeat calls cost nothing.
 */
export async function translateInto(
  text: string,
  from: Lang,
  targets: Lang[],
): Promise<Record<Lang, string>> {
  const trimmed = text.trim();
  const out: Record<string, string> = {};
  if (!trimmed) {
    for (const l of targets) out[l] = "";
    return out as Record<Lang, string>;
  }

  const cache = readCache();
  const remaining: Lang[] = [];
  for (const lang of targets) {
    if (lang === from) {
      out[lang] = text;
      continue;
    }
    const hit = cache[cacheKey(trimmed, from, lang)];
    if (hit) {
      out[lang] = hit;
      continue;
    }
    remaining.push(lang);
  }
  if (remaining.length === 0) return out as Record<Lang, string>;

  // Short input → backend can do all targets in one shot.
  if (byteLen(trimmed) <= MAX_CHUNK_BYTES) {
    const { masked, tokens } = maskProtected(trimmed);
    try {
      const all = await callBackendAll(masked, from);
      let mutated = false;
      for (const lang of remaining) {
        const translated = all[lang];
        if (translated) {
          const restored = unmask(translated, tokens);
          out[lang] = restored;
          cache[cacheKey(trimmed, from, lang)] = restored;
          mutated = true;
        }
      }
      if (mutated) writeCache(cache);
    } catch {
      // Backend round-trip failed entirely — leave `remaining` untouched
      // and fall through to per-language translateText calls below.
    }
  }

  // Anything backend didn't deliver, ask per language. Chunking, cache,
  // and the full fallback chain (Google/MyMemory) all live inside
  // translateText, so longer inputs are handled correctly here too.
  await Promise.all(
    remaining.map(async (lang) => {
      if (out[lang]) return;
      try {
        out[lang] = await translateText(trimmed, from, lang);
      } catch (e) {
        out[lang] = "";
        throw e;
      }
    }),
  );

  return out as Record<Lang, string>;
}
