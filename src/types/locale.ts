import type { Lang } from "../lib/i18n";

export type Localized<T = string> = Record<Lang, T>;

// Tab order shown in admin forms — Latin avval, keyin Kirill, keyin chet tillar.
export const LANG_ORDER: Lang[] = ["uz", "uz_cyrl", "ru", "en"];

export function emptyLocalized(): Localized<string> {
  return { uz: "", uz_cyrl: "", ru: "", en: "" };
}

export function emptyLocalizedList(): Localized<string[]> {
  return { uz: [], uz_cyrl: [], ru: [], en: [] };
}

export function fromUz(value: string): Localized<string> {
  return { uz: value, uz_cyrl: value, ru: value, en: value };
}

export function isLocalizedString(v: unknown): v is Localized<string> {
  return (
    typeof v === "object" &&
    v !== null &&
    "uz" in v &&
    "ru" in v &&
    "en" in v &&
    typeof (v as Localized).uz === "string"
  );
}

export function isLocalizedList(v: unknown): v is Localized<string[]> {
  return (
    typeof v === "object" &&
    v !== null &&
    "uz" in v &&
    Array.isArray((v as Localized<string[]>).uz)
  );
}

/**
 * Read a string from a Localized<string> or plain string seed value.
 * Tanlangan tilda bo'sh bo'lsa, uz → uz_cyrl → ru → en tartibida fallback.
 */
export function pickLocalized(
  value: Localized<string> | string | undefined | null,
  lang: Lang,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return (
    value[lang] ||
    value.uz ||
    value.uz_cyrl ||
    value.ru ||
    value.en ||
    ""
  );
}

/**
 * Read a string[] from a Localized<string[]> or plain string[] seed.
 */
export function pickLocalizedList(
  value: Localized<string[]> | string[] | undefined | null,
  lang: Lang,
): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return (
    (value[lang]?.length && value[lang]) ||
    value.uz ||
    value.uz_cyrl ||
    value.ru ||
    value.en ||
    []
  );
}

/**
 * Promote a possibly-seed string to a full Localized<string>.
 * Used when loading legacy plain-string data into editable forms.
 */
export function toLocalized(
  value: Localized<string> | string | undefined | null,
): Localized<string> {
  if (value == null) return emptyLocalized();
  if (typeof value === "string") return fromUz(value);
  return {
    uz: value.uz ?? "",
    uz_cyrl: value.uz_cyrl ?? "",
    ru: value.ru ?? "",
    en: value.en ?? "",
  };
}

export function toLocalizedList(
  value: Localized<string[]> | string[] | undefined | null,
): Localized<string[]> {
  if (value == null) return emptyLocalizedList();
  if (Array.isArray(value))
    return { uz: value, uz_cyrl: value, ru: value, en: value };
  return {
    uz: value.uz ?? [],
    uz_cyrl: value.uz_cyrl ?? [],
    ru: value.ru ?? [],
    en: value.en ?? [],
  };
}

/**
 * Filled-state per locale, used by the LocalizedField status dots.
 */
export function filledLocales(value: Localized<string>): Record<Lang, boolean> {
  return {
    uz: value.uz.trim().length > 0,
    uz_cyrl: value.uz_cyrl.trim().length > 0,
    ru: value.ru.trim().length > 0,
    en: value.en.trim().length > 0,
  };
}
