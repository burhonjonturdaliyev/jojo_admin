import { useT, type Lang } from "../lib/i18n";
import { cn } from "../lib/utils";

const langs: { code: Lang; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "uz_cyrl", label: "ЎЗ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useT();

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-line bg-bg-input p-0.5">
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-[11.5px] font-semibold tracking-wide transition-colors",
            lang === l.code
              ? "bg-brand text-white shadow-sm"
              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
