import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Star,
  Image as ImageIcon,
  X,
  UploadCloud,
  Video,
  Package,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { LocalizedField } from "../components/LocalizedField";
import { TranslateAllButton } from "../components/TranslateAllButton";
import {
  initialProducts,
  type Product,
  type ProductBadge,
  type ProductType,
} from "../data/products";
import { initialOrders } from "../data/orders";
import { computeOrderTotals, computeProductMetrics } from "../lib/analytics";
import { cn } from "../lib/utils";
import { useT, type Lang } from "../lib/i18n";
import {
  emptyLocalized,
  emptyLocalizedList,
  pickLocalized,
  toLocalized,
  toLocalizedList,
  type Localized,
} from "../types/locale";

type TypeFilter = "all" | ProductType;
type StatusFilter = "all" | "active" | "inactive";

const emptyForm = (): Product => ({
  id: "",
  name: emptyLocalized(),
  category: emptyLocalized(),
  type: "stem",
  age: "",
  price: 0,
  oldPrice: null,
  badge: "none",
  features: emptyLocalizedList(),
  description: emptyLocalized(),
  images: ["#3B82F6"],
  videoUrl: null,
  featured: false,
  isActive: true,
  createdAt: new Date().toLocaleDateString("ru-RU"),
  updatedAt: new Date().toLocaleDateString("ru-RU"),
});

