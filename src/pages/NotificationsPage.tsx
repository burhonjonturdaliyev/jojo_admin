import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import { notificationsApi, unwrapList, type AdminNotificationRow } from "../lib/resources";

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

export function NotificationsPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    notificationsApi
      .list({ category: category || undefined })
      .then((raw) => setItems(unwrapList(raw)))
      .catch((e) => console.error("notifs load", e))
      .finally(() => setLoading(false));
  }, [category]);

  const categories = ["sos", "system", "place_recommendation", "premium", "tip"];

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
            <div key={n.id} className="card p-3">
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
                    <span className="rounded-full bg-text-muted/15 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                      {CATEGORY_LABELS[n.category] || n.category}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-text-secondary line-clamp-2">
                    {n.body}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
                    <span>{new Date(n.created_at).toLocaleString("uz-UZ")}</span>
                    {n.parent && <span>· user #{n.parent}</span>}
                    {n.is_read && <span className="text-status-resolved">o'qildi</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
