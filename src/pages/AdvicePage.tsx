import { useEffect, useState } from "react";
import { Plus, BookOpen, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import {
  blogPostsApi,
  blogCategoriesApi,
  unwrapList,
  type AdminBlogCategory,
} from "../lib/resources";
import { adviceToApi, adviceToUi, type UiAdvice } from "../lib/adapters";

export function AdvicePage() {
  const { t } = useT();
  const [posts, setPosts] = useState<UiAdvice[]>([]);
  const [categories, setCategories] = useState<AdminBlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<UiAdvice | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [pRaw, cRaw] = await Promise.all([
        blogPostsApi.list({
          q: search || undefined,
          category_id: categoryFilter || undefined,
        }),
        blogCategoriesApi.list(),
      ]);
      setPosts(unwrapList(pRaw).map(adviceToUi));
      setCategories(unwrapList(cRaw));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [categoryFilter]);

  const save = async (p: UiAdvice) => {
    const payload = adviceToApi(p);
    if (p.id && p.id !== "0") {
      await blogPostsApi.update(Number(p.id), payload);
    } else {
      await blogPostsApi.create(payload);
    }
    setEditing(null);
    void reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Maqolani o'chirasizmi?")) return;
    await blogPostsApi.remove(Number(id));
    void reload();
  };

  const emptyAdvice = (): UiAdvice => ({
    id: "0",
    title: "",
    excerpt: "",
    body: "",
    image: null,
    categoryId: categories[0] ? String(categories[0].id) : null,
    type: "",
    readMinutes: 5,
    isActive: true,
    isFeatured: false,
  });

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.advice")}
        subtitle={`${posts.length} ta maqola`}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyAdvice())}
          >
            <Plus className="h-4 w-4" /> Yangi maqola
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

        <div className="mt-4 grid gap-3">
          {loading && (
            <div className="card p-12 text-center text-text-muted">
              Yuklanmoqda...
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="card p-12 text-center text-text-muted">
              <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Maqolalar yo'q
            </div>
          )}
          {posts.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-bg-input flex items-center justify-center">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <BookOpen className="h-6 w-6 text-text-muted opacity-40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold text-text-primary">
                      {p.title || "—"}
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
                  <p className="mt-1 text-[12px] text-text-secondary line-clamp-2">
                    {p.excerpt || p.body || "—"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-text-muted">
                    <span>{p.readMinutes} daqiqa</span>
                    {p.isFeatured && (
                      <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-yellow-600">
                        Tavsiya
                      </span>
                    )}
                    <span
                      className={
                        "rounded-full px-2 py-0.5 " +
                        (p.isActive
                          ? "bg-status-resolved/15 text-status-resolved"
                          : "bg-text-muted/15 text-text-muted")
                      }
                    >
                      {p.isActive ? "Faol" : "Nofaol"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <AdviceEditor
          post={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function AdviceEditor({
  post,
  categories,
  onClose,
  onSave,
}: {
  post: UiAdvice;
  categories: AdminBlogCategory[];
  onClose: () => void;
  onSave: (p: UiAdvice) => void;
}) {
  const [draft, setDraft] = useState(post);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-bg p-5">
        <h3 className="text-[16px] font-semibold text-text-primary mb-4">
          {post.id !== "0" ? "Maqola tahrirlash" : "Yangi maqola"}
        </h3>
        <div className="space-y-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Sarlavha"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <textarea
            value={draft.excerpt}
            onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
            placeholder="Qisqacha (excerpt)"
            rows={2}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="To'liq matn"
            rows={8}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <select
            value={draft.categoryId ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, categoryId: e.target.value || null })
            }
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          >
            <option value="">Kategoriya</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={draft.readMinutes}
              onChange={(e) =>
                setDraft({ ...draft, readMinutes: Number(e.target.value) })
              }
              placeholder="O'qish daqiqalari"
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
            <input
              value={draft.image ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, image: e.target.value || null })
              }
              placeholder="Rasm URL"
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
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
