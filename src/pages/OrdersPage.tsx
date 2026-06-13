import { useEffect, useState } from "react";
import { ShoppingBag, Pencil, Trash2, X, Save } from "lucide-react";
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

const STATUS_I18N_KEY: Record<string, string> = {
  new: "orderStatus.sent",
  confirmed: "orderStatus.confirmed",
  shipping: "orderStatus.shipping",
  delivered: "orderStatus.delivered",
  cancelled: "orderStatus.cancelled",
};

export function OrdersPage() {
  const { t } = useT();
  const statusLabel = (s: string) =>
    STATUS_I18N_KEY[s] ? t(STATUS_I18N_KEY[s]) : s;
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminOrder | null>(null);

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

  const remove = async (id: number) => {
    if (!confirm(t("orders.confirmDelete"))) return;
    try {
      await ordersApi.remove(id);
      setItems((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.orders")}
        subtitle={t("orders.countSubtitle").replace("{count}", String(items.length))}
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
              {t("common.all")}
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
                {statusLabel(s)}
              </button>
            ))}
          </div>
        </div>
        <div className="card mt-4 overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">№</th>
                <th className="px-4 py-3">{t("orders.tbl.product")}</th>
                <th className="px-4 py-3">{t("orders.tbl.customer")}</th>
                <th className="px-4 py-3">{t("orders.tbl.quantity")}</th>
                <th className="px-4 py-3">{t("orders.tbl.amount")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3">{t("common.date")}</th>
                <th className="px-4 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <ShoppingBag className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    {t("orders.empty")}
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
                    {(o.total_price ?? 0).toLocaleString("uz-UZ").replace(/,/g, " ")} {t("common.sum")}
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
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(o.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(o)}
                        className="icon-btn h-7 w-7"
                        title={t("common.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(o.id)}
                        className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <OrderEditor
          order={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) =>
              prev.map((o) => (o.id === saved.id ? { ...o, ...saved } : o)),
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function OrderEditor({
  order,
  onClose,
  onSaved,
}: {
  order: AdminOrder;
  onClose: () => void;
  onSaved: (s: AdminOrder) => void;
}) {
  const { t } = useT();
  const [contactName, setContactName] = useState(order.contact_name || "");
  const [contactPhone, setContactPhone] = useState(order.contact_phone || "");
  const [address, setAddress] = useState(order.address || "");
  const [quantity, setQuantity] = useState(order.quantity ?? 1);
  const [note, setNote] = useState(order.note || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await ordersApi.update(order.id, {
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        address: address.trim(),
        quantity,
        note: note.trim(),
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
            {t("orders.editTitle")} #{order.id}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("orders.csv.customer")}
            </div>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("orders.csv.phone")}
            </div>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("orders.csv.address")}
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("orders.tbl.quantity")}
            </div>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("orders.csv.note")}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {busy ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
