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
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  badgeLabels,
  initialProducts,
  productTypeLabels,
  type Product,
  type ProductBadge,
  type ProductType,
} from "../data/products";
import { cn } from "../lib/utils";

type TypeFilter = "all" | ProductType;
type StatusFilter = "all" | "active" | "inactive";

const typeChips: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "Hammasi" },
  { key: "stem", label: "STEM" },
  { key: "book", label: "Kitob" },
  { key: "other", label: "Boshqa" },
];

const statusChips: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "active", label: "Faol" },
  { key: "inactive", label: "Nofaol" },
];

const emptyForm = (): Product => ({
  id: "",
  name: "",
  category: "",
  type: "stem",
  age: "",
  price: 0,
  oldPrice: null,
  badge: "none",
  features: [],
  description: "",
  images: ["#3B82F6"],
  videoUrl: null,
  featured: false,
  isActive: true,
  createdAt: new Date().toLocaleDateString("ru-RU"),
  updatedAt: new Date().toLocaleDateString("ru-RU"),
});

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q) &&
          !p.id.toLowerCase().includes(q)
        )
          return false;
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
        ? prev.map((x) => (x.id === p.id ? { ...p, updatedAt: new Date().toLocaleDateString("ru-RU") } : x))
        : [{ ...p, createdAt: new Date().toLocaleDateString("ru-RU") }, ...prev];
    });
    setEditing(null);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Mahsulotlar"
        subtitle="Do'kondagi barcha tovarlar boshqaruvi"
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyForm())}
          >
            <Plus className="h-4 w-4" /> Yangi mahsulot
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Jami mahsulotlar", value: products.length, icon: Package, color: "#3B82F6" },
            {
              label: "Faol",
              value: products.filter((p) => p.isActive).length,
              icon: Package,
              color: "#10B981",
            },
            {
              label: "Tavsiya etilgan",
              value: products.filter((p) => p.featured).length,
              icon: Star,
              color: "#F59E0B",
            },
            {
              label: "Chegirmadagi",
              value: products.filter((p) => p.oldPrice).length,
              icon: Package,
              color: "#EF4444",
            },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[12px] text-text-secondary">{s.label}</div>
                  <div className="mt-1 text-[22px] font-bold text-text-primary">
                    {s.value}
                  </div>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
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
                placeholder="Mahsulot nomi yoki kategoriya..."
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
                  <th className="px-4 py-3 text-left font-semibold">Mahsulot</th>
                  <th className="px-4 py-3 text-left font-semibold">Kategoriya</th>
                  <th className="px-4 py-3 text-left font-semibold">Yosh</th>
                  <th className="px-4 py-3 text-left font-semibold">Narx</th>
                  <th className="px-4 py-3 text-left font-semibold">Belgi</th>
                  <th className="px-4 py-3 text-center font-semibold">Tavsiya</th>
                  <th className="px-4 py-3 text-center font-semibold">Faol</th>
                  <th className="px-4 py-3 text-right font-semibold">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const discount = p.oldPrice
                    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                    : 0;
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
                            <ImageIcon className="h-5 w-5 text-white/70" strokeWidth={1.8} />
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{p.name}</div>
                            <div className="font-mono text-[11px] text-text-muted">
                              #{p.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-text-secondary">{p.category}</div>
                        <div className="text-[11px] text-text-muted">
                          {productTypeLabels[p.type]}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{p.age}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-text-primary">
                            {p.price.toLocaleString("ru-RU")}
                          </span>
                          <span className="text-[10.5px] text-text-muted">so'm</span>
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
                            {badgeLabels[p.badge]}
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
                          title={p.featured ? "Tavsiyadan olib tashlash" : "Tavsiya etish"}
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
                            title="Tahrirlash"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="icon-btn h-8 w-8 hover:bg-status-blocked/15 hover:text-status-blocked"
                            onClick={() => removeProduct(p.id)}
                            title="O'chirish"
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
                      colSpan={8}
                      className="px-4 py-12 text-center text-[13px] text-text-muted"
                    >
                      Mahsulot topilmadi
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

