import { useEffect, useState } from "react";
import { ShoppingBag, Pencil, Trash2, X, Save, Settings2, Plus, GripVertical } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { LocalizedField } from "../components/LocalizedField";
import { useT, type Lang } from "../lib/i18n";
import {
  ordersApi,
  orderStatusesApi,
  unwrapList,
  type AdminOrder,
  type AdminOrderStatus,
} from "../lib/resources";
import { emptyLocalized, type Localized } from "../types/locale";

const COLOR_CLASSES: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-600",
  blue: "bg-blue-500/15 text-blue-500",
  purple: "bg-purple-500/15 text-purple-500",
  green: "bg-status-resolved/15 text-status-resolved",
  red: "bg-status-blocked/15 text-status-blocked",
  gray: "bg-text-muted/15 text-text-muted",
  pink: "bg-pink-500/15 text-pink-500",
  cyan: "bg-cyan-500/15 text-cyan-500",
};

const COLOR_OPTIONS = ["amber", "blue", "purple", "green", "red", "gray", "pink", "cyan"];

export function OrdersPage() {
  const { t, lang } = useT();
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminOrder | null>(null);

  const [statuses, setStatuses] = useState<AdminOrderStatus[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);

  /** Status label uchun ustun-prioritet:
   *  1) admin yaratgan `OrderStatus` jadvali (multilang, color bilan) bo'lsa
   *  2) backend serializer'dan kelgan `status_label` (default tizim status'lari)
   *  3) faqat slug.
   */
  const statusLabel = (slug: string, order?: AdminOrder) => {
    const s = statuses.find((x) => x.slug === slug);
    if (s) return pickName(s, lang);
    if (order?.status_label) return order.status_label;
    return slug;
  };

  const statusColor = (slug: string) => {
    const s = statuses.find((x) => x.slug === slug);
    return COLOR_CLASSES[s?.color || "gray"] || COLOR_CLASSES.gray;
  };

  const loadStatuses = async () => {
    try {
      const r = await orderStatusesApi.list();
      setStatuses(r.results || []);
    } catch (e) {
      console.error("statuses load", e);
    }
  };

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
    void loadStatuses();
  }, []);

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

  const activeStatuses = statuses.filter((s) => s.is_active);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.orders")}
        subtitle={t("orders.countSubtitle").replace("{count}", String(items.length))}
        actions={
          <button
            onClick={() => setManagerOpen(true)}
            className="btn-primary text-[12.5px]"
          >
            <Settings2 className="h-4 w-4" /> {t("orders.manageStatuses")}
          </button>
        }
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
            {activeStatuses.map((s) => (
              <button
                key={s.slug}
                onClick={() => setFilter(s.slug)}
                className={
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                  (filter === s.slug
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-bg-input text-text-secondary")
                }
              >
                {pickName(s, lang)}
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
                    <div>
                      {o.user?.full_name || o.parent?.name || o.contact_name || "—"}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {o.user?.phone || o.parent?.phone || o.contact_phone || ""}
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
                        statusColor(o.status)
                      }
                    >
                      {activeStatuses.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {pickName(s, lang)}
                        </option>
                      ))}
                      {!activeStatuses.find((s) => s.slug === o.status) && (
                        <option value={o.status}>{statusLabel(o.status, o)}</option>
                      )}
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

      {managerOpen && (
        <StatusManager
          statuses={statuses}
          onClose={() => setManagerOpen(false)}
          onChanged={loadStatuses}
        />
      )}
    </div>
  );
}

