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
  // Backend `BlogPost` modeli real maydonlari: `title` (uz), `title_ru`,
  // `title_en`, `short_description`/`_ru`/`_en`, `content`/`_ru`/`_en`.
  // `excerpt` va `body` — admin serializer'da uz uchun alias (DRF source=).
  title: string;
  title_ru?: string;
  title_en?: string;
  excerpt?: string; // alias of short_description (uz only)
  short_description?: string;
  short_description_ru?: string;
  short_description_en?: string;
  body?: string; // alias of content (uz only)
  content?: string;
  content_ru?: string;
  content_en?: string;
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
  send: (data: {
    title: string;
    body: string;
    title_ru?: string;
    title_en?: string;
    body_ru?: string;
    body_en?: string;
    category?: string;
    send_sms?: boolean;
  }) =>
    api<{ status: boolean; sent_to: number; sms_sent?: number }>(
      "/admin/broadcast/",
      { method: "POST", body: data },
    ),
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

/**
 * Foydalanuvchiga superadmin tomonidan premium berish.
 * Backend `/api/admin/subscription/give/` — `is_superuser` talab qiladi.
 */
export const subscriptionGiveApi = {
  give: (data: { user_id?: number; phone?: string; days: number }) =>
    api<{
      status: boolean;
      detail: string;
      subscription?: { id: number; expires_at: string };
      user?: { id: number; is_premium: boolean; premium_expires_at: string };
    }>("/admin/subscription/give/", { method: "POST", body: data }),
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

export interface AdminOperatorWithRole extends AdminOperator {
  role_id: number | null;
  role_name: string | null;
}

export const operatorsApi = {
  list: () =>
    api<{ count: number; results: AdminOperatorWithRole[] }>("/admin/operators/"),
  create: (data: { phone: string; password: string; full_name?: string; role_id?: number | null }) =>
    api<AdminOperatorWithRole>("/admin/operators/create/", {
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
      role_id: number | null;
    }>,
  ) =>
    api<AdminOperatorWithRole>(`/admin/operators/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/operators/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Admin Roles
// ============================================================================

export interface AdminRole {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  users_count: number;
  created_at: string;
  updated_at: string;
}

export const adminRolesApi = {
  list: () =>
    api<{
      count: number;
      results: AdminRole[];
      available_permissions: string[];
    }>("/admin/roles/"),
  create: (data: { name: string; description?: string; permissions?: string[] }) =>
    api<AdminRole>("/admin/roles/", { method: "POST", body: data }),
  update: (id: number, data: Partial<{ name: string; description: string; permissions: string[] }>) =>
    api<AdminRole>(`/admin/roles/${id}/`, { method: "PATCH", body: data }),
  remove: (id: number) =>
    api<void>(`/admin/roles/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Auto-translate (admin "Auto" tugmasi)
// ============================================================================

export type TranslateLang = "uz" | "ru" | "en";

export const translateApi = {
  one: (text: string, source: TranslateLang, target: TranslateLang) =>
    api<{ text: string; source: string; target: string }>("/admin/translate/", {
      method: "POST",
      body: { text, source, target },
    }),
  all: (text: string, source: TranslateLang) =>
    api<{
      translations: Record<TranslateLang, string>;
      source: string;
    }>("/admin/translate/", {
      method: "POST",
      body: { text, source },
    }),
};

// ============================================================================
// Notification Rules — avtomatik rejaviy bildirishnomalar
// ============================================================================

export type NotifTriggerType =
  | "premium_expiry"
  | "daily"
  | "weekly"
  | "monthly"
  | "one_off";

export type NotifAudience =
  | "all_parents"
  | "premium_active"
  | "premium_expiring"
  | "free_users"
  | "no_active_child";

export interface AdminNotifRule {
  id: number;
  name: string;
  trigger_type: NotifTriggerType;
  trigger_params: Record<string, unknown>;
  audience: NotifAudience;
  audience_params: Record<string, unknown>;
  title: string;
  title_ru?: string;
  title_en?: string;
  body: string;
  body_ru?: string;
  body_en?: string;
  category: string;
  send_push: boolean;
  send_sms: boolean;
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at: string;
}

export interface AdminNotifRuleLog {
  id: number;
  fired_at: string;
  recipients_count: number;
  push_sent: number;
  sms_sent: number;
  success: boolean;
  detail: string;
}

export const notifRulesApi = {
  list: () => api<{ results: AdminNotifRule[] }>("/admin/notification-rules/"),
  create: (data: Partial<AdminNotifRule>) =>
    api<AdminNotifRule>("/admin/notification-rules/", {
      method: "POST",
      body: data,
    }),
  update: (id: number, data: Partial<AdminNotifRule>) =>
    api<AdminNotifRule>(`/admin/notification-rules/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/notification-rules/${id}/`, { method: "DELETE" }),
  runNow: (id: number) =>
    api<{
      id: number;
      recipients_count: number;
      push_sent: number;
      sms_sent: number;
      success: boolean;
      detail: string;
    }>(`/admin/notification-rules/${id}/run-now/`, { method: "POST" }),
  logs: (id: number) =>
    api<{ results: AdminNotifRuleLog[] }>(
      `/admin/notification-rules/${id}/logs/`,
    ),
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

export interface AdminChildParent {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

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
  parent?: AdminChildParent | null;
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

export type SupportLanguage = "uz_latn" | "uz_cyrl" | "ru" | "en";
export type SupportSource = "app" | "telegram" | "manual";
export type SupportBotState =
  | "awaiting_language"
  | "chatting"
  | "awaiting_rating"
  | "done";

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
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  comments_count: number;
  source?: SupportSource;
  language?: SupportLanguage | "";
  bot_state?: SupportBotState | "";
  rating?: number | null;
  rating_comment?: string;
  rated_at?: string | null;
  last_message?: {
    text: string;
    direction: "in" | "out";
    at: string;
  } | null;
  last_user_message_at?: string | null;
  telegram?: {
    chat_id: string | null;
    username: string;
    name: string;
  } | null;
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
  direction?: "in" | "out";
  is_operator?: boolean;
  old_status: string;
  new_status: string;
  operator: { id: number; name: string } | null;
  created_at: string;
}

// ============================================================================
// Support quick replies (operator shortcuts / canned responses)
// ============================================================================

export interface SupportQuickReply {
  id: number;
  code: string;
  title: string;
  scope: "global" | "personal";
  owner_id: number | null;
  text_uz_latn: string;
  text_uz_cyrl: string;
  text_ru: string;
  text_en: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

export const quickRepliesApi = {
  list: () =>
    api<{ results: SupportQuickReply[] }>("/admin/support/quick-replies/"),
  create: (data: Partial<SupportQuickReply>) =>
    api<SupportQuickReply>("/admin/support/quick-replies/", {
      method: "POST",
      body: data,
    }),
  update: (id: number, data: Partial<SupportQuickReply>) =>
    api<SupportQuickReply>(`/admin/support/quick-replies/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/support/quick-replies/${id}/`, { method: "DELETE" }),
};

export function quickReplyTextFor(
  qr: SupportQuickReply,
  language: SupportLanguage | "" | undefined,
): string {
  const mapping: Record<string, string> = {
    uz_latn: qr.text_uz_latn,
    uz_cyrl: qr.text_uz_cyrl,
    ru: qr.text_ru,
    en: qr.text_en,
  };
  return (
    (language && mapping[language]) ||
    qr.text_uz_latn ||
    qr.text_ru ||
    qr.text_en ||
    qr.text_uz_cyrl ||
    ""
  );
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
  addComment: (
    id: number,
    body: { text?: string; quick_reply_id?: number },
  ) =>
    api<LeadComment>(`/admin/leads/${id}/comments/`, {
      method: "POST",
      body,
    }),
};
