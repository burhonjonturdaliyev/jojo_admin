import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { useT, type Lang } from "../lib/i18n";
import { translateText, TranslateError } from "../lib/translate";
import { LANG_ORDER, type Localized } from "../types/locale";
import { cn } from "../lib/utils";

interface FieldSpec {
  /** Current localized value. */
  value: Localized<string>;
  /** Setter to apply translations into this field. */
  onChange: (next: Localized<string>) => void;
}

interface ListFieldSpec {
  value: Localized<string[]>;
  onChange: (next: Localized<string[]>) => void;
}

interface Props {
  /** The locale to translate FROM. The fields' value[from] is the source text. */
  from: Lang;
  fields: FieldSpec[];
  listFields?: ListFieldSpec[];
  className?: string;
}

const LANG_NAME: Record<Lang, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

/**
 * Bulk-translate every supplied field from `from` into the other two locales.
 * Skips fields whose source text is empty.
 */
export function TranslateAllButton({
  from,
  fields,
  listFields = [],
  className,
}: Props) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<"ok" | "err" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const targets = LANG_ORDER.filter((l) => l !== from);

  const run = async () => {
    setBusy(true);
    setFlash(null);
    setMessage(null);
    try {
      // Translate string fields.
      await Promise.all(
        fields.map(async ({ value, onChange }) => {
          const source = value[from].trim();
          if (!source) return;
          const results = await Promise.all(
            targets.map((to) =>
              translateText(source, from, to).then((text) => ({ to, text })),
            ),
          );
          const next: Localized<string> = { ...value };
          results.forEach(({ to, text }) => {
            if (text) next[to] = text;
          });
          onChange(next);
        }),
      );

      // Translate list fields item-by-item.
      await Promise.all(
        listFields.map(async ({ value, onChange }) => {
          const source = value[from];
          if (!source.length) return;
          const perTarget = await Promise.all(
            targets.map(async (to) => {
              const items = await Promise.all(
                source.map((item) =>
                  item.trim()
                    ? translateText(item, from, to).catch(() => item)
                    : Promise.resolve(item),
                ),
              );
              return { to, items };
            }),
          );
          const next: Localized<string[]> = {
            ...value,
            [from]: source,
          };
          perTarget.forEach(({ to, items }) => {
            next[to] = items;
          });
          onChange(next);
        }),
      );

      setFlash("ok");
      setMessage(t("loc.translatedJust"));
    } catch (e) {
      setFlash("err");
      setMessage(
        e instanceof TranslateError ? e.message : t("loc.translateError"),
      );
    } finally {
      setBusy(false);
      window.setTimeout(() => {
        setFlash(null);
        setMessage(null);
      }, 2400);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        title={`${t("loc.translateAll")} (${LANG_NAME[from]} → ${targets.map((l) => l.toUpperCase()).join(", ")})`}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-gradient-to-br from-brand-soft to-transparent px-3 py-1.5 text-[12px] font-semibold text-brand shadow-sm transition-all",
          "hover:from-brand/15 hover:shadow-md hover:shadow-brand/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {busy ? t("loc.translating") : t("loc.translateAll")}
        <span className="ml-0.5 rounded-md bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
          {from} → {targets.join("·")}
        </span>
      </button>
      {message && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium",
            flash === "ok"
              ? "bg-status-resolved/15 text-status-resolved"
              : "bg-status-blocked/15 text-status-blocked",
          )}
        >
          {flash === "ok" && <Check className="h-3 w-3" />}
          {message}
        </span>
      )}
    </div>
  );
}
