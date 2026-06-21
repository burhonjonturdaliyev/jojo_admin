import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  Link as LinkIcon,
  Package,
  Search,
  ExternalLink,
  Image as ImageIcon,
  Ban,
  Loader2,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import {
  type BannerActionType,
  type PromoBanner,
} from "../data/banners";
import {
  bannersApi,
  storeProductsApi,
  unwrapList,
  type AdminStoreProduct,
} from "../lib/resources";
import { bannerToApi, bannerToUi } from "../lib/adapters";
import { cn } from "../lib/utils";
import { useT } from "../lib/i18n";
import { emptyLocalized } from "../types/locale";

const emptyBanner = (sortOrder: number): PromoBanner => ({
  id: `BNR-${Math.floor(Math.random() * 9000 + 1000)}`,
  kicker: emptyLocalized(),
  title: emptyLocalized(),
  subtitle: emptyLocalized(),
  theme: "sky",
  imageUrl: null,
  // Default — dekorativ banner. Foydalanuvchi xohlasa keyin Product yoki
  // tashqi URL'ga o'zgartiradi.
  actionType: "none",
  actionValue: "",
  sortOrder,
  isActive: true,
});

export function PromoBannersPage() {
  const { t } = useT();
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [, setLoading] = useState(true);
  const [, setBusy] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromoBanner | null>(null);

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
    // Modal yopilmasa ham xato'larni yuqoriga uzatadigan qilamiz —
    // drawer o'zining `saving` va `error` holatlarini boshqaradi.
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
          </div>

          <div className="space-y-2.5">
            {sorted.map((b) => {
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
                  <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-card">
                    {b.imageUrl ? (
                      <img
                        src={b.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-text-muted opacity-50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10.5px] text-text-muted">
                        #{b.sortOrder}
                      </span>
                      <span className="text-[14px] font-semibold text-text-primary truncate">
                        {bannerDisplayName(t, b)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-text-muted">
                      {b.actionType === "openProduct" ? (
                        <Package className="h-3 w-3" />
                      ) : b.actionType === "externalUrl" ? (
                        <LinkIcon className="h-3 w-3" />
                      ) : (
                        <Package className="h-3 w-3" />
                      )}
                      <span className="truncate">
                        {actionLabel(t, b.actionType, b.actionValue)}
                      </span>
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

function bannerDisplayName(
  t: (key: string, vars?: Record<string, string | number>) => string,
  b: PromoBanner,
): string {
  if (b.actionType === "openProduct" && b.actionValue) {
    return t("banners.action.productLabel", { value: b.actionValue });
  }
  if (b.actionType === "externalUrl" && b.actionValue) {
    return b.actionValue;
  }
  return t("banners.untitled");
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
  if (type === "externalUrl")
    return value
      ? t("banners.action.externalLabel", { value })
      : t("banners.action.externalUrl");
  if (type === "filterByType")
    return value
      ? t("banners.action.filterLabel", { value })
      : t("banners.action.filterByType");
  return t("banners.action.none");
}

interface DrawerProps {
  banner: PromoBanner;
  onClose: () => void;
  onSave: (b: PromoBanner) => Promise<void>;
}

function BannerFormDrawer({ banner, onClose, onSave }: DrawerProps) {
  const { t } = useT();
  const [draft, setDraft] = useState<PromoBanner>(banner);
  const [products, setProducts] = useState<AdminStoreProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof PromoBanner>(key: K, value: PromoBanner[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Only load products when the product picker is active.
  useEffect(() => {
    if (draft.actionType !== "openProduct" || products.length > 0) return;
    storeProductsApi
      .list()
      .then((r) => setProducts(unwrapList(r)))
      .catch((e) => console.error("products load", e));
  }, [draft.actionType, products.length]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products.slice(0, 50);
    return products
      .filter((p) =>
        ((p.name || "") + " " + (p.product_type || ""))
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 50);
  }, [products, productSearch]);

  const selectedProduct =
    draft.actionType === "openProduct" && draft.actionValue
      ? products.find((p) => String(p.id) === draft.actionValue)
      : null;

  const urlInvalid =
    draft.actionType === "externalUrl" &&
    draft.actionValue.trim() !== "" &&
    !/^https?:\/\/[^\s]+\.[^\s]+/i.test(draft.actionValue.trim());

  const setAction = (type: BannerActionType) => {
    setDraft((d) => ({ ...d, actionType: type, actionValue: "" }));
  };

  // Bannerga rasm shart — dekorativ holat ham, action holat ham bo'lsa
  // ham, rasm ko'rsatilishi kerak. Action ixtiyoriy:
  //  - "none"        → tap qilinganda hech narsa qilmaydi
  //  - "openProduct" → mahsulot tanlangan bo'lishi shart
  //  - "externalUrl" → URL kiritilgan va valid bo'lishi shart
  const actionInvalid =
    (draft.actionType === "openProduct" && draft.actionValue.trim() === "") ||
    (draft.actionType === "externalUrl" &&
      (draft.actionValue.trim() === "" || urlInvalid));
  const canSave = !!draft.imageUrl && !actionInvalid && !saving;

  const handleSave = async () => {
    if (saving || !canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(draft);
    } catch (err) {
      const message = (err as { message?: string })?.message || "Saqlash xatosi";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-lg flex-col border-l border-line bg-bg-panel shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-bold text-text-primary">
            {banner.imageUrl || banner.actionValue
              ? t("banners.editTitle")
              : t("banners.new")}
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          <ImageUpload
            value={draft.imageUrl}
            onChange={(url) => set("imageUrl", url)}
            folder="banners"
            label={t("banners.field.imageUrl")}
          />

          <div>
            <label className="mb-2 block text-[12px] font-medium text-text-secondary">
              {t("banners.field.actionType")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <ActionCard
                active={draft.actionType === "none"}
                onClick={() => setAction("none")}
                icon={<Ban className="h-4 w-4" />}
                title={t("banners.actionCard.none.title")}
                hint={t("banners.actionCard.none.hint")}
              />
              <ActionCard
                active={draft.actionType === "openProduct"}
                onClick={() => setAction("openProduct")}
                icon={<Package className="h-4 w-4" />}
                title={t("banners.actionCard.openProduct.title")}
                hint={t("banners.actionCard.openProduct.hint")}
              />
              <ActionCard
                active={draft.actionType === "externalUrl"}
                onClick={() => setAction("externalUrl")}
                icon={<LinkIcon className="h-4 w-4" />}
                title={t("banners.actionCard.externalUrl.title")}
                hint={t("banners.actionCard.externalUrl.hint")}
              />
            </div>

            {draft.actionType === "externalUrl" && (
              <div className="mt-3 rounded-xl border border-line bg-bg-input p-3">
                <label className="mb-1.5 block text-[11.5px] font-medium text-text-secondary">
                  {t("banners.field.externalUrl")}
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                  <input
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    value={draft.actionValue}
                    onChange={(e) => set("actionValue", e.target.value)}
                    placeholder={t("banners.field.externalUrlPh")}
                    className={cn(
                      "w-full rounded-lg border bg-bg pl-9 pr-3 py-2 text-[12.5px] font-mono outline-none focus:border-primary",
                      urlInvalid ? "border-red-500/50" : "border-line",
                    )}
                  />
                </div>
                {urlInvalid ? (
                  <div className="mt-1 text-[10.5px] text-red-500">
                    {t("banners.field.externalUrlInvalid")}
                  </div>
                ) : (
                  <div className="mt-1 text-[10.5px] text-text-muted">
                    {t("banners.field.externalUrlHint")}
                  </div>
                )}
              </div>
            )}

            {draft.actionType === "openProduct" && (
              <div className="mt-3 rounded-xl border border-line bg-bg-input p-3 space-y-2">
                <label className="block text-[11.5px] font-medium text-text-secondary">
                  {t("banners.field.product")}
                </label>
                {selectedProduct && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary overflow-hidden">
                      {selectedProduct.cover_image ? (
                        <img
                          src={selectedProduct.cover_image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-text-primary truncate">
                        {selectedProduct.name}
                      </div>
                      <div className="text-[10.5px] text-text-muted truncate">
                        #{selectedProduct.id}
                        {selectedProduct.price
                          ? ` · ${selectedProduct.price.toLocaleString("uz-UZ").replace(/,/g, " ")} so'm`
                          : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => set("actionValue", "")}
                      className="icon-btn h-7 w-7"
                      title={t("common.clear")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {!selectedProduct && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                      <input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder={t("banners.field.productSearchPh")}
                        className="w-full rounded-lg border border-line bg-bg pl-9 pr-3 py-2 text-[12.5px] outline-none focus:border-primary"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto scrollbar-thin rounded-lg border border-line bg-bg">
                      {filteredProducts.length === 0 ? (
                        <div className="px-3 py-6 text-center text-[11.5px] text-text-muted">
                          {products.length === 0
                            ? t("common.loading")
                            : t("banners.field.productEmpty")}
                        </div>
                      ) : (
                        filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => set("actionValue", String(p.id))}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-bg-hover transition-colors border-b border-line/50 last:border-b-0"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded bg-bg-input overflow-hidden">
                              {p.cover_image ? (
                                <img
                                  src={p.cover_image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-3.5 w-3.5 text-text-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-medium text-text-primary truncate">
                                {p.name}
                              </div>
                              {(p.price ?? 0) > 0 && (
                                <div className="text-[10.5px] text-text-muted">
                                  {(p.price ?? 0).toLocaleString("uz-UZ").replace(/,/g, " ")} so'm
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
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

        {saveError && (
          <div className="border-t border-red-500/30 bg-red-500/10 px-6 py-2.5 text-[12px] text-red-500">
            {saveError}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button
            className="btn-secondary text-[12.5px]"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </button>
          <button
            className="btn-primary text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-50"
            onClick={handleSave}
            disabled={!canSave}
            title={
              !draft.imageUrl
                ? t("banners.field.imageRequired")
                : actionInvalid
                  ? t("banners.field.actionRequired")
                  : undefined
            }
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-line bg-bg-input hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          active
            ? "bg-primary/15 text-primary"
            : "bg-bg text-text-secondary",
        )}
      >
        {icon}
      </div>
      <div className="text-[12px] font-semibold text-text-primary">{title}</div>
      <div className="text-[10.5px] text-text-muted leading-snug">{hint}</div>
    </button>
  );
}
