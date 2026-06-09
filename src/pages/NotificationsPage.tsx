import { useCallback, useEffect, useState } from "react";
import { Bell, Pencil, Trash2, X, Save } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import {
  notificationsApi,
  unwrapList,
  type AdminNotificationRow,
} from "../lib/resources";

const CATEGORY_LABELS: Record<string, string> = {
  zone_in: "Zonaga kirish",
  zone_out: "Zonadan chiqish",
  destination: "Maqsadga yetish",
  battery: "Batareya",
  offline: "Offline",
  login: "Login",
  order: "Buyurtma",
  shipping: "Yetkazib berish",
  deal: "Aksiya",
  screen: "Ekran vaqti",
  premium: "Premium",
  tip: "Maslahat",
  route: "Marshrut",
  place_recommendation: "Joy tavsiyasi",
  system: "Tizim",
  sos: "SOS",
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS);

export function NotificationsPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminNotificationRow | null>(null);

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

  const categories = ["sos", "system", "place_recommendation", "premium", "tip"];

  const remove = async (id: number) => {
    if (!confirm("Bildirishnomani o'chirishni xohlaysizmi?")) return;
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
        subtitle={`${items.length} ta yozuv`}
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
              Hammasi
            </button>
            {categories.map((c) => (
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
                {CATEGORY_LABELS[c] || c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {loading && (
            <div className="card p-8 text-center text-text-muted">
              Yuklanmoqda...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="card p-12 text-center text-text-muted">
              <Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Bildirishnomalar yo'q
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
                        {CATEGORY_LABELS[n.category] || n.category}
                      </span>
                      <button
                        onClick={() => setEditing(n)}
                        className="icon-btn h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Tahrirlash"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        className="icon-btn h-6 w-6 hover:bg-status-blocked/15 hover:text-status-blocked opacity-0 group-hover:opacity-100 transition-opacity"
                        title="O'chirish"
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
                      <span className="text-status-resolved">o'qildi</span>
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
    </div>
  );
}

function NotifEditor({
  notif,
  onClose,
  onSaved,
}: {
  notif: AdminNotificationRow;
  onClose: () => void;
  onSaved: (s: {
    id: number;
    title: string;
    body: string;
    category: string;
  }) => void;
}) {
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
            Bildirishnomani tahrirlash
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              Sarlavha
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
              Matn
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
              Kategoriya
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] || c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            Bekor
          </button>
          <button
            onClick={save}
            disabled={busy || !title.trim() || !body.trim()}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
