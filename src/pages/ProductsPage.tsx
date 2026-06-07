import { useEffect, useState } from "react";
import { Plus, Package, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import {
  storeProductsApi,
  storeCategoriesApi,
  unwrapList,
  type AdminStoreCategory,
} from "../lib/resources";
import { productToApi, productToUi, type UiProduct } from "../lib/adapters";

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

  const save = async (p: UiProduct) => {
    const payload = productToApi(p);
    if (p.id && p.id !== "0") {
      await storeProductsApi.update(Number(p.id), payload);
    } else {
      await storeProductsApi.create(payload);
    }
    setEditing(null);
    void reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Mahsulotni o'chirasizmi?")) return;
    await storeProductsApi.remove(Number(id));
    void reload();
  };

  const emptyProduct = (): UiProduct => ({
    id: "0",
    name: "",
    description: "",
    priceUzs: 0,
    oldPriceUzs: null,
    categoryId: categories[0] ? String(categories[0].id) : null,
    image: null,
    type: "",
    brand: "",
    isActive: true,
    isFeatured: false,
    stock: 0,
  });

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.products")}
        subtitle={`${products.length} ta mahsulot`}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyProduct())}
          >
            <Plus className="h-4 w-4" /> Yangi mahsulot
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
                placeholder="Qidirish va Enter..."
                className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>
            <select
              value={categoryFilter ?? ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            >
              <option value="">Barcha kategoriyalar</option>
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
              Yuklanmoqda...
            </div>
          )}
          {!loading && products.length === 0 && (
            <div className="col-span-3 py-12 text-center text-text-muted">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Mahsulotlar yo'q
            </div>
          )}
          {products.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="h-36 bg-bg-input flex items-center justify-center">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-10 w-10 text-text-muted opacity-40" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-text-primary line-clamp-2">
                    {p.name || "—"}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      className="icon-btn h-7 w-7"
                      onClick={() => setEditing(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                      onClick={() => remove(p.id)}
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
                    {p.isActive ? "Faol" : "Nofaol"}
                  </span>
                  <span className="text-[10.5px] text-text-muted ml-auto">
                    Stok: {p.stock}
                  </span>
                </div>
              </div>
            </div>
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

function ProductEditor({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: UiProduct;
  categories: AdminStoreCategory[];
  onClose: () => void;
  onSave: (p: UiProduct) => void;
}) {
  const [draft, setDraft] = useState(product);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-bg p-5">
        <h3 className="text-[16px] font-semibold text-text-primary mb-4">
          {product.id !== "0" ? "Mahsulot tahrirlash" : "Yangi mahsulot"}
        </h3>
        <div className="space-y-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nom"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <textarea
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="Tavsif"
            rows={4}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={draft.priceUzs}
              onChange={(e) =>
                setDraft({ ...draft, priceUzs: Number(e.target.value) })
              }
              placeholder="Narx"
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
            <input
              type="number"
              value={draft.oldPriceUzs ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  oldPriceUzs: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Eski narx (chegirma)"
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
          <select
            value={draft.categoryId ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, categoryId: e.target.value || null })
            }
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          >
            <option value="">Kategoriya tanlash</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={draft.brand}
              onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              placeholder="Brand"
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
            <input
              type="number"
              value={draft.stock}
              onChange={(e) =>
                setDraft({ ...draft, stock: Number(e.target.value) })
              }
              placeholder="Stok"
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
          <input
            value={draft.image ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, image: e.target.value || null })
            }
            placeholder="Rasm URL"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) =>
                  setDraft({ ...draft, isActive: e.target.checked })
                }
              />
              Faol
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
              <input
                type="checkbox"
                checked={draft.isFeatured}
                onChange={(e) =>
                  setDraft({ ...draft, isFeatured: e.target.checked })
                }
              />
              Tavsiya
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            Bekor
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
