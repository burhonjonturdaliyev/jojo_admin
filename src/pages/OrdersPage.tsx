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
  CircleX,
  StickyNote,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  AlertTriangle,
  Trophy,
  ChevronDown,
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
import { initialProducts } from "../data/products";
import {
  computeOrderTotals,
  computeProductMetrics,
  isWithinDays,
  rankProducts,
  type ProductMetric,
} from "../lib/analytics";
import { cn } from "../lib/utils";

type Tab = "active" | "delivered" | "cancelled";
type Period = "7d" | "30d" | "90d" | "all";

const tabs: { key: Tab; label: string; statuses: OrderStatus[] }[] = [
  { key: "active", label: "Faol", statuses: ["sent", "review", "confirmed", "shipping"] },
  { key: "delivered", label: "Yetkazilgan", statuses: ["delivered"] },
  { key: "cancelled", label: "Bekor qilingan", statuses: ["cancelled"] },
];

const periodChips: { key: Period; label: string; days: number | null }[] = [
  { key: "7d", label: "7 kun", days: 7 },
  { key: "30d", label: "30 kun", days: 30 },
  { key: "90d", label: "90 kun", days: 90 },
  { key: "all", label: "Butun davr", days: null },
];

const orderStatusOrder: OrderStatus[] = [
  "sent",
  "review",
  "confirmed",
  "shipping",
  "delivered",
  "cancelled",
];

