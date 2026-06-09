/**
 * Resource hooks — admin paneldagi har bir bo'lim uchun CRUD operatsiyalari.
 *
 * Har bir resource:
 *   list(query?) → list
 *   create(data) → created
 *   update(id, data) → updated
 *   remove(id)    → void
 *
 * Pagination: backend DRF, lekin admin endpointlari hozircha cheklanmagan
 * — list to'liq qaytaradi (kerak bo'lganda offset/page_size qo'shilsin).
 */

import { api } from "./api";

// ============================================================================
// Banners
// ============================================================================

export interface AdminBanner {
  id: number;
  title: string;
  subtitle: string;
  kicker: string;
  theme: "cream" | "sky" | "green" | string;
  image: string | null;
  order: number;
  is_active: boolean;
  link_category_type?: string | null;
  link_product?: number | null;
  placeholder_label?: string;
  placeholder_tint?: string;
  gift_icon?: string | null;
}

export const bannersApi = {
  list: () => api<AdminBanner[] | { results: AdminBanner[] }>("/admin/banners/"),
  create: (data: Partial<AdminBanner>) =>
    api<AdminBanner>("/admin/banners/", { method: "POST", body: data }),
  update: (id: number, data: Partial<AdminBanner>) =>
    api<AdminBanner>(`/admin/banners/${id}/`, { method: "PATCH", body: data }),
  remove: (id: number) =>
    api<void>(`/admin/banners/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Store: categories + products
// ============================================================================

export interface AdminStoreCategory {
  id: number;
  name: string;
  slug?: string;
  category_type?: string;
  icon?: string | null;
  order?: number;
  is_active?: boolean;
}

export const storeCategoriesApi = {
  list: () =>
    api<AdminStoreCategory[] | { results: AdminStoreCategory[] }>(
      "/admin/store/categories/",
    ),
  create: (data: Partial<AdminStoreCategory>) =>
    api<AdminStoreCategory>("/admin/store/categories/", {
      method: "POST",
      body: data,
    }),
  update: (id: number, data: Partial<AdminStoreCategory>) =>
    api<AdminStoreCategory>(`/admin/store/categories/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/store/categories/${id}/`, { method: "DELETE" }),
};

export interface AdminStoreProduct {
  id: number;
  name: string;
  description?: string;
  price?: number;
  old_price?: number | null;
  category?: number | null;
  cover_image?: string | null;
  product_type?: string;
  brand?: string;
  is_active?: boolean;
  is_featured?: boolean;
  has_active_deal?: boolean;
  deal_ends_at?: string | null;
  stock_count?: number;
}

export const storeProductsApi = {
  list: (query?: {
    category_id?: number | string;
    q?: string;
  }) =>
    api<AdminStoreProduct[] | { results: AdminStoreProduct[] }>(
      "/admin/store/products/",
      { query: query as Record<string, string | number> },
    ),
  create: (data: Partial<AdminStoreProduct>) =>
    api<AdminStoreProduct>("/admin/store/products/", {
      method: "POST",
      body: data,
    }),
  update: (id: number, data: Partial<AdminStoreProduct>) =>
    api<AdminStoreProduct>(`/admin/store/products/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/store/products/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Blog: categories + posts (Maslahatlar)
// ============================================================================

export interface AdminBlogCategory {
  id: number;
  name: string;
  slug?: string;
  icon?: string | null;
  order?: number;
  is_active?: boolean;
}

export const blogCategoriesApi = {
  list: () =>
    api<AdminBlogCategory[] | { results: AdminBlogCategory[] }>(
      "/admin/blog/categories/",
    ),
  create: (data: Partial<AdminBlogCategory>) =>
    api<AdminBlogCategory>("/admin/blog/categories/", {
      method: "POST",
      body: data,
    }),
  update: (id: number, data: Partial<AdminBlogCategory>) =>
    api<AdminBlogCategory>(`/admin/blog/categories/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/blog/categories/${id}/`, { method: "DELETE" }),
};

export interface AdminBlogPost {
  id: number;
  title: string;
  excerpt?: string;
  body?: string;
  cover_image?: string | null;
  category?: number | null;
  post_type?: string;
  read_minutes?: number;
  is_active?: boolean;
  is_featured?: boolean;
  published_at?: string | null;
}

export const blogPostsApi = {
  list: (query?: { category_id?: number | string; q?: string }) =>
    api<AdminBlogPost[] | { results: AdminBlogPost[] }>(
      "/admin/blog/posts/",
      { query: query as Record<string, string | number> },
    ),
  create: (data: Partial<AdminBlogPost>) =>
    api<AdminBlogPost>("/admin/blog/posts/", { method: "POST", body: data }),
  update: (id: number, data: Partial<AdminBlogPost>) =>
    api<AdminBlogPost>(`/admin/blog/posts/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/blog/posts/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Users
// ============================================================================

export interface AdminUserRow {
  id: number;
  phone: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_staff: boolean;
  is_premium?: boolean;
  date_joined: string;
  last_login?: string | null;
  age?: number | null;
  gender?: string | null;
  language?: string;
  child_status?: string | null;
  device_count?: number;
  last_device?: { type: string; id: string } | null;
}

export const usersApi = {
  list: (query?: {
    role?: string;
    q?: string;
    is_active?: boolean;
    offset?: number;
    page_size?: number;
  }) =>
    api<{
      count: number;
      results: AdminUserRow[];
      offset: number;
      page_size: number;
    }>("/admin/users/", {
      query: query as Record<string, string | number | boolean>,
    }),
  toggleActive: (id: number) =>
    api<{ id: number; is_active: boolean }>(
      `/admin/users/${id}/toggle-active/`,
      { method: "POST" },
    ),
};

// ============================================================================
// SOS list (read-only)
// ============================================================================

export interface AdminSOSRow {
  id: number;
  child: { id: number; name: string };
  parent: { id: number; name: string };
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  status: string;
  created_at: string;
}

export const sosApi = {
  list: (query?: { offset?: number; page_size?: number }) =>
    api<{
      count: number;
      results: AdminSOSRow[];
      offset: number;
      page_size: number;
    }>("/admin/sos/", { query: query as Record<string, number> }),
};

// ============================================================================
// Broadcast (Elon / Announcement) — barcha parentlarga umumiy notif.
// ============================================================================

export interface AdminBroadcastHistoryRow {
  title: string;
  body: string;
  category: string;
  count: number;
  first_sent: string;
  last_sent: string;
}

export const broadcastApi = {
  send: (data: { title: string; body: string; category?: string }) =>
    api<{ status: boolean; sent_to: number }>("/admin/broadcast/", {
      method: "POST",
      body: data,
    }),
  history: (params?: { category?: string }) =>
    api<{ results: AdminBroadcastHistoryRow[] }>(
      "/admin/broadcast/history/",
      { query: params },
    ),
};

// ============================================================================
// Dashboard
// ============================================================================

export interface AdminDashboardStats {
  parents: number;
  parents_delta_pct?: number;
  children: number;
  children_connected?: number;
  active_24h: number;
  premium_users?: number;
  premium_revenue?: number;
  blocked_users?: number;
  products: number;
  blog_posts: number;
  banners: number;
  sos_alerts: number;
  signups_7d?: Array<{ date: string; count: number }>;
  revenue_7d?: Array<{ date: string; amount: number }>;
}

export const dashboardApi = {
  stats: () => api<AdminDashboardStats>("/admin/dashboard/stats/"),
};

// ============================================================================
// Orders
// ============================================================================

export interface AdminOrder {
  id: number;
  status: string;
  total_price?: number;
  quantity?: number;
  contact_phone?: string;
  contact_name?: string;
  address?: string;
  note?: string;
  product?: { id: number; name: string };
  parent?: { id: number; name?: string; phone?: string };
  created_at: string;
}

export const ordersApi = {
  list: (query?: { status?: string }) =>
    api<AdminOrder[] | { results: AdminOrder[] }>("/admin/orders/", {
      query: query as Record<string, string>,
    }),
  update: (id: number, data: Partial<AdminOrder>) =>
    api<AdminOrder>(`/admin/orders/${id}/`, { method: "PATCH", body: data }),
};

// ============================================================================
// Subscription plans (Premium)
// ============================================================================

export interface AdminPlan {
  id: number;
  name: string;
  description?: string;
  price_uzs?: number;
  duration_days?: number;
  is_active?: boolean;
  order?: number;
}

export const plansApi = {
  list: () => api<AdminPlan[] | { results: AdminPlan[] }>("/admin/subscription/plans/"),
  create: (data: Partial<AdminPlan>) =>
    api<AdminPlan>("/admin/subscription/plans/", { method: "POST", body: data }),
  update: (id: number, data: Partial<AdminPlan>) =>
    api<AdminPlan>(`/admin/subscription/plans/${id}/`, { method: "PATCH", body: data }),
  remove: (id: number) =>
    api<void>(`/admin/subscription/plans/${id}/`, { method: "DELETE" }),
};

export interface AdminPayment {
  id: number;
  user?: { id: number; phone?: string };
  plan?: { id: number; name: string };
  amount_uzs?: number;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
}

export const paymentsApi = {
  list: (query?: { status?: string }) =>
    api<AdminPayment[] | { results: AdminPayment[] }>("/admin/subscription/payments/", {
      query: query as Record<string, string>,
    }),
};

// ============================================================================
// Notifications (history)
// ============================================================================

export interface AdminNotificationRow {
  id: number;
  parent?: number;
  child?: number | null;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: (query?: { category?: string }) =>
    api<AdminNotificationRow[] | { results: AdminNotificationRow[] }>("/admin/notifications/", {
      query: query as Record<string, string>,
    }),
  update: (
    id: number,
    data: Partial<{ title: string; body: string; category: string }>,
  ) =>
    api<{ id: number; title: string; body: string; category: string }>(
      `/admin/notifications/${id}/`,
      { method: "PATCH", body: data },
    ),
  remove: (id: number) =>
    api<void>(`/admin/notifications/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Tickets / Call center
// ============================================================================

export interface AdminTicket {
  id: number;
  subject: string;
  status: string;
  priority?: string;
  user?: { id: number; name?: string; phone?: string };
  assignee?: { id: number; name?: string };
  created_at: string;
  updated_at?: string | null;
}

export const ticketsApi = {
  list: (query?: { status?: string; offset?: number; page_size?: number }) =>
    api<{
      count: number;
      results: AdminTicket[];
      offset: number;
      page_size: number;
    }>("/admin/tickets/", { query: query as Record<string, string | number> }),
  updateStatus: (id: number, status: string) =>
    api<{ id: number; status: string }>(`/admin/tickets/${id}/status/`, {
      method: "POST",
      body: { status },
    }),
};

// ============================================================================
// Operators (call-center staff)
// ============================================================================

export interface AdminOperator {
  id: number;
  phone: string;
  username: string;
  first_name: string;
  last_name?: string;
  is_active: boolean;
  date_joined: string;
}

export const operatorsApi = {
  list: () =>
    api<{ count: number; results: AdminOperator[] }>("/admin/operators/"),
  create: (data: { phone: string; password: string; full_name?: string }) =>
    api<AdminOperator>("/admin/operators/create/", {
      method: "POST",
      body: data,
    }),
  update: (
    id: number,
    data: Partial<{
      full_name: string;
      phone: string;
      is_active: boolean;
      new_password: string;
    }>,
  ) =>
    api<AdminOperator>(`/admin/operators/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/operators/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Kids kontent — Games
// ============================================================================

export interface AdminGameCategory {
  id: number;
  name: string;
  icon: string | null;
  is_active: boolean;
  order: number;
  games_count: number;
}

export interface AdminGame {
  id: number;
  category: number;
  category_name?: string | null;
  title: string;
  description: string;
  thumbnail: string | null;
  banner: string | null;
  game_url: string;
  screen_key: string;
  age_min: number;
  age_max: number;
  reward_points: number;
  is_active: boolean;
  is_featured: boolean;
  order: number;
}

export const kidsContentApi = {
  categories: {
    list: () =>
      api<{ results: AdminGameCategory[] }>("/admin/kids/categories/"),
    create: (data: Partial<AdminGameCategory>) =>
      api<AdminGameCategory>("/admin/kids/categories/", {
        method: "POST",
        body: data,
      }),
    update: (id: number, data: Partial<AdminGameCategory>) =>
      api<AdminGameCategory>(`/admin/kids/categories/${id}/`, {
        method: "PATCH",
        body: data,
      }),
    remove: (id: number) =>
      api<void>(`/admin/kids/categories/${id}/`, { method: "DELETE" }),
  },
  games: {
    list: (q?: { category_id?: number; q?: string }) =>
      api<{ results: AdminGame[] }>("/admin/kids/games/", { query: q }),
    create: (data: Partial<AdminGame>) =>
      api<AdminGame>("/admin/kids/games/", { method: "POST", body: data }),
    update: (id: number, data: Partial<AdminGame>) =>
      api<AdminGame>(`/admin/kids/games/${id}/`, {
        method: "PATCH",
        body: data,
      }),
    remove: (id: number) =>
      api<void>(`/admin/kids/games/${id}/`, { method: "DELETE" }),
  },
};

// ============================================================================
// Children (read-only)
// ============================================================================

export interface AdminChild {
  id: number;
  phone?: string;
  username: string;
  first_name?: string;
  child_status?: string | null;
  age?: number | null;
  gender?: string | null;
  language?: string;
  is_active: boolean;
  date_joined: string;
}

export const childrenApi = {
  list: (query?: { offset?: number; page_size?: number }) =>
    api<{
      count: number;
      results: AdminChild[];
      offset: number;
      page_size: number;
    }>("/admin/children/", { query: query as Record<string, number> }),
};

// ============================================================================
// Settings — change password
// ============================================================================

export const settingsApi = {
  changePassword: (old_password: string, new_password: string) =>
    api<{ status: boolean }>("/admin/change-password/", {
      method: "POST",
      body: { old_password, new_password },
    }),
};

// ============================================================================
// Helpers — list response shape normallashtirish
// ============================================================================

/** API list endpoint'i to'g'ridan-to'g'ri array yoki `{results: [...]}` qaytarishi mumkin. */
export function unwrapList<T>(value: T[] | { results?: T[] } | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.results ?? [];
}

// ============================================================================
// Leads (kanban)
// ============================================================================

export type LeadStatus =
  | "new"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed"
  | "blocked";

export interface AdminLeadParent {
  id: number;
  name: string;
  phone: string | null;
  email?: string;
  gender?: string;
  avatar: string | null;
  child_count?: number;
  child_connected?: boolean;
  premium_active?: boolean;
  premium_expires_at?: string | null;
  premium_days_left?: number | null;
  is_active?: boolean;
  registered_at?: string | null;
  last_activity?: string | null;
  language?: string;
}

export interface AdminLead {
  id: number;
  title: string;
  description: string;
  status: LeadStatus;
  priority: string;
  parent: AdminLeadParent | null;
  operator: { id: number; name: string } | null;
  last_contact_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  comments_count: number;
}

export interface AdminLeadFull {
  lead: AdminLead;
  children: Array<{
    id: number;
    name: string;
    age: number | null;
    gender: string | null;
    status: string;
    avatar: string | null;
    phone: string | null;
    linked_at: string | null;
  }>;
  payments: Array<{
    id: number;
    amount: number;
    currency: string;
    status: string;
    plan_name: string | null;
    created_at: string;
  }>;
  activity: Array<{
    type: string;
    label: string;
    at: string | null;
  }>;
}

export interface LeadBoardResponse {
  statuses: LeadStatus[];
  counts: Record<LeadStatus, number>;
  columns: Record<LeadStatus, AdminLead[]>;
}

export interface LeadComment {
  id: number;
  ticket_id: number;
  text: string;
  old_status: string;
  new_status: string;
  operator: { id: number; name: string } | null;
  created_at: string;
}

export const leadsApi = {
  board: (params?: { q?: string; operator_id?: number; per_column?: number }) =>
    api<LeadBoardResponse>("/admin/leads/board/", { query: params }),
  create: (data: {
    parent_id: number;
    title?: string;
    description?: string;
    priority?: string;
    status?: LeadStatus;
  }) => api<AdminLead>("/admin/leads/", { method: "POST", body: data }),
  detail: (id: number) => api<AdminLead>(`/admin/leads/${id}/`),
  full: (id: number) => api<AdminLeadFull>(`/admin/leads/${id}/full/`),
  update: (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      status: LeadStatus;
      priority: string;
      operator_id: number | null;
    }>,
  ) => api<AdminLead>(`/admin/leads/${id}/`, { method: "PATCH", body: data }),
  remove: (id: number) =>
    api<void>(`/admin/leads/${id}/`, { method: "DELETE" }),
  comments: (id: number) =>
    api<{ results: LeadComment[] }>(`/admin/leads/${id}/comments/`),
  addComment: (id: number, text: string) =>
    api<LeadComment>(`/admin/leads/${id}/comments/`, {
      method: "POST",
      body: { text },
    }),
};
