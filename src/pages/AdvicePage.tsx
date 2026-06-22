import { useEffect, useState } from "react";
import { Plus, BookOpen, Pencil, Trash2, Search, Sparkles, Loader2, X } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import { MultilangInput } from "../components/MultilangInput";
import { useT } from "../lib/i18n";
import {
  blogPostsApi,
  blogCategoriesApi,
  translateApi,
  unwrapList,
  type AdminBlogCategory,
  type TranslateLang,
} from "../lib/resources";
import {
  adviceToApi,
  adviceToUi,
  emptyUiAdvice,
  type UiAdvice,
} from "../lib/adapters";
import { pickLocalized } from "../types/locale";

export function AdvicePage() {
  const { t, lang } = useT();
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

  const save = async (
    p: UiAdvice,
    opts: { autoTranslate?: boolean; translateSource?: TranslateLang } = {},
  ) => {
    const payload = adviceToApi(p) as Record<string, unknown>;
    if (opts.autoTranslate) {
      payload.auto_translate = true;
      payload.translate_source = opts.translateSource || "uz";
    }
    if (p.id && p.id !== "0") {
      await blogPostsApi.update(Number(p.id), payload);
    } else {
      await blogPostsApi.create(payload);
    }
    setEditing(null);
    void reload();
  };

  const remove = async (id: string) => {
    if (!confirm(t("advice.confirmDelete"))) return;
    await blogPostsApi.remove(Number(id));
    void reload();
  };

  const emptyAdvice = (): UiAdvice => ({
    id: "0",
    ...emptyUiAdvice(),
    image: null,
    videoUrl: "",
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
        subtitle={t("advice.subtitleCount", { count: posts.length })}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyAdvice())}
          >
            <Plus className="h-4 w-4" /> {t("advice.newButton")}
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
                placeholder={t("advice.searchPlaceholder")}
                className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>
            <select
              value={categoryFilter ?? ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            >
              <option value="">{t("advice.allCategories")}</option>
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
              {t("common.loading")}
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="card p-12 text-center text-text-muted">
              <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-40" />
              {t("advice.empty")}
            </div>
          )}
          {posts.map((p) => {
            const previewTitle = pickLocalized(p.title, lang);
            const previewExcerpt = pickLocalized(p.excerpt, lang);
            const previewBody = pickLocalized(p.body, lang);
            return (
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
                      {previewTitle || "—"}
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
                    {previewExcerpt || previewBody || "—"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-text-muted">
                    <span>{t("advice.readMinutes", { n: p.readMinutes ?? 0 })}</span>
                    {p.videoUrl && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-red-500">
                        ▶ YouTube
                      </span>
                    )}
                    {p.isFeatured && (
                      <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-yellow-600">
                        {t("advice.featured")}
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
                      {p.isActive ? t("users.filter.active") : t("common.inactive")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
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
  onSave: (
    p: UiAdvice,
    opts?: { autoTranslate?: boolean; translateSource?: TranslateLang },
  ) => void | Promise<void>;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState(post);
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);

  const filled = (v: string) => !!v && v.trim().length > 0;

  /** Eng to'lgan tildan boshqalarni tarjima qilish manbasini tanlash. */
  const detectSource = (): TranslateLang => {
    const fields = [draft.title, draft.excerpt, draft.body];
    const score: Record<TranslateLang, number> = { uz: 0, uz_cyrl: 0, ru: 0, en: 0 };
    fields.forEach((f) => {
      (["uz", "uz_cyrl", "ru", "en"] as TranslateLang[]).forEach((l) => {
        if (filled(f[l])) score[l] += f[l].length;
      });
    });
    const ordered = (Object.entries(score) as [TranslateLang, number][]).sort(
      (a, b) => b[1] - a[1],
    );
    return ordered[0]?.[1] > 0 ? ordered[0][0] : "uz";
  };

  /** Frontend translate API — title/excerpt/body uchun bo'sh tillarni to'ldiradi. */
  const translateAllFields = async () => {
    if (translating) return;
    const source = detectSource();
    setTranslating(true);
    try {
      const next = { ...draft };
      const fields: (keyof Pick<UiAdvice, "title" | "excerpt" | "body">)[] = [
        "title",
        "excerpt",
        "body",
      ];
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

  const handleSave = async (autoTranslate: boolean) => {
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

  const canSave = filled(draft.title.uz) || filled(draft.title.ru) || filled(draft.title.en);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin rounded-2xl bg-bg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold text-text-primary">
              {post.id !== "0" ? t("advice.editTitle") : t("advice.newTitle")}
            </h3>
            <p className="mt-0.5 text-[11.5px] text-text-muted">
              {t("advice.editSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={translateAllFields}
              disabled={translating || !canSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-primary/20 disabled:opacity-40"
              title={t("advice.translateAllHint")}
            >
              {translating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {t("advice.translateAll")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn h-7 w-7"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <MultilangInput
            label={t("advice.field.title")}
            placeholder={t("advice.field.titlePh")}
            value={draft.title}
            onChange={(v) => setDraft({ ...draft, title: v })}
            required
          />
          <MultilangInput
            label={t("advice.field.excerpt")}
            placeholder={t("advice.field.excerptPh")}
            value={draft.excerpt}
            onChange={(v) => setDraft({ ...draft, excerpt: v })}
            multiline
            rows={2}
          />
          <MultilangInput
            label={t("advice.field.body")}
            placeholder={t("advice.field.bodyPh")}
            value={draft.body}
            onChange={(v) => setDraft({ ...draft, body: v })}
            multiline
            rows={8}
          />
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("advice.field.category")}
            </label>
            <select
              value={draft.categoryId ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, categoryId: e.target.value || null })
              }
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            >
              <option value="">{t("advice.field.categoryPh")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
                {t("advice.field.readMinutes")}
              </label>
              <input
                type="number"
                min={1}
                value={draft.readMinutes}
                onChange={(e) =>
                  setDraft({ ...draft, readMinutes: Number(e.target.value) })
                }
                placeholder={t("advice.field.readMinutesPh")}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>
            <div className="col-span-2">
              <ImageUpload
                value={draft.image}
                onChange={(url) => setDraft({ ...draft, image: url })}
                folder="blog/thumbnails"
                label={t("advice.field.image")}
                hint={t("advice.field.imageHint")}
              />
            </div>
            <div className="col-span-2">
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">
                {t("advice.field.videoUrl")}
              </div>
              <input
                value={draft.videoUrl}
                onChange={(e) =>
                  setDraft({ ...draft, videoUrl: e.target.value })
                }
                placeholder={t("advice.field.videoUrlPh")}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[12.5px] font-mono text-text-primary outline-none focus:border-primary"
              />
              {(() => {
                const id = parseYouTubeId(draft.videoUrl);
                if (id) {
                  return (
                    <div className="mt-2 rounded-xl overflow-hidden border border-line bg-black">
                      <iframe
                        width="100%"
                        height="220"
                        src={`https://www.youtube.com/embed/${id}`}
                        title="Video preview"
                        allowFullScreen
                      />
                    </div>
                  );
                }
                if (draft.videoUrl) {
                  return (
                    <div className="mt-1 text-[11px] text-amber-600">
                      {t("advice.field.videoUrlInvalid")}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-[12.5px] text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) =>
                  setDraft({ ...draft, isActive: e.target.checked })
                }
              />
              {t("advice.field.active")}
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isFeatured}
                onChange={(e) =>
                  setDraft({ ...draft, isFeatured: e.target.checked })
                }
              />
              {t("advice.field.featured")}
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="btn-secondary text-[12.5px]"
            onClick={onClose}
            disabled={saving}
          >
            {t("form.cancel")}
          </button>
          <button
            className="btn-secondary text-[12.5px] inline-flex items-center gap-1 disabled:opacity-50"
            onClick={() => handleSave(true)}
            disabled={saving || !canSave}
            title={t("advice.saveWithTranslateHint")}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {t("advice.saveWithTranslate")}
          </button>
          <button
            className="btn-primary text-[12.5px] disabled:opacity-50"
            onClick={() => handleSave(false)}
            disabled={saving || !canSave}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("form.save")}
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
