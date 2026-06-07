import { useMemo, useState } from "react";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  X,
  Eye,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  initialBanners,
  themeStyles,
  type BannerActionType,
  type BannerTheme,
  type PromoBanner,
} from "../data/banners";
import { cn } from "../lib/utils";

const emptyBanner = (sortOrder: number): PromoBanner => ({
  id: `BNR-${Math.floor(Math.random() * 9000 + 1000)}`,
  kicker: "",
  title: "",
  subtitle: "",
  theme: "sky",
  imageUrl: null,
  actionType: "none",
  actionValue: "",
  sortOrder,
  isActive: true,
});

export function PromoBannersPage() {
  const [banners, setBanners] = useState<PromoBanner[]>(initialBanners);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromoBanner | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);

  const sorted = useMemo(
    () => [...banners].sort((a, b) => a.sortOrder - b.sortOrder),
    [banners],
  );
  const activeBanners = useMemo(
    () => sorted.filter((b) => b.isActive),
    [sorted],
  );

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const dragged = banners.find((b) => b.id === draggedId);
    const target = banners.find((b) => b.id === targetId);
    if (!dragged || !target) return;
    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === draggedId) return { ...b, sortOrder: target.sortOrder };
        if (b.id === targetId) return { ...b, sortOrder: dragged.sortOrder };
        return b;
      }),
    );
    setDraggedId(null);
  };

  const toggleActive = (id: string) =>
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
    );

  const remove = (id: string) =>
    setBanners((prev) => prev.filter((b) => b.id !== id));

  const save = (b: PromoBanner) => {
    setBanners((prev) => {
      const exists = prev.some((x) => x.id === b.id);
      return exists ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b];
    });
    setEditing(null);
  };

  const nextSortOrder = (banners.reduce((m, b) => Math.max(m, b.sortOrder), 0) + 1);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Promo bannerlar"
        subtitle="Bosh sahifadagi aylanma bannerlar"
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyBanner(nextSortOrder))}
          >
            <Plus className="h-4 w-4" /> Yangi banner
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-[1fr_360px] gap-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  Bannerlar tartibi
                </h3>
                <p className="mt-0.5 text-[12px] text-text-secondary">
                  Tartibni o'zgartirish uchun sudrab tashlang
                </p>
              </div>
              <div className="text-[12px] text-text-muted">
                {activeBanners.length} faol · {banners.length - activeBanners.length} nofaol
              </div>
            </div>

            <div className="space-y-2.5">
              {sorted.map((b) => {
                const theme = themeStyles[b.theme];
                const isDragging = draggedId === b.id;
                return (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedId(b.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(b.id)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border border-line bg-bg-input p-3 transition-all",
                      isDragging && "opacity-40",
                      !b.isActive && "opacity-60",
                    )}
                  >
                    <button className="cursor-grab text-text-muted hover:text-text-secondary active:cursor-grabbing">
                      <GripVertical className="h-5 w-5" />
                    </button>
                    <div
                      className="flex h-16 w-28 shrink-0 flex-col justify-between rounded-lg p-2"
                      style={{ background: theme.bg, color: theme.text }}
                    >
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                        style={{ background: theme.chip, color: theme.kicker }}
                      >
                        {b.kicker || "Banner"}
                      </span>
                      <span className="line-clamp-2 text-[10px] font-bold leading-tight">
                        {b.title.split("\n")[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] text-text-muted">
                          #{b.sortOrder}
                        </span>
                        <span className="text-[14px] font-semibold text-text-primary">
                          {b.title.split("\n")[0] || "Untitled"}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-text-secondary">
                        {b.subtitle}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-muted">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: theme.kicker }}
                        />
                        {theme.name}
                        <ChevronRight className="h-3 w-3" />
                        {actionLabel(b.actionType, b.actionValue)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(b.id)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10.5px] font-medium",
                          b.isActive
                            ? "bg-status-resolved/15 text-status-resolved"
                            : "bg-text-muted/15 text-text-muted",
                        )}
                      >
                        {b.isActive ? "Faol" : "Nofaol"}
                      </button>
                      <button
                        className="icon-btn h-8 w-8"
                        onClick={() => setEditing(b)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="icon-btn h-8 w-8 hover:bg-status-blocked/15 hover:text-status-blocked"
                        onClick={() => remove(b.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {banners.length === 0 && (
                <div className="rounded-xl border border-dashed border-line py-12 text-center text-[13px] text-text-muted">
                  Hozircha banner yo'q
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-brand" />
                <h3 className="text-[14px] font-semibold text-text-primary">
                  Oldindan ko'rish
                </h3>
              </div>
              <p className="mb-3 text-[11.5px] text-text-secondary">
                Ilovaning bosh sahifasida shunday ko'rinadi
              </p>
              {activeBanners.length > 0 ? (
                <>
                  <BannerPreview
                    banner={activeBanners[previewIdx % activeBanners.length]}
                  />
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    {activeBanners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewIdx(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          previewIdx % activeBanners.length === i
                            ? "w-6 bg-brand"
                            : "w-1.5 bg-line",
                        )}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-line bg-bg-input py-10 text-center text-[12px] text-text-muted">
                  Faol banner yo'q
                </div>
              )}
            </div>

            <div className="card p-4">
              <h3 className="mb-3 text-[14px] font-semibold text-text-primary">
                Tema variantlari
              </h3>
              <div className="space-y-2">
                {(Object.keys(themeStyles) as BannerTheme[]).map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-3 rounded-lg border border-line bg-bg-input p-2.5"
                  >
                    <div
                      className="h-10 w-14 rounded-md"
                      style={{ background: themeStyles[t].bg }}
                    />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-text-primary">
                        {themeStyles[t].name}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {banners.filter((b) => b.theme === t).length} ta banner
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <BannerFormDrawer
          banner={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function actionLabel(type: BannerActionType, value: string) {
  if (type === "openProduct") return value ? `Mahsulot: ${value}` : "Mahsulot";
  if (type === "filterByType") return value ? `Filter: ${value}` : "Filter";
  return "Amal yo'q";
}

function BannerPreview({ banner }: { banner: PromoBanner }) {
  const theme = themeStyles[banner.theme];
  return (
    <div
      className="relative h-44 overflow-hidden rounded-xl p-4"
      style={{ background: theme.bg, color: theme.text }}
    >
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ background: theme.chip, color: theme.kicker }}
      >
        {banner.kicker || "Banner"}
      </span>
      <div className="mt-2 whitespace-pre-line text-[16px] font-bold leading-tight">
        {banner.title || "Banner sarlavhasi"}
      </div>
      <div
        className="mt-1.5 text-[11.5px] font-medium opacity-80"
      >
        {banner.subtitle || "Banner tavsifi shu yerda ko'rinadi"}
      </div>
      <div className="absolute bottom-3 right-3 inline-flex items-center justify-center rounded-full bg-white/30 px-3 py-1 text-[10px] font-semibold">
        Ko'rish <ChevronRight className="ml-0.5 h-3 w-3" />
      </div>
    </div>
  );
}

interface DrawerProps {
  banner: PromoBanner;
  onClose: () => void;
  onSave: (b: PromoBanner) => void;
}

function BannerFormDrawer({ banner, onClose, onSave }: DrawerProps) {
  const [draft, setDraft] = useState<PromoBanner>(banner);
  const set = <K extends keyof PromoBanner>(key: K, value: PromoBanner[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-line bg-bg-panel shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-bold text-text-primary">
            {banner.kicker || banner.title ? "Bannerni tahrirlash" : "Yangi banner"}
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          <BannerPreview banner={draft} />

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Kicker (kichik yorliq)
            </label>
            <input
              className="input"
              placeholder="Yangi mahsulot"
              value={draft.kicker}
              onChange={(e) => set("kicker", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Sarlavha (ko'p qator uchun Enter bosing)
            </label>
            <textarea
              rows={3}
              className="input resize-none font-medium"
              placeholder="CodyBot bilan\ndasturlashni o'rganing"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Tavsif
            </label>
            <input
              className="input"
              placeholder="Qisqa tavsif..."
              value={draft.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Tema
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(themeStyles) as BannerTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => set("theme", t)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-colors",
                    draft.theme === t ? "border-brand" : "border-line",
                  )}
                >
                  <div
                    className="h-12 w-full rounded-md"
                    style={{ background: themeStyles[t].bg }}
                  />
                  <span className="text-[12px] font-medium text-text-primary">
                    {themeStyles[t].name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Rasm URL (ixtiyoriy)
            </label>
            <div className="relative">
              <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                className="input pl-9"
                placeholder="https://..."
                value={draft.imageUrl ?? ""}
                onChange={(e) => set("imageUrl", e.target.value.trim() || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Amal turi
              </label>
              <select
                className="input"
                value={draft.actionType}
                onChange={(e) =>
                  set("actionType", e.target.value as BannerActionType)
                }
              >
                <option value="none">Yo'q</option>
                <option value="openProduct">Mahsulot ochish</option>
                <option value="filterByType">Tur bo'yicha filter</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                {draft.actionType === "openProduct"
                  ? "Mahsulot ID"
                  : draft.actionType === "filterByType"
                    ? "Tur (stem/book/other)"
                    : "Qiymat"}
              </label>
              <input
                className="input"
                disabled={draft.actionType === "none"}
                placeholder={
                  draft.actionType === "openProduct"
                    ? "codybot"
                    : draft.actionType === "filterByType"
                      ? "stem"
                      : ""
                }
                value={draft.actionValue}
                onChange={(e) => set("actionValue", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Tartib
              </label>
              <input
                type="number"
                className="input"
                value={draft.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              onClick={() => set("isActive", !draft.isActive)}
              className="flex items-end justify-between rounded-lg border border-line bg-bg-input px-3 py-2.5 text-left transition-colors hover:bg-bg-hover"
            >
              <span className="text-[12.5px] font-medium text-text-secondary">
                Faol
              </span>
              <span
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  draft.isActive ? "bg-brand" : "bg-bg-hover",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    draft.isActive ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            Bekor qilish
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => onSave(draft)}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
