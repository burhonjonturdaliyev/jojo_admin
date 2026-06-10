import { useEffect, useRef, useState } from "react";
import { Tag, X, Plus, Loader2 } from "lucide-react";
import { productTagsApi, unwrapList, type AdminProductTag } from "../lib/resources";
import type { UiProductTag } from "../lib/adapters";

interface Props {
  value: UiProductTag[];
  onChange: (next: UiProductTag[]) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Tag chip input.
 * — Enter / vergul (,) bilan yangi tag qo'shiladi.
 * — Yozayotganda bazadan autocomplete suggestion'lari ko'rsatiladi.
 * — Yangi tag yaratilsa backend uni avtomatik ru/en'ga tarjima qilib saqlaydi.
 */
export function TagsInput({ value, onChange, label, placeholder }: Props) {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<AdminProductTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!focused) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const raw = await productTagsApi.list({ q: draft.trim() || undefined });
        setSuggestions(unwrapList(raw).slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft, focused]);

  const exists = (name: string) =>
    value.some((t) => t.name.toLowerCase() === name.toLowerCase());

  const add = (raw: string | AdminProductTag) => {
    const incoming: UiProductTag =
      typeof raw === "string"
        ? { name: raw.replace(/^#+/, "").trim() }
        : { id: raw.id, slug: raw.slug, name: raw.name, name_ru: raw.name_ru, name_en: raw.name_en };
    if (!incoming.name) return;
    if (exists(incoming.name)) {
      setDraft("");
      return;
    }
    onChange([...value, incoming]);
    setDraft("");
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = draft.trim();
      if (v) add(v);
      return;
    }
    if (e.key === "Backspace" && !draft && value.length > 0) {
      e.preventDefault();
      remove(value.length - 1);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setFocused(false), 150);
    const v = draft.trim();
    if (v) add(v);
  };

  return (
    <div>
      {label && (
        <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
          <Tag className="inline h-3.5 w-3.5 mr-1 -mt-0.5 opacity-60" />
          {label}
        </div>
      )}
      <div className="relative">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-bg-input px-2 py-1.5 min-h-[40px]">
          {value.map((t, i) => (
            <span
              key={`${t.id || ""}-${t.name}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11.5px] font-medium"
              title={
                t.name_ru || t.name_en
                  ? `RU: ${t.name_ru || "—"} | EN: ${t.name_en || "—"}`
                  : "Yangi tag — saqlanganda ru/en tarjima qilinadi"
              }
            >
              #{t.name}
              <button
                type="button"
                onClick={() => remove(i)}
                className="hover:text-status-blocked"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            placeholder={value.length === 0 ? (placeholder || "stem, lego, 6yosh") : ""}
            className="flex-1 min-w-[120px] bg-transparent px-1 py-0.5 text-[12.5px] outline-none"
          />
          {loading && <Loader2 className="h-3 w-3 animate-spin text-text-muted" />}
        </div>

        {focused && suggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-line bg-bg shadow-xl">
            {suggestions
              .filter((s) => !exists(s.name))
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(s);
                  }}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[12px] hover:bg-bg-input/60 text-left"
                >
                  <span>
                    <span className="text-primary font-medium">#{s.name}</span>
                    {(s.name_ru || s.name_en) && (
                      <span className="text-text-muted ml-2">
                        {s.name_ru || "—"} · {s.name_en || "—"}
                      </span>
                    )}
                  </span>
                  <Plus className="h-3 w-3 text-text-muted" />
                </button>
              ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-[10.5px] text-text-muted">
        Enter yoki vergul bilan qo'shing. Yangi tag yaratilsa avtomatik 3 tilga
        tarjima qilinadi.
      </p>
    </div>
  );
}