export function ProductsPage() {
  const { t, lang } = useT();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<Product | null>(null);

  const typeChips: { key: TypeFilter; label: string }[] = [
    { key: "all", label: t("common.all") },
    { key: "stem", label: t("productType.stem") },
    { key: "book", label: t("productType.book") },
    { key: "other", label: t("productType.other") },
  ];

  const statusChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("common.allPlural") },
    { key: "active", label: t("common.active") },
    { key: "inactive", label: t("common.inactive") },
  ];

  const metricsByProduct = useMemo(() => {
    const list = computeProductMetrics(initialOrders, products, (p) =>
      pickLocalized(p.name, lang),
    );
    return new Map(list.map((m) => [m.productId, m]));
  }, [products, lang]);

  const totals = useMemo(() => computeOrderTotals(initialOrders), []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        // Search across every locale + id so admins find content regardless of view lang.
        const haystacks = [
          p.id,
          pickLocalized(p.name, "uz"),
          pickLocalized(p.name, "ru"),
          pickLocalized(p.name, "en"),
          pickLocalized(p.category, "uz"),
          pickLocalized(p.category, "ru"),
          pickLocalized(p.category, "en"),
        ];
        if (!haystacks.some((s) => s.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [products, search, typeFilter, statusFilter]);

  const toggleFeatured = (id: string) =>
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p)),
    );

  const toggleActive = (id: string) =>
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
    );

  const removeProduct = (id: string) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  const saveProduct = (p: Product) => {
    setProducts((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists
        ? prev.map((x) =>
            x.id === p.id
              ? { ...p, updatedAt: new Date().toLocaleDateString("ru-RU") }
              : x,
          )
        : [
            { ...p, createdAt: new Date().toLocaleDateString("ru-RU") },
            ...prev,
          ];
    });
    setEditing(null);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.products")}
        subtitle={t("products.subtitle")}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyForm())}
          >
            <Plus className="h-4 w-4" /> {t("products.new")}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: t("products.stat.total"),
              value: products.length.toLocaleString("ru-RU"),
              hint: t("products.stat.totalSub", {
                active: products.filter((p) => p.isActive).length,
                featured: products.filter((p) => p.featured).length,
              }),
              icon: Package,
              color: "#3B82F6",
            },
            {
              label: t("products.stat.orders"),
              value: totals.orders.toLocaleString("ru-RU"),
              hint: t("products.stat.ordersSub", { count: totals.active }),
              icon: ShoppingCart,
              color: "#6366F1",
            },
            {
              label: t("products.stat.sold"),
              value: totals.sold.toLocaleString("ru-RU"),
              hint: t("products.stat.soldSub", {
                revenue: totals.revenue.toLocaleString("ru-RU"),
              }),
              icon: CheckCircle2,
              color: "#10B981",
            },
            {
              label: t("products.stat.cancelled"),
              value: totals.cancelled.toLocaleString("ru-RU"),
              hint: t("products.stat.cancelledSub", {
                pct: Math.round(totals.cancellationRate * 100),
              }),
              icon: XCircle,
              color: "#EF4444",
            },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-[12px] text-text-secondary">{s.label}</div>
                  <div className="mt-1 text-[22px] font-bold leading-none text-text-primary">
                    {s.value}
                  </div>
                  <div className="mt-1.5 truncate text-[11px] text-text-muted">
                    {s.hint}
                  </div>
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${s.color}26`, color: s.color }}
                >
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                placeholder={t("products.searchPlaceholder")}
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-line bg-bg-input p-1">
                {typeChips.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setTypeFilter(c.key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                      typeFilter === c.key
                        ? "bg-brand text-white"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-line bg-bg-input p-1">
                {statusChips.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setStatusFilter(c.key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                      statusFilter === c.key
                        ? "bg-brand text-white"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-bg-input text-[12px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("products.tbl.product")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("products.tbl.category")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("products.tbl.price")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("products.tbl.orders")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("products.tbl.added")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("products.tbl.badge")}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    {t("products.tbl.featured")}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    {t("products.tbl.active")}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {t("products.tbl.action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const discount = p.oldPrice
                    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                    : 0;
                  const m = metricsByProduct.get(p.id);
                  const orders = m?.orders ?? 0;
                  const sold = m?.sold ?? 0;
                  const cancelled = m?.cancelled ?? 0;
                  const conversion = Math.round((m?.conversionRate ?? 0) * 100);
                  return (
                    <tr key={p.id} className={i ? "border-t border-line" : ""}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${p.images[0]}, ${p.images[0]}88)`,
                            }}
                          >
                            <ImageIcon
                              className="h-5 w-5 text-white/70"
                              strokeWidth={1.8}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary">
                              {pickLocalized(p.name, lang)}
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
                              <span>#{p.id}</span>
                              <span className="text-text-muted/60">·</span>
                              <span className="font-sans">{p.age}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-text-secondary">
                          {pickLocalized(p.category, lang)}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {t(`productType.${p.type}`)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-text-primary">
                            {p.price.toLocaleString("ru-RU")}
                          </span>
                          <span className="text-[10.5px] text-text-muted">
                            {t("common.sum")}
                          </span>
                        </div>
                        {p.oldPrice && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-text-muted line-through">
                              {p.oldPrice.toLocaleString("ru-RU")}
                            </span>
                            <span className="rounded bg-status-blocked/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-blocked">
                              -{discount}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <StatPill
                            icon={ShoppingCart}
                            label={t("products.pill.orders")}
                            value={orders}
                            tone="brand"
                          />
                          <StatPill
                            icon={CheckCircle2}
                            label={t("products.pill.sold")}
                            value={sold}
                            tone="success"
                          />
                          <StatPill
                            icon={XCircle}
                            label={t("products.pill.cancelled")}
                            value={cancelled}
                            tone="danger"
                          />
                        </div>
                        {orders > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10.5px] text-text-muted">
                            <TrendingUp className="h-3 w-3" />
                            <span>
                              {t("products.conversion", { pct: conversion })}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-text-secondary">
                          <CalendarDays className="h-3.5 w-3.5 text-text-muted" />
                          <span className="text-[12.5px]">{p.createdAt}</span>
                        </div>
                        {p.updatedAt && p.updatedAt !== p.createdAt && (
                          <div className="mt-0.5 text-[10.5px] text-text-muted">
                            {t("products.updatedAt", { date: p.updatedAt })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.badge === "none" ? (
                          <span className="text-text-muted">—</span>
                        ) : (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-medium",
                              p.badge === "top"
                                ? "bg-status-progress/15 text-status-progress"
                                : "bg-status-resolved/15 text-status-resolved",
                            )}
                          >
                            {t(`productBadge.${p.badge}`)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleFeatured(p.id)}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                            p.featured
                              ? "bg-status-progress/15 text-status-progress"
                              : "text-text-muted hover:bg-bg-hover",
                          )}
                          title={
                            p.featured
                              ? t("products.unrecommend")
                              : t("products.recommend")
                          }
                        >
                          <Star
                            className="h-4 w-4"
                            fill={p.featured ? "currentColor" : "none"}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(p.id)}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                            p.isActive ? "bg-brand" : "bg-bg-hover",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              p.isActive ? "translate-x-4" : "translate-x-0.5",
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="icon-btn h-8 w-8"
                            onClick={() => setEditing(p)}
                            title={t("common.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="icon-btn h-8 w-8 hover:bg-status-blocked/15 hover:text-status-blocked"
                            onClick={() => removeProduct(p.id)}
                            title={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-[13px] text-text-muted"
                    >
                      {t("products.notFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <ProductFormDrawer
          product={editing}
          onClose={() => setEditing(null)}
          onSave={saveProduct}
        />
      )}
    </div>
  );
}

interface DrawerProps {
  product: Product;
  onClose: () => void;
  onSave: (p: Product) => void;
}

interface DraftProduct {
  id: string;
  name: Localized<string>;
  category: Localized<string>;
  type: ProductType;
  age: string;
  price: number;
  oldPrice: number | null;
  badge: ProductBadge;
  features: Localized<string[]>;
  description: Localized<string>;
  images: string[];
  videoUrl: string | null;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function normalizeDraft(product: Product): DraftProduct {
  return {
    ...product,
    name: toLocalized(product.name),
    category: toLocalized(product.category),
    description: toLocalized(product.description),
    features: toLocalizedList(product.features),
  };
}

function ProductFormDrawer({ product, onClose, onSave }: DrawerProps) {
  const { t, lang } = useT();
  const [draft, setDraft] = useState<DraftProduct>(() => normalizeDraft(product));
  const [featureInput, setFeatureInput] = useState("");
  const [featureLang, setFeatureLang] = useState<Lang>(lang);
  const [dragOver, setDragOver] = useState(false);

  const set = <K extends keyof DraftProduct>(key: K, value: DraftProduct[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    set("features", {
      ...draft.features,
      [featureLang]: [...draft.features[featureLang], v],
    });
    setFeatureInput("");
  };

  const removeFeature = (idx: number) =>
    set("features", {
      ...draft.features,
      [featureLang]: draft.features[featureLang].filter((_, i) => i !== idx),
    });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const swatches = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    const next = swatches[draft.images.length % swatches.length];
    set("images", [...draft.images, next].slice(0, 5));
  };

  const removeImage = (idx: number) =>
    set(
      "images",
      draft.images.filter((_, i) => i !== idx),
    );

  const discount =
    draft.oldPrice && draft.oldPrice > draft.price
      ? Math.round(((draft.oldPrice - draft.price) / draft.oldPrice) * 100)
      : 0;

  const valid =
    draft.id.trim() &&
    draft.name.uz.trim() &&
    draft.name.ru.trim() &&
    draft.name.en.trim() &&
    draft.price > 0;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col border-l border-line bg-bg-panel shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary">
              {product.id ? t("products.editTitle") : t("products.new")}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-text-secondary">
              {t("products.fillAll")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TranslateAllButton
              from={lang}
              fields={[
                {
                  value: draft.name,
                  onChange: (v) => set("name", v),
                },
                {
                  value: draft.category,
                  onChange: (v) => set("category", v),
                },
                {
                  value: draft.description,
                  onChange: (v) => set("description", v),
                },
              ]}
              listFields={[
                {
                  value: draft.features,
                  onChange: (v) => set("features", v),
                },
              ]}
            />
            <button className="icon-btn" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <PlainField label={t("products.field.slug")}>
                <input
                  className="input"
                  placeholder="codybot"
                  value={draft.id}
                  onChange={(e) =>
                    set(
                      "id",
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    )
                  }
                />
              </PlainField>
              <PlainField label={t("products.field.age")}>
                <input
                  className="input"
                  placeholder="6+"
                  value={draft.age}
                  onChange={(e) => set("age", e.target.value)}
                />
              </PlainField>
            </div>

            <LocalizedField
              label={t("products.field.name")}
              value={draft.name}
              onChange={(v) => set("name", v)}
              placeholder="CodyBot"
            />

            <LocalizedField
              label={t("products.field.category")}
              value={draft.category}
              onChange={(v) => set("category", v)}
              placeholder="STEM"
            />

            <div className="grid grid-cols-2 gap-3">
              <PlainField label={t("products.field.type")}>
                <select
                  className="input"
                  value={draft.type}
                  onChange={(e) => set("type", e.target.value as ProductType)}
                >
                  <option value="stem">{t("productType.stem")}</option>
                  <option value="book">{t("productType.book")}</option>
                  <option value="other">{t("productType.other")}</option>
                </select>
              </PlainField>
              <PlainField label={t("products.field.badge")}>
                <select
                  className="input"
                  value={draft.badge}
                  onChange={(e) => set("badge", e.target.value as ProductBadge)}
                >
                  <option value="none">{t("common.none")}</option>
                  <option value="top">{t("productBadge.top")}</option>
                  <option value="yangi">{t("productBadge.yangi")}</option>
                </select>
              </PlainField>
              <PlainField label={t("products.field.price")}>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={draft.price || ""}
                  onChange={(e) => set("price", Number(e.target.value))}
                />
              </PlainField>
              <PlainField
                label={
                  <span className="flex items-center gap-1">
                    {t("products.field.oldPrice")}
                    {discount > 0 && (
                      <span className="rounded bg-status-blocked/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-blocked">
                        -{discount}%
                      </span>
                    )}
                  </span>
                }
              >
                <input
                  type="number"
                  className="input"
                  placeholder={t("products.field.oldPricePh")}
                  value={draft.oldPrice ?? ""}
                  onChange={(e) =>
                    set(
                      "oldPrice",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </PlainField>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[12px] font-medium text-text-secondary">
                  {t("products.field.features")}
                </label>
                <FeatureLangTabs
                  active={featureLang}
                  setActive={setFeatureLang}
                  features={draft.features}
                />
              </div>
              <div className="rounded-lg border border-line bg-bg-input p-3">
                <div className="flex flex-wrap gap-1.5">
                  {draft.features[featureLang].map((f, i) => (
                    <span
                      key={`${f}-${i}`}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] text-brand"
                    >
                      {f}
                      <button
                        onClick={() => removeFeature(i)}
                        className="hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {!draft.features[featureLang].length && (
                    <span className="text-[11px] text-text-muted">
                      {t("loc.fillTab", {
                        lang: featureLang === "uz" ? "UZ" : featureLang === "ru" ? "RU" : "EN",
                      })}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className="input"
                    placeholder={t("products.field.featurePh")}
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <button
                    className="btn-secondary text-[12.5px]"
                    onClick={addFeature}
                  >
                    {t("common.add")}
                  </button>
                </div>
              </div>
            </div>

            <LocalizedField
              as="textarea"
              rows={7}
              label={t("products.field.description")}
              value={draft.description}
              onChange={(v) => set("description", v)}
              placeholder={t("products.field.descriptionPh")}
            />

            <PlainField label={t("products.field.images")}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 transition-colors",
                  dragOver
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-bg-input",
                )}
              >
                <UploadCloud className="h-7 w-7 text-text-muted" />
                <div className="mt-2 text-[12.5px] font-medium text-text-secondary">
                  {t("products.dropImages")}
                </div>
                <div className="text-[11px] text-text-muted">
                  {t("products.orChoose")}
                </div>
              </div>
              {draft.images.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {draft.images.map((img, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${img}, ${img}88)`,
                      }}
                    >
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute left-1.5 bottom-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </PlainField>

            <PlainField label={t("products.field.video")}>
              <div className="relative">
                <Video className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  className="input pl-9"
                  placeholder="https://youtube.com/watch?v=..."
                  value={draft.videoUrl ?? ""}
                  onChange={(e) =>
                    set("videoUrl", e.target.value.trim() || null)
                  }
                />
              </div>
            </PlainField>

            <div className="grid grid-cols-2 gap-3">
              <ToggleField
                label={t("products.toggle.featured")}
                value={draft.featured}
                onChange={(v) => set("featured", v)}
              />
              <ToggleField
                label={t("products.toggle.active")}
                value={draft.isActive}
                onChange={(v) => set("isActive", v)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line bg-bg-panel px-6 py-4">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            className="btn-primary text-[12.5px] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!valid}
            onClick={() => onSave(draft as Product)}
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureLangTabs({
  active,
  setActive,
  features,
}: {
  active: Lang;
  setActive: (l: Lang) => void;
  features: Localized<string[]>;
}) {
  const langs: Lang[] = ["uz", "ru", "en"];
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-line bg-bg-input p-0.5">
      {langs.map((l) => {
        const count = features[l].length;
        const isActive = l === active;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setActive(l)}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide transition-colors",
              isActive
                ? "bg-brand text-white"
                : "text-text-secondary hover:bg-bg-hover",
            )}
          >
            {l}
            <span
              className={cn(
                "rounded-full px-1 text-[9px] tabular-nums",
                isActive ? "bg-white/20" : "bg-bg-hover",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const pillTones = {
  brand: "bg-brand-soft text-brand",
  success: "bg-status-resolved/15 text-status-resolved",
  danger: "bg-status-blocked/15 text-status-blocked",
} as const;

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: keyof typeof pillTones;
}) {
  return (
    <span
      title={`${label}: ${value}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        pillTones[tone],
      )}
    >
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}

function PlainField({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between rounded-lg border border-line bg-bg-input px-3 py-2.5 text-left transition-colors hover:bg-bg-hover"
    >
      <span className="text-[12.5px] font-medium text-text-secondary">
        {label}
      </span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          value ? "bg-brand" : "bg-bg-hover",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
