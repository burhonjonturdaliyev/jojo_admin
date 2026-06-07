import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import { ordersApi, unwrapList, type AdminOrder } from "../lib/resources";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-status-progress/15 text-status-progress",
  confirmed: "bg-blue-500/15 text-blue-500",
  shipping: "bg-purple-500/15 text-purple-500",
  delivered: "bg-status-resolved/15 text-status-resolved",
  cancelled: "bg-status-blocked/15 text-status-blocked",
};

const STATUS_OPTIONS = ["new", "confirmed", "shipping", "delivered", "cancelled"];

export function OrdersPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const raw = await ordersApi.list({ status: filter || undefined });
      setItems(unwrapList(raw));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [filter]);

  const setStatus = async (id: number, status: string) => {
    await ordersApi.update(id, { status });
    void reload();
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.orders")}
        subtitle={`${items.length} ta buyurtma`}
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter(null)}
              className={
                "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                (filter === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line bg-bg-input text-text-secondary")
              }
            >
              Hammasi
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                  (filter === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-bg-input text-text-secondary")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="card mt-4 overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">Mahsulot</th>
                <th className="px-4 py-3">Foydalanuvchi</th>
                <th className="px-4 py-3">Soni</th>
                <th className="px-4 py-3">Summasi</th>
                <th className="px-4 py-3">Holati</th>
                <th className="px-4 py-3">Sana</th>
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
                    <ShoppingBag className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Buyurtmalar yo'q
                  </td>
                </tr>
              )}
              {items.map((o) => (
                <tr key={o.id} className="border-b border-line/50 hover:bg-bg-hover">
                  <td className="px-4 py-3 font-mono text-[11.5px] text-text-muted">
                    #{o.id}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {o.product?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <div>{o.parent?.name || o.contact_name || "—"}</div>
                    <div className="text-[11px] text-text-muted">
                      {o.parent?.phone || o.contact_phone || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {o.quantity ?? 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {(o.total_price ?? 0).toLocaleString("uz-UZ").replace(/,/g, " ")} so'm
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value)}
                      className={
                        "rounded-full border-0 px-2.5 py-1 text-[11px] font-medium outline-none cursor-pointer " +
                        (STATUS_COLORS[o.status] ||
                          "bg-text-muted/15 text-text-muted")
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(o.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
