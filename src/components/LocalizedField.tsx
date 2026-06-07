import { useState, useMemo } from "react";
import { Sparkles, Loader2, Check, AlertCircle, Copy } from "lucide-react";
import { useT, type Lang } from "../lib/i18n";
import { cn } from "../lib/utils";
import { translateText, TranslateError } from "../lib/translate";
import {
  LANG_ORDER,
  filledLocales,
  type Localized,
} from "../types/locale";

interface BaseProps {
  value: Localized<string>;
  onChange: (next: Localized<string>) => void;
  label?: React.ReactNode;
  placeholder?: string;
  /** Show the bulk "translate to others" button to the right of tabs. Default: true */
  showTranslate?: boolean;
  /** Optional extra class on the wrapper. */
  className?: string;
  /** Auto-focus the active locale's input when mounted. */
  autoFocus?: boolean;
}

interface InputProps extends BaseProps {
  as?: "input";
  type?: "text" | "url" | "tel";
  inputMode?: "text" | "url" | "tel";
}

interface TextareaProps extends BaseProps {
  as: "textarea";
  rows?: number;
}

type Props = InputProps | TextareaProps;

const LANG_NAME: Record<Lang, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

export function LocalizedField(props: Props) {
  const { value, onChange, label, placeholder, showTranslate = true, className } = props;
  const { t } = useT();
  const [active, setActive] = useState<Lang>("uz");
  const [busyTarget, setBusyTarget] = useState<Lang | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const filled = useMemo(() => filledLocales(value), [value]);
  const filledCount = (filled.uz ? 1 : 0) + (filled.ru ? 1 : 0) + (filled.en ? 1 : 0);

  const setLang = (lang: Lang, next: string) =>
    onChange({ ...value, [lang]: next });

  const translateToAllOthers = async () => {
    const source = value[active].trim();
    if (!source) {
      setError(t("loc.sourceEmpty"));
      window.setTimeout(() => setError(null), 2400);
      return;
    }
    setError(null);
    setBusyTarget("all");
    try {
      const targets = LANG_ORDER.filter((l) => l !== active);
      const results = await Promise.all(
        targets.map((to) =>
          translateText(source, active, to).then((text) => ({ to, text })),
        ),
      );
      const next: Localized<string> = { ...value };
      results.forEach(({ to, text }) => {
        if (text) next[to] = text;
      });
      onChange(next);
      setFlash(t("loc.translatedJust"));
      window.setTimeout(() => setFlash(null), 1800);
    } catch (e) {
      setError(e instanceof TranslateError ? e.message : t("loc.translateError"));
      window.setTimeout(() => setError(null), 3200);
    } finally {
      setBusyTarget(null);
    }
  };

  const translateOne = async (to: Lang) => {
    const source = value[active].trim();
    if (!source) {
      setError(t("loc.sourceEmpty"));
      window.setTimeout(() => setError(null), 2400);
      return;
    }
    setError(null);
    setBusyTarget(to);
    try {
      const text = await translateText(source, active, to);
      onChange({ ...value, [to]: text });
      setFlash(t("loc.translatedJust"));
      window.setTimeout(() => setFlash(null), 1500);
    } catch (e) {
      setError(e instanceof TranslateError ? e.message : t("loc.translateError"));
      window.setTimeout(() => setError(null), 3200);
    } finally {
      setBusyTarget(null);
    }
  };

  const copyFromActive = (to: Lang) =>
    onChange({ ...value, [to]: value[active] });

  return (
    <div className={cn("w-full", className)}>
      {label !== undefined && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="block text-[12px] font-medium text-text-secondary">
            {label}
          </label>
          <CompletenessBadge filled={filled} count={filledCount} />
        </div>
      )}

      <div className="rounded-lg border border-line bg-bg-input transition-colors focus-within:border-brand">
        {/* Tab bar */}
        <div className="flex items-center justify-between gap-2 border-b border-line px-1.5 py-1.5">
          <div className="flex items-center gap-0.5">
            {LANG_ORDER.map((l) => {
              const isActive = l === active;
              const isFilled = filled[l];
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setActive(l)}
                  title={
                    isFilled
                      ? `${LANG_NAME[l]} · ${value[l].slice(0, 60)}${value[l].length > 60 ? "…" : ""}`
                      : t("loc.fillTab", { lang: LANG_NAME[l] })
                  }
                  className={cn(
                    "group inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide transition-colors",
                    isActive
                      ? "bg-brand text-white shadow-sm"
                      : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                  )}
                >
                  {l}
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      isFilled
                        ? isActive
                          ? "bg-white"
                          : "bg-status-resolved"
                        : isActive
                          ? "bg-white/40"
                          : "bg-line/80",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            {showTranslate && (
              <button
                type="button"
                onClick={translateToAllOthers}
                disabled={busyTarget !== null}
                title={t("loc.translateToOthers")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border border-brand/40 bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand transition-all",
                  "hover:bg-brand/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {busyTarget === "all" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">
                  {busyTarget === "all"
                    ? t("loc.translating")
                    : t("loc.translateField")}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Per-locale fields */}
        <div className="relative">
          {LANG_ORDER.map((l) => {
            if (l !== active) return null;
            const placeholderText =
              placeholder ?? t("loc.fillTab", { lang: LANG_NAME[l] });
            if (props.as === "textarea") {
              return (
                <textarea
                  key={l}
                  rows={props.rows ?? 5}
                  autoFocus={props.autoFocus}
                  value={value[l]}
                  placeholder={placeholderText}
                  onChange={(e) => setLang(l, e.target.value)}
                  className="block w-full resize-y min-h-[120px] rounded-b-lg bg-transparent px-3.5 py-3 text-[13.5px] leading-relaxed text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              );
            }
            return (
              <input
                key={l}
                type={(props as InputProps).type ?? "text"}
                inputMode={(props as InputProps).inputMode}
                autoFocus={props.autoFocus}
                value={value[l]}
                placeholder={placeholderText}
                onChange={(e) => setLang(l, e.target.value)}
                className="block w-full rounded-b-lg bg-transparent px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            );
          })}
        </div>

        {/* Per-locale helper row for non-active locales — quick translate / copy */}
        <div className="flex flex-wrap items-center gap-1 border-t border-line px-1.5 py-1.5">
          {LANG_ORDER.filter((l) => l !== active).map((l) => {
            const empty = !filled[l];
            return (
              <div key={l} className="flex items-center gap-1">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    empty
                      ? "bg-status-progress/15 text-status-progress"
                      : "bg-status-resolved/15 text-status-resolved",
                  )}
                >
                  {l}
                </span>
                <button
                  type="button"
                  onClick={() => translateOne(l)}
                  disabled={busyTarget !== null}
                  title={t("loc.translateFrom", { lang: LANG_NAME[active] })}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-brand disabled:opacity-50"
                >
                  {busyTarget === l ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => copyFromActive(l)}
                  title={t("loc.copyFrom", { lang: LANG_NAME[active] })}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast row */}
      {(error || flash) && (
        <div
          className={cn(
            "mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium",
            error
              ? "bg-status-blocked/15 text-status-blocked"
              : "bg-status-resolved/15 text-status-resolved",
          )}
        >
          {error ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          {error ?? flash}
        </div>
      )}
    </div>
  );
}

function CompletenessBadge({
  filled,
  count,
}: {
  filled: Record<Lang, boolean>;
  count: number;
}) {
  const { t } = useT();
  const allFilled = count === 3;
  return (
    <span
      title={
        allFilled
          ? t("loc.allLanguages")
          : t("loc.completeness", { filled: count })
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
        allFilled
          ? "border-status-resolved/40 bg-status-resolved/10 text-status-resolved"
          : "border-status-progress/40 bg-status-progress/10 text-status-progress",
      )}
    >
      {LANG_ORDER.map((l) => (
        <span
          key={l}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            filled[l] ? "bg-current" : "bg-current/30",
          )}
        />
      ))}
      <span className="ml-0.5 tabular-nums">{count}/3</span>
    </span>
  );
}
