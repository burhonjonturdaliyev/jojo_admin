import type { Order, OrderStatus } from "../data/orders";
import type { Product } from "../data/products";

export interface ProductMetric {
  productId: string;
  productName: string;
  orders: number;
  sold: number;
  cancelled: number;
  active: number;
  revenue: number;
  avgPrice: number;
  conversionRate: number;
  cancellationRate: number;
  lastOrderAt: string | null;
}

export interface OrderTotals {
  orders: number;
  sold: number;
  cancelled: number;
  active: number;
  revenue: number;
  avgOrderValue: number;
  conversionRate: number;
  cancellationRate: number;
  byStatus: Record<OrderStatus, number>;
}

const EMPTY_STATUS: Record<OrderStatus, number> = {
  sent: 0,
  review: 0,
  confirmed: 0,
  shipping: 0,
  delivered: 0,
  cancelled: 0,
};

const ACTIVE_STATUSES: OrderStatus[] = ["sent", "review", "confirmed", "shipping"];

// Parses dates like "30.05.2024" or "30.05.2024 09:12". Returns epoch ms or NaN.
export function parseOrderDate(input: string): number {
  const [datePart, timePart] = input.trim().split(/\s+/);
  const [dd, mm, yyyy] = datePart.split(".");
  if (!dd || !mm || !yyyy) return NaN;
  const [hh = "0", mi = "0"] = (timePart ?? "").split(":");
  const d = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(mi),
  );
  return d.getTime();
}

export function isWithinDays(input: string, days: number, now = Date.now()): boolean {
  const t = parseOrderDate(input);
  if (Number.isNaN(t)) return false;
  return now - t <= days * 24 * 60 * 60 * 1000;
}

export function computeProductMetrics(
  orders: Order[],
  products?: Product[],
): ProductMetric[] {
  const map = new Map<string, ProductMetric>();

  const init = (id: string, name: string): ProductMetric => ({
    productId: id,
    productName: name,
    orders: 0,
    sold: 0,
    cancelled: 0,
    active: 0,
    revenue: 0,
    avgPrice: 0,
    conversionRate: 0,
    cancellationRate: 0,
    lastOrderAt: null,
  });

  // Seed with all known products so zero-order items still surface in rankings.
  products?.forEach((p) => map.set(p.id, init(p.id, p.name)));

  let priceSumByProduct = new Map<string, number>();

  for (const o of orders) {
    const m = map.get(o.productId) ?? init(o.productId, o.productName);
    m.orders += 1;
    priceSumByProduct.set(
      o.productId,
      (priceSumByProduct.get(o.productId) ?? 0) + o.productPrice,
    );
    if (o.status === "delivered") {
      m.sold += 1;
      m.revenue += o.productPrice;
    } else if (o.status === "cancelled") {
      m.cancelled += 1;
    } else {
      m.active += 1;
    }
    const t = parseOrderDate(o.createdAt);
    if (!Number.isNaN(t)) {
      const prev = m.lastOrderAt ? parseOrderDate(m.lastOrderAt) : -Infinity;
      if (t > prev) m.lastOrderAt = o.createdAt;
    }
    map.set(o.productId, m);
  }

  for (const m of map.values()) {
    m.avgPrice = m.orders > 0 ? Math.round((priceSumByProduct.get(m.productId) ?? 0) / m.orders) : 0;
    m.conversionRate = m.orders > 0 ? m.sold / m.orders : 0;
    m.cancellationRate = m.orders > 0 ? m.cancelled / m.orders : 0;
  }

  return Array.from(map.values());
}

export function computeOrderTotals(orders: Order[]): OrderTotals {
  const byStatus = { ...EMPTY_STATUS };
  let revenue = 0;
  let sold = 0;
  let cancelled = 0;
  let active = 0;

  for (const o of orders) {
    byStatus[o.status] += 1;
    if (o.status === "delivered") {
      sold += 1;
      revenue += o.productPrice;
    } else if (o.status === "cancelled") {
      cancelled += 1;
    }
    if (ACTIVE_STATUSES.includes(o.status)) active += 1;
  }

  const ordersCount = orders.length;
  return {
    orders: ordersCount,
    sold,
    cancelled,
    active,
    revenue,
    avgOrderValue: sold > 0 ? Math.round(revenue / sold) : 0,
    conversionRate: ordersCount > 0 ? sold / ordersCount : 0,
    cancellationRate: ordersCount > 0 ? cancelled / ordersCount : 0,
    byStatus,
  };
}

export type ProductMetricKey = keyof Pick<
  ProductMetric,
  "sold" | "orders" | "revenue" | "cancelled" | "cancellationRate" | "conversionRate"
>;

export function rankProducts(
  metrics: ProductMetric[],
  key: ProductMetricKey,
  direction: "desc" | "asc" = "desc",
  limit?: number,
): ProductMetric[] {
  const sorted = [...metrics].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    return direction === "desc" ? bv - av : av - bv;
  });
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export const EMPTY_METRIC: Omit<ProductMetric, "productId" | "productName"> = {
  orders: 0,
  sold: 0,
  cancelled: 0,
  active: 0,
  revenue: 0,
  avgPrice: 0,
  conversionRate: 0,
  cancellationRate: 0,
  lastOrderAt: null,
};
