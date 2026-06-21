import { useEffect, useRef, useState } from "react";
import { Plus, Package, Pencil, Trash2, Search, Sparkles, Loader2, X, ImagePlus, Video, Smartphone, Clock } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import { MultilangInput } from "../components/MultilangInput";
import { TagsInput } from "../components/TagsInput";
import { ProductPreview } from "../components/ProductPreview";
import { useT } from "../lib/i18n";
import { uploadMedia } from "../lib/api";
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
    images: [],
    brand: "",
    videoUrls: [],
    ageLabel: "",
    isActive: true,
    isFeatured: false,
    stock: 0,
    dealEndsAt: null,
    deliveryInfo: emptyLocalizedString(),
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
          onCategoryCreated={async (c) => {
            setCategories((prev) => [...prev, c]);
          }}
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
  onCategoryCreated,
}: {
  product: UiProduct;
  categories: AdminStoreCategory[];
  onClose: () => void;
  onSave: (
    p: UiProduct,
    opts: { autoTranslate?: boolean; translateSource?: TranslateLang },
  ) => void | Promise<void>;
  onCategoryCreated: (c: AdminStoreCategory) => void;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState(product);
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translateSource, setTranslateSource] = useState<TranslateLang>("uz");
  const [showCategoryAdd, setShowCategoryAdd] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Number input helper: 0/empty → bo'sh placeholder, raqamni butunlay
  // o'chirib bo'ladigan qilish uchun.
  const numVal = (n: number | null | undefined): string =>
    n === null || n === undefined || n === 0 ? "" : String(n);
  const parseNum = (s: string): number => (s.trim() === "" ? 0 : Number(s) || 0);

  const addVideo = () =>
    setDraft({ ...draft, videoUrls: [...draft.videoUrls, ""] });
  const removeVideo = (i: number) =>
    setDraft({ ...draft, videoUrls: draft.videoUrls.filter((_, x) => x !== i) });
  const setVideo = (i: number, v: string) =>
    setDraft({
      ...draft,
      videoUrls: draft.videoUrls.map((u, x) => (x === i ? v : u)),
    });

  const onGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        try {
          const r = await uploadMedia(file, "products");
          if (r.url) uploaded.push(r.url);
        } catch (e) {
          console.error("gallery upload failed", e);
        }
      }
      if (uploaded.length > 0) {
        setDraft({ ...draft, images: [...draft.images, ...uploaded] });
      }
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const removeGalleryImage = (i: number) =>
    setDraft({ ...draft, images: draft.images.filter((_, x) => x !== i) });

  const filled = (v: string) => v && v.trim().length > 0;

  /** Mavjud uz/ru/en qiymatlardan tanlangan source tili eng to'liq bo'lganini tanlaydi. */
  const detectSource = (): TranslateLang => {
    const fields = [
      draft.name,
      draft.shortDescription,
      draft.description,
      draft.categoryLabel,
      draft.deliveryInfo,
    ];
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
        "name" | "shortDescription" | "description" | "categoryLabel" | "deliveryInfo"
      >)[] = ["name", "shortDescription", "description", "categoryLabel", "deliveryInfo"];
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

  const hasName =
    filled(draft.name.uz) || filled(draft.name.ru) || filled(draft.name.en);
  // Category is required — without it the product won't surface anywhere in the
  // parent store's category-filtered lists, so silently saving with no category
  // creates an "orphan" product. Block the save buttons until one is chosen.
  const hasCategory = Boolean(draft.categoryId);
  const canSave = hasName && hasCategory;

  const [showMobilePreview, setShowMobilePreview] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[92vh] w-full max-w-[1180px] overflow-hidden rounded-3xl bg-bg shadow-2xl">
        {/* Form column */}
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg px-6 py-4 rounded-tl-3xl">
            <div>
              <h3 className="text-[17px] font-bold text-text-primary">
                {product.id !== "0" ? t("products.editTitle") : t("products.newTitle")}
              </h3>
              <p className="text-[12px] text-text-muted">
                Uz / Ru / En tillarida to'ldiring — yoki avtomatik tarjima qildiring
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile/narrow screens: preview toggle */}
              <button
                type="button"
                onClick={() => setShowMobilePreview((v) => !v)}
                className="inline-flex lg:hidden items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-primary/20"
              >
                <Smartphone className="h-3.5 w-3.5" />
                {showMobilePreview ? "Yopish" : "Preview"}
              </button>
              <button onClick={onClose} className="icon-btn h-8 w-8">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-6 py-5 grid grid-cols-5 gap-5">
          {/* Left column — media */}
          <div className="col-span-2 space-y-4">
            <ImageUpload
              value={draft.image}
              onChange={(url) => setDraft({ ...draft, image: url })}
              folder="products"
              label={t("products.gallery.cover")}
            />

            {/* Qo'shimcha rasmlar gallery */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[12px] font-semibold text-text-secondary">
                  {t("products.gallery.title")} ({draft.images.length})
                </div>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={galleryUploading}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium px-2 py-1 hover:bg-primary/20 disabled:opacity-50"
                >
                  {galleryUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3 w-3" />
                  )}
                  {t("products.gallery.add")}
                </button>
              </div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => onGalleryFiles(e.target.files)}
                className="hidden"
              />
              {draft.images.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line bg-bg-input/50 px-3 py-4 text-center text-[11.5px] text-text-muted">
                  {t("products.gallery.empty")}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {draft.images.map((url, i) => (
                    <div
                      key={i}
                      className="relative group rounded-lg overflow-hidden border border-line bg-bg-input aspect-square"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        title={t("common.delete")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bir nechta YouTube video URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-red-500" />
                  {t("products.videos.title")} ({draft.videoUrls.length})
                </div>
                <button
                  type="button"
                  onClick={addVideo}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium px-2 py-1 hover:bg-primary/20"
                >
                  <Plus className="h-3 w-3" /> {t("products.videos.add")}
                </button>
              </div>
              {draft.videoUrls.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line bg-bg-input/50 px-3 py-3 text-center text-[11.5px] text-text-muted">
                  {t("products.videos.empty")}
                </div>
              ) : (
                <div className="space-y-2">
                  {draft.videoUrls.map((url, i) => {
                    const id = parseYouTubeId(url);
                    return (
                      <div key={i} className="rounded-lg border border-line bg-bg-input p-2 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            value={url}
                            onChange={(e) => setVideo(i, e.target.value)}
                            placeholder={t("products.videos.placeholder")}
                            className="flex-1 rounded-md border border-line bg-bg px-2 py-1.5 text-[11.5px] font-mono outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => removeVideo(i)}
                            className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                            title={t("common.delete")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {id ? (
                          <div className="rounded-md overflow-hidden border border-line bg-black">
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${id}`}
                              title={`Video ${i + 1}`}
                              allowFullScreen
                            />
                          </div>
                        ) : url ? (
                          <div className="text-[10.5px] text-amber-600">
                            {t("products.videos.invalid")}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
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
                  {t("products.field.priceLabel")}
                </div>
                <input
                  type="number"
                  min={0}
                  value={numVal(draft.priceUzs)}
                  onChange={(e) =>
                    setDraft({ ...draft, priceUzs: parseNum(e.target.value) })
                  }
                  placeholder="50000"
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] font-semibold text-text-primary outline-none focus:border-primary"
                />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-text-secondary mb-1.5">
                  {t("products.field.oldPriceLabel")}
                </div>
                <input
                  type="number"
                  min={0}
                  value={draft.oldPriceUzs == null || draft.oldPriceUzs === 0 ? "" : String(draft.oldPriceUzs)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      oldPriceUzs: e.target.value.trim() === "" ? null : Number(e.target.value) || null,
                    })
                  }
                  placeholder="—"
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[12px] font-semibold text-text-secondary">
                    Kategoriya
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCategoryAdd(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary text-[10.5px] font-medium px-1.5 py-0.5 hover:bg-primary/20"
                  >
                    <Plus className="h-2.5 w-2.5" /> {t("products.category.addNew")}
                  </button>
                </div>
                <select
                  value={draft.categoryId ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, categoryId: e.target.value || null })
                  }
                  className={
                    "w-full rounded-lg border bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary " +
                    (!draft.categoryId
                      ? "border-red-500/60"
                      : "border-line")
                  }
                >
                  <option value="">
                    {categories.length === 0
                      ? t("products.category.empty")
                      : "— tanlang —"}
                  </option>
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
                  {t("products.field.stockLabel")}
                </div>
                <input
                  type="number"
                  min={0}
                  value={numVal(draft.stock)}
                  onChange={(e) =>
                    setDraft({ ...draft, stock: parseNum(e.target.value) })
                  }
                  placeholder="0"
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

            {/* Chegirma muddati */}
            <DealEndsAtField
              value={draft.dealEndsAt}
              onChange={(v) => setDraft({ ...draft, dealEndsAt: v })}
            />

            {/* Yetkazib berish — yagona multilang matn (auto-tarjima qo'llab-quvvatlanadi) */}
            <MultilangInput
              label={t("products.delivery.title")}
              multiline
              rows={3}
              value={draft.deliveryInfo}
              onChange={(v) => setDraft({ ...draft, deliveryInfo: v })}
              placeholder={t("products.delivery.placeholder")}
            />
          </div>
        </div>

          </div>
          <div className="sticky bottom-0 z-20 flex justify-end gap-2 border-t border-line bg-bg px-6 py-3 rounded-bl-3xl">
            <button className="btn-secondary text-[12.5px]" onClick={onClose}>
              Bekor qilish
            </button>
            <button
              className="btn-secondary text-[12.5px] inline-flex items-center gap-1"
              onClick={() => onSaveClick(true)}
              disabled={!canSave || saving}
              title={
                !hasCategory
                  ? "Avval kategoriyani tanlang"
                  : "Saqlashda backend bo'sh maydonlarni tarjima qilib to'ldiradi"
              }
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
              title={!hasCategory ? "Avval kategoriyani tanlang" : undefined}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Saqlash"}
            </button>
          </div>
        </div>

        {/* Preview column — desktop only */}
        <div className="hidden lg:flex w-[400px] shrink-0 flex-col border-l border-line bg-bg-input/40">
          <div className="border-b border-line px-5 py-3 flex items-center gap-2 bg-bg">
            <Smartphone className="h-4 w-4 text-primary" />
            <div className="text-[13px] font-semibold text-text-primary">
              Jojo ilovasidagi ko'rinish
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
            <ProductPreview product={draft} categories={categories} />
          </div>
        </div>
      </div>

      {/* Mobile preview overlay */}
      {showMobilePreview && (
        <div
          className="lg:hidden fixed inset-0 z-[55] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowMobilePreview(false)}
        >
          <div
            className="w-full max-w-md max-h-[92vh] overflow-y-auto scrollbar-thin rounded-3xl bg-bg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <div className="text-[14px] font-semibold text-text-primary">
                  Jojo ilovasidagi ko'rinish
                </div>
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="icon-btn h-8 w-8"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ProductPreview product={draft} categories={categories} />
          </div>
        </div>
      )}

      {showCategoryAdd && (
        <CategoryQuickAddModal
          onClose={() => setShowCategoryAdd(false)}
          onCreated={(c) => {
            onCategoryCreated(c);
            setDraft({ ...draft, categoryId: String(c.id) });
            setShowCategoryAdd(false);
          }}
        />
      )}
    </div>
  );
}

function CategoryQuickAddModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: AdminStoreCategory) => void;
}) {
  const { t } = useT();
  const [name, setName] = useState({ uz: "", ru: "", en: "" });
  const [activeLang, setActiveLang] = useState<"uz" | "ru" | "en">("uz");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Synchronous guard: state-based `busy` updates asynchronously, so a fast
  // double-click (or Enter held down) fires submit() twice before React has
  // re-rendered with `disabled`. The ref blocks duplicate POSTs immediately.
  const inFlightRef = useRef(false);

  const submit = async (autoTranslate: boolean = false) => {
    if (inFlightRef.current) return;
    // Source manzilini tanlash — eng to'liq tildan boshqalariga tarjima qilamiz.
    const sources: Array<["uz" | "ru" | "en", string]> = [
      ["uz", name.uz.trim()],
      ["ru", name.ru.trim()],
      ["en", name.en.trim()],
    ];
    const ordered = [...sources].sort((a, b) => b[1].length - a[1].length);
    if (!ordered[0][1]) {
      setError(t("products.category.nameRequired"));
      return;
    }
    const source = ordered[0][0];
    inFlightRef.current = true;
    setError(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.uz.trim(),
        name_ru: name.ru.trim() || undefined,
        name_en: name.en.trim() || undefined,
        is_active: true,
      };
      if (autoTranslate) {
        payload.auto_translate = true;
        payload.translate_source = source;
      }
      const created = await storeCategoriesApi.create(payload);
      // onCreated already calls onClose (via the parent's setShowCategoryAdd
      // false in onCategoryCreated callback). Do NOT setBusy(false) afterwards
      // because the component is unmounted — React would warn, and a stale
      // `inFlightRef` reset doesn't matter once disposed.
      onCreated(created);
    } catch (e) {
      setError((e as { message?: string }).message || "Error");
      inFlightRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-bg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15.5px] font-semibold text-text-primary">
            {t("products.category.quickAdd")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-1 rounded-lg border border-line bg-bg-input p-1">
          {(["uz", "ru", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setActiveLang(l)}
              className={
                "flex-1 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors " +
                (activeLang === l
                  ? "bg-primary/15 text-primary"
                  : "text-text-secondary hover:text-text-primary")
              }
            >
              {t(`products.category.langTab.${l}`)}
            </button>
          ))}
        </div>

        <input
          value={name[activeLang]}
          onChange={(e) =>
            setName({ ...name, [activeLang]: e.target.value })
          }
          placeholder={t("products.category.namePlaceholder")}
          className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[13.5px] text-text-primary outline-none focus:border-primary"
        />

        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]" disabled={busy}>
            {t("premium.cancel")}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={busy}
            className="btn-secondary text-[12.5px] inline-flex items-center gap-1 disabled:opacity-50"
            title="Saqlashda backend bo'sh tillarni tarjima qilib to'ldiradi"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {t("categories.saveWithTranslate") || "Tarjima bilan"}
          </button>
          <button
            onClick={() => submit(false)}
            disabled={busy}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? t("products.category.creating") : t("products.category.create")}
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

// ============================================================================
// Chegirma muddati va Yetkazib berish sektsiyalari
// ============================================================================

/** ISO datetime ↔ HTML `datetime-local` (YYYY-MM-DDTHH:mm) o'rtasidagi konvert. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  } catch {
    return "";
  }
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  try {
    const d = new Date(local);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function DealEndsAtField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const { t } = useT();
  const presets: Array<{ hours: number; label: string }> = [
    { hours: 1, label: t("products.deal.preset.1h") },
    { hours: 6, label: t("products.deal.preset.6h") },
    { hours: 24, label: t("products.deal.preset.24h") },
    { hours: 72, label: t("products.deal.preset.3d") },
    { hours: 168, label: t("products.deal.preset.7d") },
  ];

  const setPreset = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    onChange(d.toISOString());
  };

  // Live ko'rinish — qancha vaqt qoldi.
  const remaining = (() => {
    if (!value) return null;
    const target = new Date(value).getTime();
    if (isNaN(target)) return null;
    const diff = target - Date.now();
    if (diff <= 0) return { expired: true } as const;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    return { expired: false, days, hours, mins } as const;
  })();

  return (
    <div className="rounded-xl border border-line bg-bg-input/40 p-3 mt-2">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          {t("products.deal.title")}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10.5px] font-medium text-text-muted hover:text-red-500"
          >
            {t("products.deal.clear")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {presets.map((p) => (
          <button
            key={p.hours}
            type="button"
            onClick={() => setPreset(p.hours)}
            className="rounded-md border border-line bg-bg-input px-2.5 py-1 text-[11.5px] font-medium text-text-secondary hover:border-amber-500 hover:text-amber-600"
          >
            +{p.label}
          </button>
        ))}
      </div>

      <input
        type="datetime-local"
        value={toLocalInput(value)}
        onChange={(e) => onChange(fromLocalInput(e.target.value))}
        className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[12.5px] outline-none focus:border-primary"
      />

      {remaining && (
        <div className="mt-2 text-[11px]">
          {remaining.expired ? (
            <span className="text-red-500 font-medium">
              {t("products.deal.expired")}
            </span>
          ) : (
            <span className="text-emerald-600 font-medium">
              {t("products.deal.remaining", {
                d: remaining.days,
                h: remaining.hours,
                m: remaining.mins,
              })}
            </span>
          )}
        </div>
      )}
      {!value && (
        <div className="mt-1 text-[10.5px] text-text-muted">
          {t("products.deal.hint")}
        </div>
      )}
    </div>
  );
}

