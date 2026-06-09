import { useState } from "react";
import { Languages, Sparkles, Loader2 } from "lucide-react";
import { translateApi, type TranslateLang } from "../lib/resources";

/**
 * Ko'p tilli matn maydon — uz/ru/en tab'lar bilan.
 * "Auto" tugmasi tanlangan tildagi matnni qolgan ikkitasiga tarjima qiladi.
 *
 * Foydalanish:
 *   <MultilangInput
 *     value={{uz: name, ru: name_ru, en: name_en}}
 *     onChange={(v) => set({name: v.uz, name_ru: v.ru, name_en: v.en})}
 *     label="Nomi"
 *     multiline={false}
 *   />
 */

export type LangValue = Record<TranslateLang, string>;

interface Props {
  value: LangValue;
  onChange: (next: LangValue) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  className?: string;
}

const TABS: { code: TranslateLang; label: string; flag: string }[] = [
  { code: "uz", label: "O'z", flag: "🇺🇿" },
  { code: "ru", label: "Ру", flag: "🇷🇺" },
  { code: "en", label: "En", flag: "🇬🇧" },
];

export function MultilangInput({
  value,
  onChange,
  label,
  placeholder,
  multiline,
  rows = 3,
  required,
  className,
}: Props) {
  const [active, setActive] = useState<TranslateLang>("uz");
  const [busy, setBusy] = useState(false);

  const filled = (v: string) => v && v.trim().length > 0;

  const fillAll = async () => {
    const source = value[active]?.trim();
    if (!source) return;
    setBusy(true);
    try {
      const result = await translateApi.all(source, active);
      // Foydalanuvchi qo'lda yozgan qiymatlarni ustiga yozmaslik uchun
      // — faqat bo'sh maydonlarni to'ldiramiz.
      const next: LangValue = { ...value };
      (Object.keys(result.translations) as TranslateLang[]).forEach((k) => {
        if (k === active) return;
        if (!filled(next[k])) {
          next[k] = result.translations[k] || "";
        }
      });
      onChange(next);
    } catch (e) {
      console.error("translate", e);
    } finally {
      setBusy(false);
    }
  };

  const InputElement = multiline ? "textarea" : "input";

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[12px] font-medium text-text-secondary">
            <Languages className="inline h-3.5 w-3.5 mr-1 -mt-0.5 opacity-60" />
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </div>
          <button
            type="button"
            onClick={fillAll}
            disabled={busy || !filled(value[active])}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Auto
          </button>
        </div>
      )}
      <div className="flex gap-0.5 mb-1">
        {TABS.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setActive(t.code)}
            className={
              "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors " +
              (active === t.code
                ? "bg-primary text-white"
                : filled(value[t.code])
                ? "bg-bg-input text-text-secondary border border-line"
                : "bg-bg-input/50 text-text-muted border border-line border-dashed")
            }
          >
            <span className="mr-1">{t.flag}</span>
            {t.label}
            {filled(value[t.code]) && active !== t.code && (
              <span className="ml-1 inline-block w-1 h-1 rounded-full bg-status-resolved" />
            )}
          </button>
        ))}
      </div>
      <InputElement
        value={value[active] || ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange({ ...value, [active]: e.target.value })
        }
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
      />
    </div>
  );
}

/** Adapter — uchchala tildagi qiymatni Record sifatida ushlash uchun. */
export function buildLangValue(
  uz?: string | null,
  ru?: string | null,
  en?: string | null,
): LangValue {
  return { uz: uz || "", ru: ru || "", en: en || "" };
}
