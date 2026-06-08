import { useEffect, useState } from "react";
import { Plus, FolderTree, Pencil, Trash2, Package, BookOpen } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import {
  storeCategoriesApi,
  blogCategoriesApi,
  unwrapList,
  type AdminStoreCategory,
  type AdminBlogCategory,
} from "../lib/resources";

type Tab = "store" | "blog";

interface CategoryDraft {
  id?: number;
  name: string;
  slug?: string;
  icon?: string | null;
  order?: number;
  is_active?: boolean;
}

export function CategoriesPage() {
  const [tab, setTab] = useState<Tab>("store");
  const [storeCats, setStoreCats] = useState<AdminStoreCategory[]>([]);
  const [blogCats, setBlogCats] = useState<AdminBlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryDraft | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      if (tab === "store") {
        const r = await storeCategoriesApi.list();
        setStoreCats(unwrapList(r));
      } else {
        const r = await blogCategoriesApi.list();
        setBlogCats(unwrapList(r));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [tab]);

  const save = async (d: CategoryDraft) => {
    const payload: Record<string, unknown> = {
      name: d.name,
      slug: d.slug || undefined,
      order: d.order ?? 0,
      is_active: d.is_active ?? true,
    };
    if (tab === "store") payload.icon = d.icon || "";
    if (d.id) {
      if (tab === "store") await storeCategoriesApi.update(d.id, payload);
      else await blogCategoriesApi.update(d.id, payload);
    } else {
      if (tab === "store") await storeCategoriesApi.create(payload);
      else await blogCategoriesApi.create(payload);
    }
    setEditing(null);
    void reload();
  };

  const remove = async (id: number) => {
    if (!confirm("Kategoriyani o'chirasizmi?")) return;
    try {
      if (tab === "store") await storeCategoriesApi.remove(id);
      else await blogCategoriesApi.remove(id);
      void reload();
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    }
  };

  const items: CategoryDraft[] =
    tab === "store"
      ? storeCats.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          order: c.order,
          is_active: c.is_active,
        }))
      : blogCats.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          order: c.order,
          is_active: c.is_active,
        }));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Kategoriyalar"
        subtitle={`${items.length} ta kategoriya`}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() =>
              setEditing({
                name: "",
                slug: "",
                icon: "",
                order: items.length,
                is_active: true,
              })
            }
          >
            <Plus className="h-4 w-4" /> Yangi kategoriya
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card p-2 inline-flex gap-1">
          <button
            onClick={() => setTab("store")}
            className={
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium " +
              (tab === "store"
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-bg-hover")
            }
          >
            <Package className="h-4 w-4" /> Do'kon
          </button>
          <button
            onClick={() => setTab("blog")}
            className={
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium " +
              (tab === "blog"
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-bg-hover")
            }
          >
            <BookOpen className="h-4 w-4" /> Maslahatlar
          </button>
        </div>

        <div className="card mt-4 overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3 w-16">№</th>
                <th className="px-4 py-3">Nomi</th>
                <th className="px-4 py-3">Slug</th>
                {tab === "store" && <th className="px-4 py-3">Belgi</th>}
                <th className="px-4 py-3 w-24">Tartib</th>
                <th className="px-4 py-3 w-24">Holat</th>
                <th className="px-4 py-3 w-28 text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <FolderTree className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Kategoriyalar yo'q
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="border-b border-line/50 hover:bg-bg-hover">
                  <td className="px-4 py-3 font-mono text-[11.5px] text-text-muted">
                    #{c.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-text-secondary">
                    {c.slug || "—"}
                  </td>
                  {tab === "store" && (
                    <td className="px-4 py-3 text-text-secondary">
                      {c.icon || "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-text-secondary">{c.order ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[10.5px] font-medium " +
                        (c.is_active
                          ? "bg-status-resolved/15 text-status-resolved"
                          : "bg-text-muted/15 text-text-muted")
                      }
                    >
                      {c.is_active ? "Faol" : "Nofaol"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="icon-btn h-7 w-7"
                      onClick={() => setEditing(c)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked ml-1"
                      onClick={() => c.id && remove(c.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <CategoryEditor
          showIcon={tab === "store"}
          draft={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function CategoryEditor({
  draft,
  showIcon,
  onClose,
  onSave,
}: {
  draft: CategoryDraft;
  showIcon: boolean;
  onClose: () => void;
  onSave: (d: CategoryDraft) => void;
}) {
  const [d, setD] = useState(draft);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg p-5">
        <h3 className="text-[16px] font-semibold text-text-primary mb-4">
          {draft.id ? "Kategoriya tahrirlash" : "Yangi kategoriya"}
        </h3>
        <div className="space-y-3">
          <input
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            placeholder="Nom"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <input
            value={d.slug ?? ""}
            onChange={(e) => setD({ ...d, slug: e.target.value })}
            placeholder="Slug (ixtiyoriy)"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] font-mono text-text-primary outline-none focus:border-primary"
          />
          {showIcon && (
            <ImageUpload
              value={d.icon ?? null}
              onChange={(url) => setD({ ...d, icon: url })}
              folder="categories"
              label="Kategoriya rasmi (ixtiyoriy)"
            />
          )}
          <input
            type="number"
            value={d.order ?? 0}
            onChange={(e) => setD({ ...d, order: Number(e.target.value) })}
            placeholder="Tartib"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_active ?? true}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            Faol
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            Bekor
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => onSave(d)}
            disabled={!d.name.trim()}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
