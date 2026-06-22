import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadMedia } from "../lib/api";
import { useT } from "../lib/i18n";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?:
    | "products"
    | "categories"
    | "banners"
    | "blog"
    | "blog/thumbnails"
    | "blog/banners"
    | "uploads";
  label?: string;
  hint?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  label,
  hint,
  className = "",
}: Props) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const r = await uploadMedia(file, folder);
      onChange(r.url);
    } catch (e) {
      setError((e as { message?: string }).message || t("imageUpload.uploadError"));
    } finally {
      setBusy(false);
    }
  };

  const displayLabel = label ?? t("imageUpload.defaultLabel");

  return (
    <div className={"space-y-2 " + className}>
      <div className="flex items-baseline gap-2">
        <div className="text-[12px] font-medium text-text-secondary">{displayLabel}</div>
        {hint && (
          <div className="text-[10.5px] text-text-muted">{hint}</div>
        )}
      </div>
      <div className="flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-bg-input">
          {value ? (
            <>
              <img
                src={value}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                title={t("imageUpload.removeTitle")}
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted">
              <Upload className="h-5 w-5 opacity-40" />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handlePick(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-bg-input px-3 py-1.5 text-[12px] font-medium text-text-primary hover:bg-bg-hover disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" />
            {busy ? t("imageUpload.uploading") : value ? t("imageUpload.replace") : t("imageUpload.upload")}
          </button>
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={t("imageUpload.urlPlaceholder")}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-1.5 text-[11.5px] font-mono text-text-secondary outline-none focus:border-primary"
          />
          {error && (
            <div className="text-[11px] text-red-500">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