function pickName(s: AdminOrderStatus, lang: Lang): string {
  if (lang === "ru") return s.name_ru || s.name;
  if (lang === "en") return s.name_en || s.name;
  if (lang === "uz_cyrl") return s.name_uz_cyrl || s.name;
  return s.name;
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

function StatusManager({
  statuses,
  onClose,
  onChanged,
}: {
  statuses: AdminOrderStatus[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const { t } = useT();
  const [editing, setEditing] = useState<AdminOrderStatus | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = async (s: AdminOrderStatus) => {
    if (!confirm(t("orders.status.confirmDelete").replace("{name}", s.name))) return;
    try {
      await orderStatusesApi.remove(s.id);
      await onChanged();
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {t("orders.manageStatuses")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {statuses.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-bg-input/50 p-3"
            >
              <GripVertical className="h-4 w-4 text-text-muted" />
              <span
                className={
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium " +
                  (COLOR_CLASSES[s.color] || COLOR_CLASSES.gray)
                }
              >
                {s.name}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-text-primary truncate">
                  {s.slug}
                  {s.is_system && (
                    <span className="ml-2 text-[10px] font-medium text-text-muted rounded bg-bg-input px-1.5 py-0.5">
                      {t("orders.status.systemTag")}
                    </span>
                  )}
                  {!s.is_active && (
                    <span className="ml-2 text-[10px] font-medium text-amber-600 rounded bg-amber-500/15 px-1.5 py-0.5">
                      {t("common.inactive")}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {[s.name_uz_cyrl && `cyr: ${s.name_uz_cyrl}`, s.name_ru && `ru: ${s.name_ru}`, s.name_en && `en: ${s.name_en}`]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </div>
              </div>
              <button
                onClick={() => setEditing(s)}
                className="icon-btn h-7 w-7"
                title={t("common.edit")}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => remove(s)}
                disabled={s.is_system}
                className={
                  "icon-btn h-7 w-7 " +
                  (s.is_system
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-status-blocked/15 hover:text-status-blocked")
                }
                title={s.is_system ? t("orders.status.systemCannotDelete") : t("common.delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button
            onClick={() => setCreating(true)}
            className="btn-primary w-full justify-center py-2.5 text-[12.5px]"
          >
            <Plus className="h-4 w-4" /> {t("orders.status.new")}
          </button>
        </div>
      </div>

      {editing && (
        <StatusEditor
          status={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await onChanged();
          }}
        />
      )}
      {creating && (
        <StatusEditor
          status={null}
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await onChanged();
          }}
        />
      )}
    </div>
  );
}

function StatusEditor({
  status,
  onClose,
  onSaved,
}: {
  status: AdminOrderStatus | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useT();
  const [slug, setSlug] = useState(status?.slug || "");
  const [names, setNames] = useState<Localized<string>>(() =>
    status
      ? {
          uz: status.name,
          uz_cyrl: status.name_uz_cyrl,
          ru: status.name_ru,
          en: status.name_en,
        }
      : emptyLocalized(),
  );
  const [color, setColor] = useState(status?.color || "gray");
  const [sortOrder, setSortOrder] = useState(status?.sort_order ?? 100);
  const [isActive, setIsActive] = useState(status?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!names.uz.trim()) {
      alert(t("orders.status.uzRequired"));
      return;
    }
    if (!status && !slug.trim()) {
      alert(t("orders.status.slugRequired"));
      return;
    }
    setBusy(true);
    try {
      if (status) {
        await orderStatusesApi.update(status.id, {
          name: names.uz.trim(),
          name_uz_cyrl: names.uz_cyrl.trim(),
          name_ru: names.ru.trim(),
          name_en: names.en.trim(),
          color,
          sort_order: sortOrder,
          is_active: isActive,
        });
      } else {
        await orderStatusesApi.create({
          slug: slug.trim().toLowerCase(),
          name: names.uz.trim(),
          name_uz_cyrl: names.uz_cyrl.trim(),
          name_ru: names.ru.trim(),
          name_en: names.en.trim(),
          color,
          sort_order: sortOrder,
          is_active: isActive,
        });
      }
      await onSaved();
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {status ? t("orders.status.editTitle") : t("orders.status.new")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              Slug (kod)
            </div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={!!status}
              placeholder="masalan: paid"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] font-mono outline-none focus:border-primary disabled:opacity-60"
            />
            {status && (
              <div className="mt-1 text-[10.5px] text-text-muted">
                {t("orders.status.slugReadonly")}
              </div>
            )}
          </div>
          <LocalizedField
            label={t("orders.status.nameLabel")}
            value={names}
            onChange={setNames}
            placeholder="Nomi"
          />
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("orders.status.color")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={
                    "rounded-full px-3 py-1 text-[11px] font-medium border " +
                    (COLOR_CLASSES[c] || "") +
                    " " +
                    (color === c ? "border-primary" : "border-transparent")
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">
                {t("orders.status.sortOrder")}
              </div>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
            <label className="flex items-end gap-2 pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-[12.5px] text-text-secondary">
                {t("common.active")}
              </span>
            </label>
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
