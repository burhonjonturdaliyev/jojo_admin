import { useMemo, useState } from "react";
import {
  Download,
  Search,
  Calendar,
  Phone,
  MapPin,
  Package,
  ChevronRight,
  X,
  Check,
  Truck,
  CircleCheck,
  CircleX,
  Eye,
  StickyNote,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  initialOrders,
  orderFlow,
  orderStatusColors,
  orderStatusLabels,
  type Order,
  type OrderStatus,
} from "../data/orders";
import { cn } from "../lib/utils";

type Tab = "active" | "delivered" | "cancelled";

const tabs: { key: Tab; label: string; statuses: OrderStatus[] }[] = [
  { key: "active", label: "Faol", statuses: ["sent", "review", "confirmed", "shipping"] },
  { key: "delivered", label: "Yetkazilgan", statuses: ["delivered"] },
  { key: "cancelled", label: "Bekor qilingan", statuses: ["cancelled"] },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => map.set(o.productId, o.productName));
    return Array.from(map.entries());
  }, [orders]);

  const currentTab = tabs.find((t) => t.key === tab)!;

  const filtered = useMemo(() => {
    return orders
      .filter((o) => currentTab.statuses.includes(o.status))
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => productFilter === "all" || o.productId === productFilter)
      .filter((o) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userPhone.includes(q) ||
          o.productName.toLowerCase().includes(q)
        );
      });
  }, [orders, currentTab, search, statusFilter, productFilter]);

  const counts = useMemo(() => {
    const map = new Map<Tab, number>();
    tabs.forEach((t) => {
      map.set(
        t.key,
        orders.filter((o) => t.statuses.includes(o.status)).length,
      );
    });
    return map;
  }, [orders]);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  const changeStatus = (id: string, status: OrderStatus, by = "Admin") => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        if (o.status === status) return o;
        return {
          ...o,
          status,
          statusHistory: [
            ...o.statusHistory,
            { status, at: new Date().toLocaleString("ru-RU"), by },
          ],
        };
      }),
    );
  };

  const updateNote = (id: string, note: string) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, managerNote: note } : o)),
    );

  const exportCsv = () => {
    const headers = [
      "ID",
      "Mahsulot",
      "Narx",
      "Mijoz",
      "Telefon",
      "Manzil",
      "Status",
      "Yaratilgan",
      "Izoh",
    ];
    const rows = filtered.map((o) => [
      o.id,
      o.productName,
      o.productPrice,
      o.userName,
      o.userPhone,
      o.userAddress ?? "",
      orderStatusLabels[o.status],
      o.createdAt,
      o.managerNote.replace(/[\n,]/g, " "),
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `buyurtmalar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const revenueSum = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.productPrice, 0);

  return (
    <div className="flex h-full">
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <PageHeader
          title="Buyurtmalar"
          subtitle="Do'kon buyurtmalarini boshqarish"
          actions={
            <>
              <button className="btn-secondary text-[12.5px]">
                <Calendar className="h-4 w-4" /> 01.05 - 31.05.2024
              </button>
              <button className="btn-secondary text-[12.5px]" onClick={exportCsv}>
                <Download className="h-4 w-4" /> CSV eksport
              </button>
            </>
          }
        />

        <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Yangi", value: orders.filter((o) => o.status === "sent").length, color: "#9AA3B2", icon: Package },
              { label: "Ko'rilmoqda", value: orders.filter((o) => o.status === "review").length, color: "#F59E0B", icon: Eye },
              { label: "Tasdiqlangan", value: orders.filter((o) => o.status === "confirmed").length, color: "#3B82F6", icon: Check },
              { label: "Yetkazilmoqda", value: orders.filter((o) => o.status === "shipping").length, color: "#3B82F6", icon: Truck },
              { label: "Sotuv (delivered)", value: `${revenueSum.toLocaleString("ru-RU")}`, suffix: "so'm", color: "#10B981", icon: CircleCheck },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[12px] text-text-secondary">{s.label}</div>
                    <div className="mt-1 text-[20px] font-bold text-text-primary">
                      {s.value}
                      {(s as { suffix?: string }).suffix && (
                        <span className="ml-1 text-[11px] font-normal text-text-muted">
                          {(s as { suffix?: string }).suffix}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `${s.color}26`, color: s.color }}
                  >
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
              <div className="flex items-center gap-1 rounded-lg border border-line bg-bg-input p-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setTab(t.key);
                      setStatusFilter("all");
                    }}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                      tab === t.key
                        ? "bg-brand text-white"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {t.label}
                    <span className="ml-1.5 text-[10.5px] opacity-70">
                      {counts.get(t.key) ?? 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="input w-auto"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as OrderStatus | "all")
                  }
                >
                  <option value="all">Barcha statuslar</option>
                  {currentTab.statuses.map((s) => (
                    <option key={s} value={s}>
                      {orderStatusLabels[s]}
                    </option>
                  ))}
                </select>
                <select
                  className="input w-auto"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                >
                  <option value="all">Barcha mahsulotlar</option>
                  {productOptions.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    placeholder="ID, mijoz, telefon..."
                    className="input pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-bg-input text-[12px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Mahsulot</th>
                    <th className="px-4 py-3 text-left font-semibold">Mijoz</th>
                    <th className="px-4 py-3 text-left font-semibold">Narx</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Yaratilgan</th>
                    <th className="px-4 py-3 text-right font-semibold">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => {
                    const c = orderStatusColors[o.status];
                    return (
                      <tr
                        key={o.id}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-bg-hover/40",
                          i ? "border-t border-line" : "",
                          selectedId === o.id && "bg-bg-hover/60",
                        )}
                        onClick={() => setSelectedId(o.id)}
                      >
                        <td className="px-4 py-3 font-mono text-[12px] font-semibold text-text-primary">
                          #{o.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-text-primary">
                            {o.productName}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            #{o.productId}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-text-primary">
                            {o.userName}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            {o.userPhone}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-text-primary">
                          {o.productPrice.toLocaleString("ru-RU")}
                          <span className="ml-1 text-[10px] text-text-muted">so'm</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${c.chip}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                            {orderStatusLabels[o.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {o.createdAt}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="ml-auto h-4 w-4 text-text-muted" />
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-[13px] text-text-muted"
                      >
                        Buyurtma topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <OrderDetailPanel
          order={selected}
          onClose={() => setSelectedId(null)}
          onChangeStatus={(status) => changeStatus(selected.id, status)}
          onNoteChange={(note) => updateNote(selected.id, note)}
        />
      )}
    </div>
  );
}

interface PanelProps {
  order: Order;
  onClose: () => void;
  onChangeStatus: (s: OrderStatus) => void;
  onNoteChange: (note: string) => void;
}

function OrderDetailPanel({
  order,
  onClose,
  onChangeStatus,
  onNoteChange,
}: PanelProps) {
  const currentIdx = orderFlow.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const c = orderStatusColors[order.status];

  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col border-l border-line bg-bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <div className="font-mono text-[13px] font-semibold text-text-primary">
            #{order.id}
          </div>
          <div className="mt-0.5 text-[11.5px] text-text-secondary">
            {order.createdAt}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
        <div className="rounded-xl border border-line bg-bg-input p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
              <Package className="h-5 w-5 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-text-primary">
                {order.productName}
              </div>
              <div className="mt-0.5 text-[11.5px] text-text-muted">
                #{order.productId}
              </div>
              <div className="mt-1 font-semibold text-text-primary">
                {order.productPrice.toLocaleString("ru-RU")}{" "}
                <span className="text-[11px] font-normal text-text-muted">so'm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-line p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Mijoz
          </div>
          <div className="mt-2 text-[14px] font-semibold text-text-primary">
            {order.userName}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[12.5px] text-text-secondary">
            <Phone className="h-3.5 w-3.5" />
            {order.userPhone}
          </div>
          {order.userAddress && (
            <div className="mt-1 flex items-center gap-2 text-[12.5px] text-text-secondary">
              <MapPin className="h-3.5 w-3.5" />
              {order.userAddress}
            </div>
          )}
          <div className="mt-1 font-mono text-[11px] text-text-muted">
            {order.userId}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Statusni o'zgartirish
          </div>
          <span
            className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${c.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            Hozir: {orderStatusLabels[order.status]}
          </span>

          {!isCancelled ? (
            <div className="space-y-2">
              <div className="flex flex-col gap-1.5">
                {orderFlow.map((s, i) => {
                  const passed = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <button
                      key={s}
                      disabled={passed && !isCurrent}
                      onClick={() => onChangeStatus(s)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[12.5px] transition-colors",
                        passed
                          ? "border-line bg-bg-input"
                          : "border-line bg-bg-input hover:border-brand hover:bg-brand-soft",
                        isCurrent && "border-brand bg-brand-soft",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                            passed
                              ? "bg-brand text-white"
                              : "bg-bg-hover text-text-muted",
                          )}
                        >
                          {passed ? <Check className="h-3 w-3" /> : i + 1}
                        </span>
                        <span
                          className={cn(
                            "font-medium",
                            passed ? "text-text-primary" : "text-text-secondary",
                          )}
                        >
                          {orderStatusLabels[s]}
                        </span>
                      </span>
                      {isCurrent && (
                        <span className="text-[10.5px] font-semibold uppercase text-brand">
                          Hozir
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onChangeStatus("cancelled")}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-status-blocked/30 bg-status-blocked/10 px-3 py-2 text-[12.5px] font-medium text-status-blocked transition-colors hover:bg-status-blocked/15"
              >
                <CircleX className="h-4 w-4" />
                Bekor qilish
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-status-blocked/30 bg-status-blocked/10 p-3 text-[12.5px] text-status-blocked">
              Bu buyurtma bekor qilingan.
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <StickyNote className="h-3.5 w-3.5" /> Manager izohi
          </div>
          <textarea
            rows={3}
            className="input resize-none"
            placeholder="Ichki izoh yozing..."
            value={order.managerNote}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Status tarixi
          </div>
          <ol className="relative space-y-3 border-l border-line pl-4">
            {order.statusHistory.map((h, i) => {
              const hc = orderStatusColors[h.status];
              return (
                <li key={i} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-bg-panel",
                      hc.dot,
                    )}
                  />
                  <div className="text-[12.5px] font-medium text-text-primary">
                    {orderStatusLabels[h.status]}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {h.at}
                    {h.by ? ` · ${h.by}` : ""}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </aside>
  );
}
