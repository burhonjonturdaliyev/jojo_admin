import { useEffect, useState } from "react";
import { Plus, FolderTree, Pencil, Trash2, Package, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import { MultilangInput, type LangValue } from "../components/MultilangInput";
import { useT } from "../lib/i18n";
import {
  storeCategoriesApi,
  blogCategoriesApi,
  translateApi,
  unwrapList,
  type AdminStoreCategory,
  type AdminBlogCategory,
  type TranslateLang,
} from "../lib/resources";

type Tab = "store" | "blog";

interface CategoryDraft {
  id?: number;
  name: string;
  name_ru?: string;
  name_en?: string;
  name_uz_cyrl?: string;
  slug?: string;
  icon?: string | null;
  order?: number;
  is_active?: boolean;
}

export function CategoriesPage() {
  const { t } = useT();
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

  const save = async (
    d: CategoryDraft,
    opts: { autoTranslate?: boolean; translateSource?: TranslateLang } = {},
  ) => {
    const payload: Record<string, unknown> = {
      name: d.name,
      name_ru: d.name_ru || "",
      name_en: d.name_en || "",
      name_uz_cyrl: d.name_uz_cyrl || "",
      slug: d.slug || undefined,
      order: d.order ?? 0,
      is_active: d.is_active ?? true,
    };
    if (opts.autoTranslate) {
      payload.auto_translate = true;
      payload.translate_source = opts.translateSource || "uz";
    }
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
    if (!confirm(t("categories.confirmDelete", { name: "" }))) return;
    try {
      if (tab === "store") await storeCategoriesApi.remove(id);
      else await blogCategoriesApi.remove(id);
      void reload();
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
    }
  };

  const items: CategoryDraft[] =
    tab === "store"
      ? storeCats.map((c) => ({
          id: c.id,
          name: c.name,
          name_ru: c.name_ru,
          name_en: c.name_en,
          name_uz_cyrl: c.name_uz_cyrl,
          slug: c.slug,
          icon: c.icon,
          order: c.order,
          is_active: c.is_active,
        }))
      : blogCats.map((c) => ({
          id: c.id,
          name: c.name,
          name_ru: c.name_ru,
          name_en: c.name_en,
          name_uz_cyrl: c.name_uz_cyrl,
          slug: c.slug,
          order: c.order,
          is_active: c.is_active,
        }));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("categories.title")}
        subtitle={t("categories.subtitle", { count: items.length })}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() =>
              setEditing({
                name: "",
                name_ru: "",
                name_en: "",
                name_uz_cyrl: "",
                slug: "",
                icon: "",
                order: items.length,
                is_active: true,
              })
            }
          >
            <Plus className="h-4 w-4" /> {t("categories.newButton")}
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
            <Package className="h-4 w-4" /> {t("categories.tab.store")}
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
            <BookOpen className="h-4 w-4" /> {t("categories.tab.blog")}
          </button>
        </div>

        <div className="card mt-4 overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3 w-16">№</th>
                <th className="px-4 py-3">{t("categories.col.name")}</th>
                <th className="px-4 py-3">{t("categories.col.slug")}</th>
                {tab === "store" && <th className="px-4 py-3">{t("categories.col.icon")}</th>}
                <th className="px-4 py-3 w-24">{t("categories.col.order")}</th>
                <th className="px-4 py-3 w-24">{t("categories.col.status")}</th>
                <th className="px-4 py-3 w-28 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <FolderTree className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    {t("categories.empty")}
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
                      {c.is_active ? t("users.filter.active") : t("common.inactive")}
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
  onSave: (
    d: CategoryDraft,
    opts?: { autoTranslate?: boolean; translateSource?: TranslateLang },
  ) => void | Promise<void>;
}) {
  const { t } = useT();
  const [d, setD] = useState(draft);
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);

  const filled = (v: string | undefined) => !!v && v.trim().length > 0;

  /** Eng to'liq tildan boshqa tillarni avtomatik tarjima qiladi. */
  const detectSource = (): TranslateLang => {
    const sources: Array<[TranslateLang, string | undefined]> = [
      ["uz", d.name],
      ["uz_cyrl", d.name_uz_cyrl],
      ["ru", d.name_ru],
      ["en", d.name_en],
    ];
    const ordered = sources
      .map(([k, v]) => [k, (v || "").trim().length] as const)
      .sort((a, b) => b[1] - a[1]);
    return ordered[0][1] > 0 ? ordered[0][0] : "uz";
  };

  const translateNow = async () => {
    if (translating) return;
    const source = detectSource();
    const baseRaw =
      source === "uz" ? d.name : source === "uz_cyrl" ? d.name_uz_cyrl
      : source === "ru" ? d.name_ru : d.name_en;
    const base = (baseRaw || "").trim();
    if (!base) return;
    setTranslating(true);
    try {
      const result = await translateApi.all(base, source);
      setD((prev) => ({
        ...prev,
        name: filled(prev.name) || source === "uz" ? prev.name : result.translations.uz || prev.name,
        name_uz_cyrl: filled(prev.name_uz_cyrl) || source === "uz_cyrl"
          ? prev.name_uz_cyrl
          : result.translations.uz_cyrl || prev.name_uz_cyrl,
        name_ru: filled(prev.name_ru) || source === "ru" ? prev.name_ru : result.translations.ru || prev.name_ru,
        name_en: filled(prev.name_en) || source === "en" ? prev.name_en : result.translations.en || prev.name_en,
      }));
    } catch (e) {
      console.warn("category translate failed", e);
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async (autoTranslate: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(d, {
        autoTranslate,
        translateSource: detectSource(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto scrollbar-thin rounded-2xl bg-bg p-5">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {draft.id ? t("categories.editTitle") : t("categories.newTitle")}
          </h3>
          <button
            type="button"
            onClick={translateNow}
            disabled={translating || !filled(d.name) && !filled(d.name_ru) && !filled(d.name_en) && !filled(d.name_uz_cyrl)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 text-[11.5px] font-medium hover:bg-primary/20 disabled:opacity-40"
            title="To'lgan tildan qolgan tillarga avtomatik tarjima"
          >
            {translating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {t("categories.translateAll") || "Tarjima qilish"}
          </button>
        </div>
        <div className="space-y-3">
          <MultilangInput
            label={t("categories.col.name")}
            value={{
              uz: d.name || "",
              uz_cyrl: d.name_uz_cyrl || "",
              ru: d.name_ru || "",
              en: d.name_en || "",
            } as LangValue}
            onChange={(v) =>
              setD({
                ...d,
                name: v.uz,
                name_uz_cyrl: v.uz_cyrl,
                name_ru: v.ru,
                name_en: v.en,
              })
            }
            placeholder="Nom"
            required
          />
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              Slug (URL uchun, ixtiyoriy)
            </label>
            <input
              value={d.slug ?? ""}
              onChange={(e) => setD({ ...d, slug: e.target.value })}
              placeholder="stem-oyinchoqlar"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] font-mono text-text-primary outline-none focus:border-primary"
            />
            <p className="mt-1 text-[10.5px] text-text-muted">
              Bo'sh qoldirsangiz nom asosida avto-yaratiladi
            </p>
          </div>
          {showIcon && (
            <ImageUpload
              value={d.icon ?? null}
              onChange={(url) => setD({ ...d, icon: url })}
              folder="categories"
              label="Kategoriya rasmi (ixtiyoriy)"
            />
          )}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              Tartib raqami
            </label>
            <input
              type="number"
              value={d.order ?? 0}
              onChange={(e) => setD({ ...d, order: Number(e.target.value) })}
              placeholder="0"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
            <p className="mt-1 text-[10.5px] text-text-muted">
              Kichik raqamlar oldinroq ko'rinadi
            </p>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_active ?? true}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            {t("form.activeChecked")}
          </label>
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
            className="btn-secondary text-[12.5px] inline-flex items-center gap-1"
            onClick={() => handleSave(true)}
            disabled={
              saving || (!filled(d.name) && !filled(d.name_ru) && !filled(d.name_en) && !filled(d.name_uz_cyrl))
            }
            title="Saqlashda backend bo'sh tillarni tarjima qilib to'ldiradi"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {t("categories.saveWithTranslate") || "Tarjima bilan saqlash"}
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => handleSave(false)}
            disabled={saving || !d.name.trim()}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("form.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
