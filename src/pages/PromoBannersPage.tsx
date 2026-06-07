import { useEffect, useMemo, useState } from "react";
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
import { LocalizedField } from "../components/LocalizedField";
import { TranslateAllButton } from "../components/TranslateAllButton";
import {
  themeStyles,
  type BannerActionType,
  type BannerTheme,
  type PromoBanner,
} from "../data/banners";
import { bannersApi, unwrapList } from "../lib/resources";
import { bannerToApi, bannerToUi } from "../lib/adapters";
import { cn } from "../lib/utils";
import { useT, type Lang } from "../lib/i18n";
import {
  emptyLocalized,
  pickLocalized,
  toLocalized,
  type Localized,
} from "../types/locale";

const emptyBanner = (sortOrder: number): PromoBanner => ({
  id: `BNR-${Math.floor(Math.random() * 9000 + 1000)}`,
  kicker: emptyLocalized(),
  title: emptyLocalized(),
  subtitle: emptyLocalized(),
  theme: "sky",
  imageUrl: null,
  actionType: "none",
  actionValue: "",
  sortOrder,
  isActive: true,
});

export function PromoBannersPage() {
  const { t, lang } = useT();
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [, setLoading] = useState(true);
  const [, setBusy] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromoBanner | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);

  // Backend'dan ro'yxat olib kelamiz.
  const reload = async () => {
    setLoading(true);
    try {
      const raw = await bannersApi.list();
      const mapped = unwrapList(raw).map(bannerToUi);
      setBanners(mapped);
    } catch (err) {
      console.error("banners load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

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

  const toggleActive = async (id: string) => {
    const b = banners.find((x) => x.id === id);
    if (!b) return;
    setBusy(true);
    try {
      await bannersApi.update(Number(id), { is_active: !b.isActive });
      await reload();
    } catch (err) {
      console.error("toggle failed", err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await bannersApi.remove(Number(id));
      await reload();
    } catch (err) {
      console.error("remove failed", err);
    } finally {
      setBusy(false);
    }
  };

  const save = async (b: PromoBanner) => {
    setBusy(true);
    try {
      const payload = bannerToApi(b);
      const isNew = !banners.some((x) => x.id === b.id);
      if (isNew) {
        await bannersApi.create(payload);
      } else {
        await bannersApi.update(Number(b.id), payload);
      }
      await reload();
      setEditing(null);
    } catch (err) {
      console.error("save failed", err);
    } finally {
      setBusy(false);
    }
  };

  const nextSortOrder =
    banners.reduce((m, b) => Math.max(m, b.sortOrder), 0) + 1;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.banners")}
        subtitle={t("banners.subtitle")}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyBanner(nextSortOrder))}
          >
            <Plus className="h-4 w-4" /> {t("banners.new")}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-[1fr_360px] gap-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  {t("banners.order")}
                </h3>
                <p className="mt-0.5 text-[12px] text-text-secondary">
                  {t("banners.orderHint")}
                </p>
              </div>
              <div className="text-[12px] text-text-muted">
                {t("banners.activeCount", {
                  active: activeBanners.length,
                  inactive: banners.length - activeBanners.length,
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              {sorted.map((b) => {
                const theme = themeStyles[b.theme];
                const isDragging = draggedId === b.id;
                const kickerText = pickLocalized(b.kicker, lang);
                const titleText = pickLocalized(b.title, lang);
                const subtitleText = pickLocalized(b.subtitle, lang);
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
                        {kickerText || t("banners.kickerDefault")}
                      </span>
                      <span className="line-clamp-2 text-[10px] font-bold leading-tight">
                        {titleText.split("\n")[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] text-text-muted">
                          #{b.sortOrder}
                        </span>
                        <span className="text-[14px] font-semibold text-text-primary">
                          {titleText.split("\n")[0] || t("banners.untitled")}
                        </span>
                        <LocaleAvailabilityDots banner={b} />
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-text-secondary">
                        {subtitleText}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-muted">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: theme.kicker }}
                        />
                        {theme.name}
                        <ChevronRight className="h-3 w-3" />
                        {actionLabel(t, b.actionType, b.actionValue)}
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
                        {b.isActive ? t("common.active") : t("common.inactive")}
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
                  {t("banners.empty")}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-brand" />
                <h3 className="text-[14px] font-semibold text-text-primary">
                  {t("banners.preview")}
                </h3>
              </div>
              <p className="mb-3 text-[11.5px] text-text-secondary">
                {t("banners.previewSub")}
              </p>
              {activeBanners.length > 0 ? (
                <>
                  <BannerPreview
                    banner={activeBanners[previewIdx % activeBanners.length]}
                    previewLang={lang}
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
                  {t("banners.noActive")}
                </div>
              )}
            </div>

            <div className="card p-4">
              <h3 className="mb-3 text-[14px] font-semibold text-text-primary">
                {t("banners.themes")}
              </h3>
              <div className="space-y-2">
                {(Object.keys(themeStyles) as BannerTheme[]).map((th) => (
                  <div
                    key={th}
                    className="flex items-center gap-3 rounded-lg border border-line bg-bg-input p-2.5"
                  >
                    <div
                      className="h-10 w-14 rounded-md"
                      style={{ background: themeStyles[th].bg }}
                    />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-text-primary">
                        {themeStyles[th].name}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {t("banners.themeCount", {
                          count: banners.filter((b) => b.theme === th).length,
                        })}
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

function LocaleAvailabilityDots({ banner }: { banner: PromoBanner }) {
  const langs: Lang[] = ["uz", "ru", "en"];
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 rounded-md border border-line bg-bg-card px-1 py-0.5">
      {langs.map((l) => {
        const hasTitle = !!pickLocalized(banner.title, l).trim();
        return (
          <span
            key={l}
            title={l.toUpperCase()}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              hasTitle ? "bg-status-resolved" : "bg-line",
            )}
          />
        );
      })}
    </span>
  );
}

function actionLabel(
  t: (key: string, vars?: Record<string, string | number>) => string,
  type: BannerActionType,
  value: string,
) {
  if (type === "openProduct")
    return value
      ? t("banners.action.productLabel", { value })
      : t("banners.action.openProduct");
  if (type === "filterByType")
    return value
      ? t("banners.action.filterLabel", { value })
      : t("banners.action.filterByType");
  return t("banners.action.none");
}

function BannerPreview({
  banner,
  previewLang,
}: {
  banner: PromoBanner;
  previewLang: Lang;
}) {
  const { t } = useT();
  const theme = themeStyles[banner.theme];
  const kicker = pickLocalized(banner.kicker, previewLang);
  const title = pickLocalized(banner.title, previewLang);
  const subtitle = pickLocalized(banner.subtitle, previewLang);
  return (
    <div
      className="relative h-44 overflow-hidden rounded-xl p-4"
      style={{ background: theme.bg, color: theme.text }}
    >
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ background: theme.chip, color: theme.kicker }}
      >
        {kicker || t("banners.kickerDefault")}
      </span>
      <div className="mt-2 whitespace-pre-line text-[16px] font-bold leading-tight">
        {title || t("banners.titleSample")}
      </div>
      <div className="mt-1.5 text-[11.5px] font-medium opacity-80">
        {subtitle || t("banners.subtitleSample")}
      </div>
      <div className="absolute bottom-3 right-3 inline-flex items-center justify-center rounded-full bg-white/30 px-3 py-1 text-[10px] font-semibold">
        {t("banners.viewCta")} <ChevronRight className="ml-0.5 h-3 w-3" />
      </div>
      <span className="absolute top-3 right-3 rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90">
        {previewLang}
      </span>
    </div>
  );
}

interface DraftBanner {
  id: string;
  kicker: Localized<string>;
  title: Localized<string>;
  subtitle: Localized<string>;
  theme: BannerTheme;
  imageUrl: string | null;
  actionType: BannerActionType;
  actionValue: string;
  sortOrder: number;
  isActive: boolean;
}

function normalizeDraft(banner: PromoBanner): DraftBanner {
  return {
    ...banner,
    kicker: toLocalized(banner.kicker),
    title: toLocalized(banner.title),
    subtitle: toLocalized(banner.subtitle),
  };
}

interface DrawerProps {
  banner: PromoBanner;
  onClose: () => void;
  onSave: (b: PromoBanner) => void;
}

function BannerFormDrawer({ banner, onClose, onSave }: DrawerProps) {
  const { t, lang } = useT();
  const [draft, setDraft] = useState<DraftBanner>(() => normalizeDraft(banner));
  const [previewLang, setPreviewLang] = useState<Lang>(lang);
  const set = <K extends keyof DraftBanner>(key: K, value: DraftBanner[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const hasContent = !!(
    draft.kicker.uz ||
    draft.kicker.ru ||
    draft.kicker.en ||
    draft.title.uz ||
    draft.title.ru ||
    draft.title.en
  );

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-line bg-bg-panel shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-bold text-text-primary">
            {banner.id && hasContent ? t("banners.editTitle") : t("banners.new")}
          </h2>
          <div className="flex items-center gap-2">
            <TranslateAllButton
              from={lang}
              fields={[
                { value: draft.kicker, onChange: (v) => set("kicker", v) },
                { value: draft.title, onChange: (v) => set("title", v) },
                { value: draft.subtitle, onChange: (v) => set("subtitle", v) },
              ]}
            />
            <button className="icon-btn" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="text-[12px] font-medium text-text-secondary">
                {t("banners.preview")}
              </div>
              <PreviewLangPicker active={previewLang} onChange={setPreviewLang} />
            </div>
            <BannerPreview
              banner={draft as unknown as PromoBanner}
              previewLang={previewLang}
            />
          </div>

          <LocalizedField
            label={t("banners.field.kicker")}
            value={draft.kicker}
            onChange={(v) => set("kicker", v)}
            placeholder={t("banners.field.kickerPh")}
          />

          <LocalizedField
            as="textarea"
            rows={5}
            label={t("banners.field.title")}
            value={draft.title}
            onChange={(v) => set("title", v)}
            placeholder={t("banners.field.titlePh")}
          />

          <LocalizedField
            label={t("banners.field.subtitle")}
            value={draft.subtitle}
            onChange={(v) => set("subtitle", v)}
            placeholder={t("banners.field.subtitlePh")}
          />

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              {t("banners.field.theme")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(themeStyles) as BannerTheme[]).map((th) => (
                <button
                  key={th}
                  onClick={() => set("theme", th)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-colors",
                    draft.theme === th ? "border-brand" : "border-line",
                  )}
                >
                  <div
                    className="h-12 w-full rounded-md"
                    style={{ background: themeStyles[th].bg }}
                  />
                  <span className="text-[12px] font-medium text-text-primary">
                    {themeStyles[th].name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              {t("banners.field.imageUrl")}
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
                {t("banners.field.actionType")}
              </label>
              <select
                className="input"
                value={draft.actionType}
                onChange={(e) =>
                  set("actionType", e.target.value as BannerActionType)
                }
              >
                <option value="none">{t("common.none")}</option>
                <option value="openProduct">
                  {t("banners.action.openProduct")}
                </option>
                <option value="filterByType">
                  {t("banners.action.filterByType")}
                </option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                {draft.actionType === "openProduct"
                  ? t("banners.field.productId")
                  : draft.actionType === "filterByType"
                    ? t("banners.field.typeValue")
                    : t("banners.field.actionValue")}
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
                {t("banners.field.sortOrder")}
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
                {t("common.active")}
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
            {t("common.cancel")}
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => onSave(draft as PromoBanner)}
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewLangPicker({
  active,
  onChange,
}: {
  active: Lang;
  onChange: (l: Lang) => void;
}) {
  const langs: Lang[] = ["uz", "ru", "en"];
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-line bg-bg-input p-0.5">
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={cn(
            "rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide transition-colors",
            active === l
              ? "bg-brand text-white"
              : "text-text-secondary hover:bg-bg-hover",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