function ProductFormDrawer({ product, onClose, onSave }: DrawerProps) {
  const [draft, setDraft] = useState<Product>(product);
  const [featureInput, setFeatureInput] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    set("features", [...draft.features, v]);
    setFeatureInput("");
  };

  const removeFeature = (idx: number) =>
    set(
      "features",
      draft.features.filter((_, i) => i !== idx),
    );

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

  const valid = draft.id.trim() && draft.name.trim() && draft.price > 0;

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
              {product.id ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-text-secondary">
              Barcha maydonlarni to'ldiring
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug (ID)">
                <input
                  className="input"
                  placeholder="codybot"
                  value={draft.id}
                  onChange={(e) =>
                    set(
                      "id",
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    )
                  }
                />
              </Field>
              <Field label="Nomi">
                <input
                  className="input"
                  placeholder="CodyBot — dasturlash roboti"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Kategoriya matni">
                <input
                  className="input"
                  placeholder="STEM O'YINCHOQ"
                  value={draft.category}
                  onChange={(e) => set("category", e.target.value)}
                />
              </Field>
              <Field label="Yosh chegarasi">
                <input
                  className="input"
                  placeholder="6+ yosh"
                  value={draft.age}
                  onChange={(e) => set("age", e.target.value)}
                />
              </Field>
              <Field label="Turi">
                <select
                  className="input"
                  value={draft.type}
                  onChange={(e) => set("type", e.target.value as ProductType)}
                >
                  <option value="stem">STEM</option>
                  <option value="book">Kitob</option>
                  <option value="other">Boshqa</option>
                </select>
              </Field>
              <Field label="Belgi">
                <select
                  className="input"
                  value={draft.badge}
                  onChange={(e) =>
                    set("badge", e.target.value as ProductBadge)
                  }
                >
                  <option value="none">Yo'q</option>
                  <option value="top">TOP</option>
                  <option value="yangi">Yangi</option>
                </select>
              </Field>
              <Field label="Narx (so'm)">
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={draft.price || ""}
                  onChange={(e) => set("price", Number(e.target.value))}
                />
              </Field>
              <Field
                label={
                  <span className="flex items-center gap-1">
                    Chegirmagacha narx
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
                  placeholder="Bo'sh qoldiring chegirma yo'q bo'lsa"
                  value={draft.oldPrice ?? ""}
                  onChange={(e) =>
                    set(
                      "oldPrice",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </Field>
            </div>

            <Field label="Xususiyatlar (chip)">
              <div className="flex flex-wrap gap-1.5">
                {draft.features.map((f, i) => (
                  <span
                    key={`${f}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] text-brand"
                  >
                    {f}
                    <button onClick={() => removeFeature(i)} className="hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="input"
                  placeholder="Bluetooth, Mobil ilova..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <button className="btn-secondary text-[12.5px]" onClick={addFeature}>
                  Qo'shish
                </button>
              </div>
            </Field>

            <Field label="Tavsif">
              <textarea
                rows={4}
                className="input resize-none"
                placeholder="Mahsulot haqida batafsil..."
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>

            <Field label="Rasmlar (1-5 ta)">
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
                  Rasmlarni shu yerga tashlang
                </div>
                <div className="text-[11px] text-text-muted">
                  yoki bosib tanlang · PNG, JPG, WebP
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
            </Field>

            <Field label="Video URL (ixtiyoriy)">
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
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <ToggleField
                label="Tavsiya etamiz karuselida"
                value={draft.featured}
                onChange={(v) => set("featured", v)}
              />
              <ToggleField
                label="Ilovada faol"
                value={draft.isActive}
                onChange={(v) => set("isActive", v)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line bg-bg-panel px-6 py-4">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            Bekor qilish
          </button>
          <button
            className="btn-primary text-[12.5px] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!valid}
            onClick={() => onSave(draft)}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
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
      <span className="text-[12.5px] font-medium text-text-secondary">{label}</span>
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