// Latest order date acts as "now" for the demo so period filters are meaningful
// against the seed data (real prod would use Date.now()).
const REFERENCE_NOW = new Date(2024, 4, 31, 23, 59).getTime();

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const periodOrders = useMemo(() => {
    const cfg = periodChips.find((p) => p.key === period)!;
    if (cfg.days === null) return orders;
    return orders.filter((o) => isWithinDays(o.createdAt, cfg.days!, REFERENCE_NOW));
  }, [orders, period]);

  const totals = useMemo(() => computeOrderTotals(periodOrders), [periodOrders]);

  const productMetrics = useMemo(
    () => computeProductMetrics(periodOrders, initialProducts),
    [periodOrders],
  );

  const topSellers = useMemo(
    () => rankProducts(productMetrics, "sold", "desc", 5).filter((m) => m.sold > 0),
    [productMetrics],
  );

  const topRevenue = useMemo(
    () => rankProducts(productMetrics, "revenue", "desc", 5).filter((m) => m.revenue > 0),
    [productMetrics],
  );

  const worstPerformers = useMemo(() => {
    const withOrders = productMetrics.filter((m) => m.orders > 0);
    const zeroOrders = productMetrics.filter((m) => m.orders === 0);
    const ranked = rankProducts(withOrders, "sold", "asc").slice(0, 5);
    return [...zeroOrders, ...ranked].slice(0, 5);
  }, [productMetrics]);

  const topCancelled = useMemo(
    () =>
      rankProducts(
        productMetrics.filter((m) => m.cancelled > 0),
        "cancelled",
        "desc",
        5,
      ),
    [productMetrics],
  );

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

  const activePeriod = periodChips.find((p) => p.key === period)!;
  const kpis = [
    {
      label: "Tushum",
      value: totals.revenue.toLocaleString("ru-RU"),
      suffix: "so'm",
      hint: `${totals.sold} ta yetkazildi`,
      icon: Wallet,
      color: "#10B981",
    },
    {
      label: "Buyurtmalar",
      value: totals.orders.toLocaleString("ru-RU"),
      hint: `${totals.active} faol jarayonda`,
      icon: Package,
      color: "#3B82F6",
    },
    {
      label: "O'rtacha buyurtma (AOV)",
      value: totals.avgOrderValue.toLocaleString("ru-RU"),
      suffix: "so'm",
      hint: "Yetkazilgan buyurtmalar bo'yicha",
      icon: Activity,
      color: "#6366F1",
    },
    {
      label: "Konversiya",
      value: `${Math.round(totals.conversionRate * 100)}%`,
      hint: `${totals.sold} / ${totals.orders}`,
      icon: TrendingUp,
      color: "#0EA5E9",
    },
    {
      label: "Bekor qilish",
      value: `${Math.round(totals.cancellationRate * 100)}%`,
      hint: `${totals.cancelled} ta buyurtma`,
      icon: AlertTriangle,
      color: "#EF4444",
    },
  ];

  return (
    <div className="flex h-full">
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <PageHeader
          title="Buyurtmalar"
          subtitle="Do'kon buyurtmalari va analitikasi"
          actions={
            <>
              <button className="btn-secondary text-[12.5px]">
                <Calendar className="h-4 w-4" /> {activePeriod.label}
              </button>
              <button className="btn-secondary text-[12.5px]" onClick={exportCsv}>
                <Download className="h-4 w-4" /> CSV eksport
              </button>
            </>
          }
        />

        <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setAnalyticsOpen((v) => !v)}
              className="flex items-center gap-2 text-[13px] font-semibold text-text-primary hover:text-brand"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  analyticsOpen ? "" : "-rotate-90",
                )}
              />
              Analitika
              <span className="text-[11.5px] font-normal text-text-muted">
                · {activePeriod.label}
              </span>
            </button>
            <div className="flex items-center gap-1 rounded-lg border border-line bg-bg-input p-1">
              {periodChips.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                    period === p.key
                      ? "bg-brand text-white"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {analyticsOpen && (
            <>
              <div className="grid grid-cols-5 gap-4">
                {kpis.map((s) => (
                  <div key={s.label} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="text-[12px] text-text-secondary">{s.label}</div>
                        <div className="mt-1 text-[20px] font-bold leading-none text-text-primary">
                          {s.value}
                          {s.suffix && (
                            <span className="ml-1 text-[11px] font-normal text-text-muted">
                              {s.suffix}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 truncate text-[11px] text-text-muted">
                          {s.hint}
                        </div>
                      </div>
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${s.color}26`, color: s.color }}
                      >
                        <s.icon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-12 gap-4">
                <RankingCard
                  className="col-span-6"
                  title="Eng ko'p sotilgan"
                  subtitle="Yetkazilgan buyurtmalar soni bo'yicha"
                  icon={<Trophy className="h-4 w-4" />}
                  tone="success"
                  metrics={topSellers}
                  unit="ta"
                  valueOf={(m) => m.sold}
                  formatValue={(v) => `${v} ta`}
                  emptyText="Hozircha sotuv yo'q"
                />
                <RankingCard
                  className="col-span-6"
                  title="Eng yuqori tushum"
                  subtitle="Yetkazilgan buyurtmalardan kelgan summa"
                  icon={<Wallet className="h-4 w-4" />}
                  tone="brand"
                  metrics={topRevenue}
                  unit="so'm"
                  valueOf={(m) => m.revenue}
                  formatValue={(v) => `${v.toLocaleString("ru-RU")} so'm`}
                  emptyText="Tushum hisoblanmagan"
                />
                <RankingCard
                  className="col-span-6"
                  title="Eng kam sotilgan / nofaol"
                  subtitle="Diqqat talab qiluvchi mahsulotlar"
                  icon={<TrendingDown className="h-4 w-4" />}
                  tone="muted"
                  metrics={worstPerformers}
                  unit="ta"
                  valueOf={(m) => m.sold}
                  formatValue={(v) => `${v} ta`}
                  emptyText="Hammasi yaxshi ishlayapti"
                />
                <RankingCard
                  className="col-span-6"
                  title="Eng ko'p bekor qilingan"
                  subtitle="Bekor qilingan buyurtmalar yuqori bo'lganlar"
                  icon={<AlertTriangle className="h-4 w-4" />}
                  tone="danger"
                  metrics={topCancelled}
                  unit="ta"
                  valueOf={(m) => m.cancelled}
                  secondaryOf={(m) =>
                    `${Math.round(m.cancellationRate * 100)}% rate`
                  }
                  formatValue={(v) => `${v} ta`}
                  emptyText="Bekor qilingan yo'q"
                />
              </div>

              <div className="mt-5 card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-text-primary">
                      Status taqsimoti
                    </div>
                    <div className="text-[11.5px] text-text-muted">
                      Tanlangan davr bo'yicha buyurtmalar
                    </div>
                  </div>
                  <div className="text-[12px] text-text-muted">
                    Jami: <span className="font-semibold text-text-primary">{totals.orders}</span>
                  </div>
                </div>
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-bg-input">
                  {orderStatusOrder.map((s) => {
                    const count = totals.byStatus[s];
                    if (!count) return null;
                    const pct = (count / Math.max(totals.orders, 1)) * 100;
                    const c = orderStatusColors[s];
                    return (
                      <div
                        key={s}
                        className={c.dot}
                        style={{ width: `${pct}%` }}
                        title={`${orderStatusLabels[s]}: ${count}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {orderStatusOrder.map((s) => {
                    const count = totals.byStatus[s];
                    const pct = totals.orders
                      ? Math.round((count / totals.orders) * 100)
                      : 0;
                    const c = orderStatusColors[s];
                    return (
                      <div
                        key={s}
                        className="flex items-center gap-2 rounded-lg border border-line bg-bg-input px-2.5 py-1.5"
                      >
                        <span className={cn("h-2 w-2 rounded-full", c.dot)} />
                        <div className="min-w-0">
                          <div className="truncate text-[11px] text-text-secondary">
                            {orderStatusLabels[s]}
                          </div>
                          <div className="text-[12.5px] font-semibold text-text-primary">
                            {count}{" "}
                            <span className="text-[10.5px] font-normal text-text-muted">
                              · {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

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

const rankingTones = {
  brand: { bar: "bg-brand", chip: "bg-brand-soft text-brand" },
  success: { bar: "bg-status-resolved", chip: "bg-status-resolved/15 text-status-resolved" },
  danger: { bar: "bg-status-blocked", chip: "bg-status-blocked/15 text-status-blocked" },
  muted: { bar: "bg-text-muted", chip: "bg-bg-input text-text-secondary" },
} as const;

interface RankingCardProps {
  className?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: keyof typeof rankingTones;
  metrics: ProductMetric[];
  unit: string;
  valueOf: (m: ProductMetric) => number;
  secondaryOf?: (m: ProductMetric) => string;
  formatValue: (v: number) => string;
  emptyText: string;
}

function RankingCard({
  className,
  title,
  subtitle,
  icon,
  tone,
  metrics,
  valueOf,
  secondaryOf,
  formatValue,
  emptyText,
}: RankingCardProps) {
  const t = rankingTones[tone];
  const max = metrics.reduce((m, x) => Math.max(m, valueOf(x)), 0);
  return (
    <div className={cn("card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                t.chip,
              )}
            >
              {icon}
            </span>
            <div className="text-[13px] font-semibold text-text-primary">{title}</div>
          </div>
          <div className="mt-1 text-[11.5px] text-text-muted">{subtitle}</div>
        </div>
        <span className="rounded-full bg-bg-input px-2 py-0.5 text-[10.5px] font-semibold text-text-muted">
          TOP {Math.max(metrics.length, 0)}
        </span>
      </div>
      <div className="mt-3 space-y-2.5">
        {metrics.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-bg-input/40 px-3 py-6 text-center text-[12px] text-text-muted">
            {emptyText}
          </div>
        ) : (
          metrics.map((m, i) => {
            const v = valueOf(m);
            const pct = max > 0 ? Math.max((v / max) * 100, v > 0 ? 4 : 0) : 0;
            return (
              <div key={m.productId} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-bg-input text-[10.5px] font-bold text-text-secondary">
                      {i + 1}
                    </span>
                    <span className="truncate text-[12.5px] font-medium text-text-primary">
                      {m.productName}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {secondaryOf && (
                      <span className="text-[10.5px] text-text-muted">
                        {secondaryOf(m)}
                      </span>
                    )}
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", t.chip)}>
                      {formatValue(v)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-input">
                  <div
                    className={cn("h-full rounded-full transition-all", t.bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
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
