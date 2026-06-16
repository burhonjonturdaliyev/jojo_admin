import { useEffect, useMemo, useState } from "react";
import { Plus, Package, Pencil, Trash2, Search, Sparkles, Loader2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import { MultilangInput } from "../components/MultilangInput";
import { TagsInput } from "../components/TagsInput";
import { useT } from "../lib/i18n";
import {
  storeProductsApi,
  storeCategoriesApi,
  translateApi,
  unwrapList,
  type AdminStoreCategory,
  type TranslateLang,
} from "../lib/resources";
import {
  productToApi,
  productToUi,
  emptyLocalizedString,
  type UiProduct,
} from "../lib/adapters";

export function ProductsPage() {
  const { t } = useT();
  const [products, setProducts] = useState<UiProduct[]>([]);
  const [categories, setCategories] = useState<AdminStoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<UiProduct | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [pRaw, cRaw] = await Promise.all([
        storeProductsApi.list({
          q: search || undefined,
          category_id: categoryFilter || undefined,
        }),
        storeCategoriesApi.list(),
      ]);
      setProducts(unwrapList(pRaw).map(productToUi));
      setCategories(unwrapList(cRaw));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [categoryFilter]);

  const save = async (
    p: UiProduct,
    opts: { autoTranslate?: boolean; translateSource?: TranslateLang },
  ) => {
    const payload = productToApi(p, opts);
    if (p.id && p.id !== "0") {
      await storeProductsApi.update(Number(p.id), payload);
    } else {
      await storeProductsApi.create(payload);
    }
    setEditing(null);
    void reload();
  };

  const remove = async (id: string) => {
    if (!confirm(t("products.confirmDelete"))) return;
    await storeProductsApi.remove(Number(id));
    void reload();
  };

  const emptyProduct = (): UiProduct => ({
    id: "0",
    name: emptyLocalizedString(),
    description: emptyLocalizedString(),
    shortDescription: emptyLocalizedString(),
    categoryLabel: emptyLocalizedString(),
    tags: [],
    priceUzs: 0,
    oldPriceUzs: null,
    categoryId: categories[0] ? String(categories[0].id) : null,
    image: null,
    brand: "",
    videoUrl: "",
    ageLabel: "",
    isActive: true,
    isFeatured: false,
    stock: 0,
  });

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.products")}
        subtitle={t("products.subtitleCount", { count: products.length })}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyProduct())}
          >
            <Plus className="h-4 w-4" /> {t("products.newTitle")}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && reload()}
                placeholder={t("products.searchPlaceholder")}
                className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>
            <select
              value={categoryFilter ?? ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            >
              <option value="">{t("products.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          {loading && (
            <div className="col-span-3 py-12 text-center text-text-muted">
              {t("common.loading")}
            </div>
          )}
          {!loading && products.length === 0 && (
            <div className="col-span-3 py-12 text-center text-text-muted">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
              {t("products.empty")}
            </div>
          )}
          {products.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              onEdit={() => setEditing(p)}
              onRemove={() => remove(p.id)}
            />
          ))}
        </div>
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function ProductCard({
  p,
  onEdit,
  onRemove,
}: {
  p: UiProduct;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { t } = useT();
  const name = p.name.uz || p.name.ru || p.name.en || "—";
  return (
    <div className="card overflow-hidden">
      <div className="h-36 bg-bg-input flex items-center justify-center">
        {p.image ? (
          <img src={p.image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-10 w-10 text-text-muted opacity-40" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-text-primary line-clamp-2">
            {name}
          </h3>
          <div className="flex gap-1">
            <button className="icon-btn h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[16px] font-bold text-text-primary">
            {p.priceUzs.toLocaleString("uz-UZ").replace(/,/g, " ")}
          </span>
          <span className="text-[11.5px] text-text-muted">so'm</span>
          {p.oldPriceUzs && (
            <span className="text-[11px] text-text-muted line-through">
              {p.oldPriceUzs.toLocaleString("uz-UZ").replace(/,/g, " ")}
            </span>
          )}
        </div>
        {p.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.tags.slice(0, 4).map((t, i) => (
              <span
                key={i}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                #{t.name}
              </span>
            ))}
            {p.tags.length > 4 && (
              <span className="text-[10px] text-text-muted">+{p.tags.length - 4}</span>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center gap-1.5">
          {p.isFeatured && (
            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-medium text-yellow-600">
              Tavsiya
            </span>
          )}
          <span
            className={
              "rounded-full px-2 py-0.5 text-[10px] font-medium " +
              (p.isActive
                ? "bg-status-resolved/15 text-status-resolved"
                : "bg-text-muted/15 text-text-muted")
            }
          >
            {p.isActive ? t("users.filter.active") : t("common.inactive")}
          </span>
          <span className="text-[10.5px] text-text-muted ml-auto">
            Stok: {p.stock}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductEditor({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: UiProduct;
  categories: AdminStoreCategory[];
  onClose: () => void;
  onSave: (
    p: UiProduct,
    opts: { autoTranslate?: boolean; translateSource?: TranslateLang },
  ) => void | Promise<void>;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState(product);
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translateSource, setTranslateSource] = useState<TranslateLang>("uz");
  const youtubeId = useMemo(() => parseYouTubeId(draft.videoUrl), [draft.videoUrl]);

  const filled = (v: string) => v && v.trim().length > 0;

  /** Mavjud uz/ru/en qiymatlardan tanlangan source tili eng to'liq bo'lganini tanlaydi. */
  const detectSource = (): TranslateLang => {
    const fields = [draft.name, draft.shortDescription, draft.description, draft.categoryLabel];
    const score: Record<TranslateLang, number> = { uz: 0, uz_cyrl: 0, ru: 0, en: 0 };
    fields.forEach((f) => {
      (["uz", "uz_cyrl", "ru", "en"] as TranslateLang[]).forEach((l) => {
        if (filled(f[l])) score[l] += f[l].length;
      });
    });
    const ordered = (Object.entries(score) as [TranslateLang, number][]).sort(
      (a, b) => b[1] - a[1],
    );
    return ordered[0]?.[1] > 0 ? ordered[0][0] : translateSource;
  };

  const translateAllFields = async () => {
    const source = detectSource();
    setTranslateSource(source);
    setTranslating(true);
    try {
      const next = { ...draft };
      const fields: (keyof Pick<
        UiProduct,
        "name" | "shortDescription" | "description" | "categoryLabel"
      >)[] = ["name", "shortDescription", "description", "categoryLabel"];
      for (const key of fields) {
        const base = (next[key][source] || "").trim();
        if (!base) continue;
        try {
          const result = await translateApi.all(base, source);
          next[key] = {
            ...next[key],
            ...((["uz", "uz_cyrl", "ru", "en"] as TranslateLang[]).reduce(
              (acc, l) => {
                if (l === source) return acc;
                if (!filled(next[key][l])) acc[l] = result.translations[l] || "";
                return acc;
              },
              {} as Record<TranslateLang, string>,
            )),
          };
        } catch (err) {
          console.warn("translate failed", key, err);
        }
      }
      setDraft(next);
    } finally {
      setTranslating(false);
    }
  };

  const onSaveClick = async (autoTranslate: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draft, {
        autoTranslate,
        translateSource: detectSource(),
      });
    } finally {
      setSaving(false);
    }
  };

  const canSave = filled(draft.name.uz) || filled(draft.name.ru) || filled(draft.name.en);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-bg shadow-2xl">
        <div className="sticky top-0 bg-bg/95 backdrop-blur border-b border-line px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h3 className="text-[17px] font-bold text-text-primary">
              {product.id !== "0" ? t("products.editTitle") : t("products.newTitle")}
            </h3>
            <p className="text-[12px] text-text-muted">
              Uz / Ru / En tillarida to'ldiring — yoki avtomatik tarjima qildiring
            </p>
          </div>
          <button onClick={onClose} className="icon-btn h-8 w-8">
            ×
          </button>
        </div>
        <div className="px-6 py-5 grid grid-cols-5 gap-5">
          {/* Left column — media */}
          <div className="col-span-2 space-y-4">
            <ImageUpload
              value={draft.image}
              onChange={(url) => setDraft({ ...draft, image: url })}
              folder="products"
              label="Mahsulot rasmi"
            />
            <div>
              <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
                YouTube video URL
              </div>
              <input
                value={draft.videoUrl}
                onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[12.5px] font-mono text-text-primary outline-none focus:border-primary"
              />
              {youtubeId && (
                <div className="mt-2 rounded-xl overflow-hidden border border-line bg-black">
                  <iframe
                    width="100%"
                    height="180"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="Video preview"
                    allowFullScreen
                  />
                </div>
              )}
              {!youtubeId && draft.videoUrl && (
                <div className="mt-1 text-[11px] text-amber-600">
                  YouTube havolasi noto'g'ri
                </div>
              )}
            </div>

            {/* Auto-translate panel */}
            <div className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-semibold text-text-secondary">
                  Avtomatik tarjima
                </div>
                <select
                  value={translateSource}
                  onChange={(e) => setTranslateSource(e.target.value as TranslateLang)}
                  className="rounded-md border border-line bg-bg-input px-2 py-1 text-[11px] outline-none"
                >
                  <option value="uz">🇺🇿 O'zbek</option>
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
              <button
                type="button"
                onClick={translateAllFields}
                disabled={translating}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-primary font-semibold px-3 py-2 text-[12px] hover:bg-primary/20 disabled:opacity-40"
              >
                {translating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Hamma maydonlarni tarjima qil
              </button>
              <p className="mt-1.5 text-[10.5px] text-text-muted leading-snug">
                Bosilganda nomi, qisqa va to'liq tavsif, kategoriya label —
                tanlangan tildan qolgan ikkitasiga avtomatik tarjima qilinadi.
                Bo'sh maydonlargina to'ldiriladi.
              </p>
            </div>
          </div>

          {/* Right column — details */}
          <div className="col-span-3 space-y-3">
            <MultilangInput
              label="Nomi"
              required
              value={draft.name}
              onChange={(v) => setDraft({ ...draft, name: v })}
              placeholder="Masalan: LEGO Education STEM kit"
            />
            <MultilangInput
              label="Qisqa tavsif"
              multiline
              rows={2}
              value={draft.shortDescription}
              onChange={(v) => setDraft({ ...draft, shortDescription: v })}
              placeholder="Bir-ikki gap..."
            />
            <MultilangInput
              label="To'liq tavsif"
              multiline
              rows={4}
              value={draft.description}
              onChange={(v) => setDraft({ ...draft, description: v })}
              placeholder="Mahsulot haqida batafsil... (uzun bo'lsa avtomatik chunklarga bo'linadi)"
            />
            <MultilangInput
              label="Kategoriya label (chip ustida ko'rinadi)"
              value={draft.categoryLabel}
              onChange={(v) => setDraft({ ...draft, categoryLabel: v })}
              placeholder="STEM O'YINCHOQ"
            />

            <TagsInput
              label="Teglar"
              value={draft.tags}
              onChange={(tags) => setDraft({ ...draft, tags })}
              placeholder="stem, lego, 6yosh"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
                  Narx (so'm)
                </div>
                <input
                  type="number"
                  value={draft.priceUzs}
                  onChange={(e) =>
                    setDraft({ ...draft, priceUzs: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] font-semibold text-text-primary outline-none focus:border-primary"
                />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
                  Eski narx (ixtiyoriy)
                </div>
                <input
                  type="number"
                  value={draft.oldPriceUzs ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      oldPriceUzs: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
                  Kategoriya
                </div>
                <select
                  value={draft.categoryId ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, categoryId: e.target.value || null })
                  }
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
                >
                  <option value="">— tanlang —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
                  Yosh chegarasi
                </div>
                <input
                  value={draft.ageLabel}
                  onChange={(e) =>
                    setDraft({ ...draft, ageLabel: e.target.value })
                  }
                  placeholder="6+ yosh"
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
                  Brand
                </div>
                <input
                  value={draft.brand}
                  onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
                />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
                  Stok soni
                </div>
                <input
                  type="number"
                  value={draft.stock}
                  onChange={(e) =>
                    setDraft({ ...draft, stock: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-5 pt-2">
              <label className="flex items-center gap-2 text-[12.5px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) =>
                    setDraft({ ...draft, isActive: e.target.checked })
                  }
                />
                Faol
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.isFeatured}
                  onChange={(e) =>
                    setDraft({ ...draft, isFeatured: e.target.checked })
                  }
                />
                Tavsiya etiladi
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-bg/95 backdrop-blur border-t border-line px-6 py-3 flex justify-end gap-2 rounded-b-3xl">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            Bekor qilish
          </button>
          <button
            className="btn-secondary text-[12.5px] inline-flex items-center gap-1"
            onClick={() => onSaveClick(true)}
            disabled={!canSave || saving}
            title="Saqlashda backend bo'sh maydonlarni tarjima qilib to'ldiradi"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Tarjima bilan saqlash
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => onSaveClick(false)}
            disabled={!canSave || saving}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
