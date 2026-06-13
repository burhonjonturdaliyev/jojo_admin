import { useCallback, useEffect, useState } from "react";
import { Bell, Pencil, Trash2, X, Save, Plus, Send } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { LocalizedField } from "../components/LocalizedField";
import { useT } from "../lib/i18n";
import {
  notificationsApi,
  unwrapList,
  type AdminNotificationRow,
} from "../lib/resources";
import { emptyLocalized, type Localized } from "../types/locale";

const CATEGORY_OPTIONS = [
  "zone_in",
  "zone_out",
  "destination",
  "battery",
  "offline",
  "login",
  "order",
  "shipping",
  "deal",
  "screen",
  "premium",
  "tip",
  "route",
  "place_recommendation",
  "system",
  "sos",
];

const FILTER_CATEGORIES = ["sos", "system", "place_recommendation", "premium", "tip"];

const AUDIENCE_OPTIONS: { value: "all" | "active" | "premium" | "non_premium"; key: string }[] = [
  { value: "active", key: "common.allUsers" },
  { value: "premium", key: "common.premiumUsers" },
  { value: "non_premium", key: "common.newUsers" },
  { value: "all", key: "common.allPlural" },
];

export function NotificationsPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminNotificationRow | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    notificationsApi
      .list({ category: category || undefined })
      .then((raw) => setItems(unwrapList(raw)))
      .catch((e) => console.error("notifs load", e))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    reload();
  }, [reload]);

  const catLabel = (c: string) => {
    const key = `notifCategory.${c}`;
    const translated = t(key);
    return translated === key ? c : translated;
  };

  const remove = async (id: number) => {
    if (!confirm(t("notifications.confirmDelete"))) return;
    try {
      await notificationsApi.remove(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.notifications")}
        subtitle={t("notifications.recordsCount").replace("{count}", String(items.length))}
        actions={
          <button
            onClick={() => setCreating(true)}
            className="btn-primary text-[12.5px]"
          >
            <Plus className="h-4 w-4" /> {t("notifications.new")}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={
                "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                (category === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line bg-bg-input text-text-secondary")
              }
            >
              {t("common.all")}
            </button>
            {FILTER_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                  (category === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-bg-input text-text-secondary")
                }
              >
                {catLabel(c)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {loading && (
            <div className="card p-8 text-center text-text-muted">
              {t("common.loading")}
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="card p-12 text-center text-text-muted">
              <Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
              {t("notifications.empty")}
            </div>
          )}
          {items.map((n) => (
            <div key={n.id} className="card p-3 group">
              <div className="flex items-start gap-3">
                <div
                  className={
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
                    (n.category === "sos"
                      ? "bg-red-500/15 text-red-500"
                      : "bg-blue-500/15 text-blue-500")
                  }
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13.5px] font-semibold text-text-primary">
                      {n.title}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="rounded-full bg-text-muted/15 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                        {catLabel(n.category)}
                      </span>
                      <button
                        onClick={() => setEditing(n)}
                        className="icon-btn h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t("common.edit")}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        className="icon-btn h-6 w-6 hover:bg-status-blocked/15 hover:text-status-blocked opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-0.5 text-[12px] text-text-secondary line-clamp-2">
                    {n.body}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
                    <span>{new Date(n.created_at).toLocaleString("uz-UZ")}</span>
                    {n.parent && <span>· user #{n.parent}</span>}
                    {n.is_read && (
                      <span className="text-status-resolved">{t("notifications.readMark")}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <NotifEditor
          notif={editing}
          catLabel={catLabel}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              prev.map((n) =>
                n.id === saved.id
                  ? {
                      ...n,
                      title: saved.title,
                      body: saved.body,
                      category: saved.category,
                    }
                  : n,
              ),
            );
            setEditing(null);
          }}
        />
      )}

      {creating && (
        <NotifCreator
          catLabel={catLabel}
          onClose={() => setCreating(false)}
          onSent={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function NotifEditor({
  notif,
  catLabel,
  onClose,
  onSaved,
}: {
  notif: AdminNotificationRow;
  catLabel: (c: string) => string;
  onClose: () => void;
  onSaved: (s: {
    id: number;
    title: string;
    body: string;
    category: string;
  }) => void;
}) {
  const { t } = useT();
  const [title, setTitle] = useState(notif.title);
  const [body, setBody] = useState(notif.body);
  const [category, setCategory] = useState(notif.category);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await notificationsApi.update(notif.id, {
        title: title.trim(),
        body: body.trim(),
        category,
      });
      onSaved(r);
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {t("notifications.editTitle")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("common.title")}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              maxLength={150}
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("common.message")}
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("notifications.category")}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {catLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={busy || !title.trim() || !body.trim()}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {busy ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotifCreator({
  catLabel,
  onClose,
  onSent,
}: {
  catLabel: (c: string) => string;
  onClose: () => void;
  onSent: () => void;
}) {
  const { t } = useT();
  const [title, setTitle] = useState<Localized<string>>(emptyLocalized());
  const [body, setBody] = useState<Localized<string>>(emptyLocalized());
  const [category, setCategory] = useState("system");
  const [audience, setAudience] = useState<"all" | "active" | "premium" | "non_premium">("active");
  const [sendSms, setSendSms] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const baseTitle = title.uz.trim();
    const baseBody = body.uz.trim();
    if (!baseTitle || !baseBody) {
      alert(t("notifications.uzRequired"));
      return;
    }
    setBusy(true);
    try {
      await notificationsApi.broadcast({
        title: baseTitle,
        body: baseBody,
        title_uz_cyrl: title.uz_cyrl.trim() || undefined,
        body_uz_cyrl: body.uz_cyrl.trim() || undefined,
        title_ru: title.ru.trim() || undefined,
        body_ru: body.ru.trim() || undefined,
        title_en: title.en.trim() || undefined,
        body_en: body.en.trim() || undefined,
        category,
        audience,
        send_sms: sendSms,
      });
      onSent();
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {t("notifications.new")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <LocalizedField
            label={t("common.title")}
            value={title}
            onChange={setTitle}
            placeholder={t("notifications.titlePlaceholder")}
          />
          <LocalizedField
            as="textarea"
            rows={4}
            label={t("common.message")}
            value={body}
            onChange={setBody}
            placeholder={t("notifications.bodyPlaceholder")}
          />
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("notifications.category")}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {catLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("common.audience")}
            </div>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as typeof audience)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              {AUDIENCE_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {t(a.key)}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-[12.5px] text-text-secondary">
              {t("notifications.alsoSms")}
            </span>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("common.cancel")}
          </button>
          <button
            onClick={send}
            disabled={busy || !title.uz.trim() || !body.uz.trim()}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {busy ? t("common.sending") : t("common.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
