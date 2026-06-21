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
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  subtitle: string;
  subtitle_uz_cyrl?: string;
  subtitle_ru?: string;
  subtitle_en?: string;
  kicker: string;
  kicker_uz_cyrl?: string;
  kicker_ru?: string;
  kicker_en?: string;
  theme: "cream" | "sky" | "green" | string;
  image: string | null;
  order: number;
  is_active: boolean;
  link_category_type?: string | null;
  link_product?: number | null;
  link_external_url?: string | null;
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
  name_ru?: string;
  name_en?: string;
  name_uz_cyrl?: string;
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

export interface AdminProductTag {
  id: number;
  slug: string;
  name: string;
  name_uz_cyrl?: string;
  name_ru?: string;
  name_en?: string;
}

export interface AdminStoreProduct {
  id: number;
  name: string;
  name_uz_cyrl?: string;
  name_ru?: string;
  name_en?: string;
  description?: string;
  description_uz_cyrl?: string;
  description_ru?: string;
  description_en?: string;
  short_description?: string;
  short_description_uz_cyrl?: string;
  short_description_ru?: string;
  short_description_en?: string;
  category_label?: string;
  category_label_uz_cyrl?: string;
  category_label_ru?: string;
  category_label_en?: string;
  tags?: AdminProductTag[];
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
  video_url?: string;
  video_urls?: string[];
  gallery_images?: string[];
  age_label?: string;
  // Yetkazib berish — yagona multilang matn maydoni.
  delivery_info?: string;
  delivery_info_ru?: string;
  delivery_info_en?: string;
  delivery_info_uz_cyrl?: string;
}

export const storeProductsApi = {
  list: (query?: {
    category_id?: number | string;
    q?: string;
    tag?: string;
  }) =>
    api<AdminStoreProduct[] | { results: AdminStoreProduct[] }>(
      "/admin/store/products/",
      { query: query as Record<string, string | number> },
    ),
  create: (data: Partial<AdminStoreProduct> & Record<string, unknown>) =>
    api<AdminStoreProduct>("/admin/store/products/", {
      method: "POST",
      body: data,
    }),
  update: (id: number, data: Partial<AdminStoreProduct> & Record<string, unknown>) =>
    api<AdminStoreProduct>(`/admin/store/products/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/store/products/${id}/`, { method: "DELETE" }),
};

export const productTagsApi = {
  list: (query?: { q?: string }) =>
    api<AdminProductTag[] | { results: AdminProductTag[] }>(
      "/admin/store/tags/",
      { query: query as Record<string, string> },
    ),
  create: (name: string) =>
    api<AdminProductTag>("/admin/store/tags/", {
      method: "POST",
      body: { name },
    }),
  update: (id: number, data: Partial<AdminProductTag>) =>
    api<AdminProductTag>(`/admin/store/tags/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/store/tags/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Blog: categories + posts (Maslahatlar)
// ============================================================================

export interface AdminBlogCategory {
  id: number;
  name: string;
  name_ru?: string;
  name_en?: string;
  name_uz_cyrl?: string;
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
  premium_active?: boolean;
  premium_expires_at?: string | null;
  premium_days_left?: number | null;
  date_joined: string;
  last_login?: string | null;
  age?: number | null;
  gender?: string | null;
  language?: string;
  child_status?: string | null;
  device_count?: number;
  last_device?: {
    type: string;
    id: string;
    brand?: string;
    model?: string;
    os_version?: string;
    app_version?: string;
  } | null;
  children?: { id: number; name: string }[];
}

export interface AdminUserFull {
  user: {
    id: number;
    phone: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    gender?: string;
    age?: number | null;
    language?: string;
    avatar?: string | null;
    role: string;
    is_active: boolean;
    date_joined: string | null;
    last_login?: string | null;
    is_premium: boolean;
    premium_active: boolean;
    premium_expires_at?: string | null;
    premium_days_left?: number | null;
  };
  children: {
    id: number;
    name: string;
    age?: number | null;
    gender?: string;
    status?: string | null;
    avatar?: string | null;
    phone?: string;
    language?: string;
    device?: {
      type: string;
      brand?: string;
      model?: string;
      os_version?: string;
      app_version?: string;
    } | null;
    linked_at?: string | null;
  }[];
  devices: {
    id: number;
    type: string;
    device_id: string;
    brand?: string;
    model?: string;
    os_version?: string;
    app_version?: string;
    is_active: boolean;
    last_login_at?: string | null;
    created_at?: string | null;
  }[];
  payments: {
    id: number;
    amount: number;
    currency: string;
    status: string;
    plan_name?: string | null;
    created_at?: string | null;
  }[];
  activity: ActivityEvent[];
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
  update: (
    id: number,
    data: Partial<{
      first_name: string;
      last_name: string;
      full_name: string;
      phone: string;
      username: string;
      age: number | null;
      gender: string;
      language: string;
      is_premium: boolean;
      is_active: boolean;
    }>,
  ) =>
    api<AdminUserRow>(`/admin/users/${id}/`, { method: "PATCH", body: data }),
  remove: (id: number) =>
    api<void>(`/admin/users/${id}/`, { method: "DELETE" }),
  full: (id: number) =>
    api<AdminUserFull>(`/admin/users/${id}/full/`),
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

export type BroadcastAudience =
  | "all"           // hamma parentlar (faol + nofaol)
  | "active"        // faqat is_active=true
  | "inactive"      // faqat is_active=false
  | "premium"       // muddati o'tmagan premium
  | "non_premium"   // premium bo'lmagan faol parentlar
  | "selected";     // parent_ids ro'yxati

export interface AdminBroadcastHistoryRow {
  title: string;
  body: string;
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  body_uz_cyrl?: string;
  body_ru?: string;
  body_en?: string;
  category: string;
  count: number;
  first_sent: string;
  last_sent: string;
  audience?: BroadcastAudience;
}

export const broadcastApi = {
  send: (data: {
    title: string;
    body: string;
    title_uz_cyrl?: string;
    title_ru?: string;
    title_en?: string;
    body_uz_cyrl?: string;
    body_ru?: string;
    body_en?: string;
    category?: string;
    send_sms?: boolean;
    audience?: BroadcastAudience;
    parent_ids?: number[];
  }) =>
    api<{
      status: boolean;
      sent_to: number;
      sms_sent?: number;
      sms_failed_count?: number;
      sms_failed?: Array<{ phone: string; normalized?: string; reason: string }>;
      audience?: BroadcastAudience;
    }>("/admin/broadcast/", { method: "POST", body: data }),
  history: (params?: { category?: string }) =>
    api<{ results: AdminBroadcastHistoryRow[] }>(
      "/admin/broadcast/history/",
      { query: params },
    ),
};

// SMSFLY provider status + bitta telefonga test xabar
export type SmsKind = "otp" | "broadcast" | "rule" | "test" | "other";

export interface SmsSendLogRow {
  id: number;
  phone: string;
  phone_normalized: string;
  kind: SmsKind;
  message: string;
  success: boolean;
  result_code: number;
  reason: string;
  retry_count: number;
  related_user_id: number | null;
  created_at: string;
}

export interface SmsLogStats {
  total: number;
  sent: number;
  failed: number;
  top_failure_reasons: Array<{ reason: string; c: number }>;
}

export const smsApi = {
  status: () =>
    api<{ enabled: boolean; key_valid: boolean }>("/admin/sms/test/"),
  test: (data: { phone: string; message?: string }) =>
    api<{
      success: boolean;
      phone: string;
      normalized?: string;
      valid?: boolean;
      reason?: string;
      result_code?: number;
      retry_count?: number;
    }>("/admin/sms/test/", {
      method: "POST",
      body: data,
    }),
  log: (params?: {
    kind?: SmsKind;
    success?: boolean;
    phone?: string;
    page_size?: number;
    offset?: number;
  }) =>
    api<{
      count: number;
      offset: number;
      page_size: number;
      results: SmsSendLogRow[];
      stats: SmsLogStats;
    }>("/admin/sms/log/", { query: params as Record<string, string | number | boolean> }),
};

// ============================================================================
// Bulk SMS — contact groups + campaigns
// ============================================================================

export interface ParsedNumber {
  raw: string;
  normalized: string;
  valid: boolean;
}

export interface SmsContact {
  id: number;
  group_id: number;
  phone: string;
  phone_normalized: string;
  name: string;
  notes: string;
  created_at: string;
}

export interface SmsContactGroup {
  id: number;
  name: string;
  description: string;
  owner_id: number | null;
  contacts_count?: number;
  created_at: string;
  updated_at: string;
  contacts?: SmsContact[];
}

export type BulkCampaignStatus = "queued" | "sending" | "done";
export type BulkCampaignSource = "manual" | "group" | "csv" | "mixed";

export interface BulkCampaignLog {
  id: number;
  phone: string;
  phone_normalized: string;
  success: boolean;
  result_code: number;
  reason: string;
  retry_count: number;
  created_at: string;
}

export interface BulkSmsCampaign {
  id: number;
  title: string;
  message: string;
  message_ru: string;
  message_en: string;
  message_uz_cyrl: string;
  status: BulkCampaignStatus;
  source: BulkCampaignSource;
  group_id: number | null;
  group_name: string | null;
  total: number;
  sent_count: number;
  failed_count: number;
  created_by_id: number | null;
  created_by_name: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  logs?: BulkCampaignLog[];
}

export const bulkSmsApi = {
  parseNumbers: (text: string) =>
    api<{ numbers: ParsedNumber[]; total: number; valid_count: number }>(
      "/admin/sms/parse-numbers/",
      { method: "POST", body: { text } },
    ),
  parseNumbersFile: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api<{ numbers: ParsedNumber[]; total: number; valid_count: number }>(
      "/admin/sms/parse-numbers/",
      { method: "POST", body: form, multipart: true },
    );
  },

  // Contact groups
  groupList: () =>
    api<{ results: SmsContactGroup[] }>("/admin/sms/groups/"),
  groupCreate: (data: { name: string; description?: string }) =>
    api<SmsContactGroup>("/admin/sms/groups/", { method: "POST", body: data }),
  groupDetail: (id: number) =>
    api<SmsContactGroup>(`/admin/sms/groups/${id}/`),
  groupUpdate: (id: number, data: { name?: string; description?: string }) =>
    api<SmsContactGroup>(`/admin/sms/groups/${id}/`, { method: "PATCH", body: data }),
  groupRemove: (id: number) =>
    api<void>(`/admin/sms/groups/${id}/`, { method: "DELETE" }),

  // Contacts
  contactList: (groupId: number) =>
    api<{ results: SmsContact[] }>(`/admin/sms/groups/${groupId}/contacts/`),
  contactAdd: (
    groupId: number,
    data: { phone?: string; name?: string; notes?: string; contacts?: Array<{ phone: string; name?: string }> },
  ) =>
    api<{ added: number; skipped: number; group_id: number }>(
      `/admin/sms/groups/${groupId}/contacts/`,
      { method: "POST", body: data },
    ),
  contactRemove: (groupId: number, contactId: number) =>
    api<void>(`/admin/sms/groups/${groupId}/contacts/${contactId}/`, {
      method: "DELETE",
    }),
  groupImportCsv: async (groupId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api<{ added: number; skipped: number; total_parsed: number }>(
      `/admin/sms/groups/${groupId}/import/`,
      { method: "POST", body: form, multipart: true },
    );
  },

  // Campaigns
  campaignList: (params?: { page_size?: number; offset?: number }) =>
    api<{
      count: number;
      offset: number;
      page_size: number;
      results: BulkSmsCampaign[];
    }>("/admin/sms/campaigns/", { query: params as Record<string, number> }),
  campaignCreate: (data: {
    title?: string;
    message: string;
    message_ru?: string;
    message_en?: string;
    message_uz_cyrl?: string;
    phones?: string[];
    group_id?: number;
    numbers_text?: string;
  }) =>
    api<{
      campaign: BulkSmsCampaign;
      failed_sample: Array<{ phone: string; reason: string }>;
    }>("/admin/sms/campaigns/", { method: "POST", body: data }),
  campaignDetail: (id: number) =>
    api<BulkSmsCampaign>(`/admin/sms/campaigns/${id}/`),
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
  parents_active_today?: number;
  children_active_today?: number;
  premium_users?: number;
  premium_revenue?: number;
  blocked_users?: number;
  products: number;
  blog_posts: number;
  banners: number;
  sos_alerts: number;
  // Tarixiy nom — backend filter `period` qatorida nechta kun bo'lsa shu
  // qator kelashi mumkin. Frontend'da uzunlikni o'zi tekshiradi.
  signups_7d?: Array<{ date: string; count: number }>;
  revenue_7d?: Array<{ date: string; amount: number }>;
  period_days?: number;
  // So'rovlar (Requests) bo'limidan so'nggi murojaatlar — Bosh sahifadagi
  // "So'nggi murojaatlar" kartochkasi shu qatordan o'qiydi (kanban emas).
  recent_requests?: Array<{
    id: number;
    title: string;
    status: string;
    source: string;
    source_section: string;
    user: { name: string; phone: string; avatar_url: string | null } | null;
    last_message_at: string;
    last_message_text: string;
    updated_at: string;
  }>;
}

export const dashboardApi = {
  stats: (params?: { period?: number }) =>
    api<AdminDashboardStats>("/admin/dashboard/stats/", {
      query: params as Record<string, number>,
    }),
};

// ============================================================================
// Orders
// ============================================================================

export interface AdminOrder {
  id: number;
  code?: string;
  status: string;
  status_label?: string;
  total_price?: number;
  unit_price?: number;
  quantity?: number;
  contact_phone?: string;
  contact_name?: string;
  address?: string;
  note?: string;
  product?: { id: number; name: string };
  /** Backend `user` nested obyekti qaytaradi (id + phone + full_name). */
  user?: { id: number; phone?: string; full_name?: string };
  /** Eski moslashish — ba'zi joylar `parent` ham o'qishi mumkin. */
  parent?: { id: number; name?: string; phone?: string };
  created_at: string;
  updated_at?: string;
}

export interface AdminOrderEvent {
  id: number;
  kind:
    | "created"
    | "status_change"
    | "cancelled_by_user"
    | "cancelled_by_admin"
    | "note";
  from_status: string;
  to_status: string;
  note: string;
  by_user_id?: number | null;
  by_user_label?: string;
  by_role?: "admin" | "user" | "system";
  at: string;
}

export const ordersApi = {
  list: (query?: { status?: string }) =>
    api<AdminOrder[] | { results: AdminOrder[] }>("/admin/orders/", {
      query: query as Record<string, string>,
    }),
  update: (
    id: number,
    data: Partial<AdminOrder> & {
      cancel_reason?: string;
      /** Status o'zgartirishda admin izohi — timeline'ga yozib qo'yiladi. */
      change_note?: string;
    },
  ) =>
    api<AdminOrder>(`/admin/orders/${id}/`, { method: "PATCH", body: data }),
  remove: (id: number) =>
    api<void>(`/admin/orders/${id}/`, { method: "DELETE" }),
  events: (id: number) =>
    api<{ results: AdminOrderEvent[] }>(`/admin/orders/${id}/events/`),
  /** Yangi keladigan (`sent` status) buyurtmalar soni — sidebar badge uchun. */
  unreadCount: () =>
    api<{ count: number }>("/admin/orders/unread-count/"),
};

// ============================================================================
// Order statuses — admin manages slug + 4-language labels + color
// ============================================================================

export interface AdminOrderStatus {
  id: number;
  slug: string;
  name: string;
  name_uz_cyrl: string;
  name_ru: string;
  name_en: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
}

export const orderStatusesApi = {
  list: () =>
    api<{ results: AdminOrderStatus[] }>("/admin/order-statuses/"),
  create: (data: {
    slug: string;
    name: string;
    name_uz_cyrl?: string;
    name_ru?: string;
    name_en?: string;
    color?: string;
    sort_order?: number;
    is_active?: boolean;
  }) =>
    api<AdminOrderStatus>("/admin/order-statuses/", {
      method: "POST",
      body: data,
    }),
  update: (
    id: number,
    data: Partial<{
      name: string;
      name_uz_cyrl: string;
      name_ru: string;
      name_en: string;
      color: string;
      sort_order: number;
      is_active: boolean;
    }>,
  ) =>
    api<AdminOrderStatus>(`/admin/order-statuses/${id}/`, {
      method: "PATCH",
      body: data,
    }),
  remove: (id: number) =>
    api<void>(`/admin/order-statuses/${id}/`, { method: "DELETE" }),
};

// ============================================================================
// Subscription plans (Premium)
// ============================================================================

export type PlanDurationType = "days" | "months" | "years";

export interface AdminPlan {
  id: number;
  name: string;
  name_ru?: string;
  name_en?: string;
  description?: string;
  description_ru?: string;
  description_en?: string;
  price?: number;
  currency?: string;
  duration_value?: number;
  duration_type?: PlanDurationType;
  is_trial?: boolean;
  trial_days?: number;
  is_active?: boolean;
  is_featured?: boolean;
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
  giveWithNotification: (data: {
    user_id: number;
    days: number;
    title?: string;
    message?: string;
    send_notification?: boolean;
  }) =>
    api<{
      status: boolean;
      user_id: number;
      days: number;
      expires_at: string | null;
    }>("/admin/subscription/give-with-notification/", {
      method: "POST",
      body: data,
    }),
  sendOffer: (data: {
    user_id: number;
    days: number;
    discount_percent?: number;
    original_price?: number;
    final_price?: number;
    currency?: string;
    title?: string;
    message?: string;
    expires_in_hours?: number;
  }) =>
    api<{
      id: number;
      status: string;
      days: number;
      discount_percent: number;
      original_price: number;
      final_price: number;
      currency: string;
      title: string;
      message: string;
      expires_at: string | null;
      created_at: string;
    }>("/admin/subscription/offer/", { method: "POST", body: data }),
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
  parent?: { id: number; name: string; phone?: string } | number | null;
  child?: { id: number; name: string } | number | null;
  sender?: { id: number; name: string } | null;
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
  broadcast: (data: {
    title: string;
    body: string;
    title_uz_cyrl?: string;
    body_uz_cyrl?: string;
    title_ru?: string;
    body_ru?: string;
    title_en?: string;
    body_en?: string;
    category?: string;
    audience?: "all" | "active" | "inactive" | "premium" | "non_premium" | "selected";
    parent_ids?: number[];
    send_sms?: boolean;
  }) =>
    api<{ sent: number; failed?: number }>("/admin/broadcast/", {
      method: "POST",
      body: data,
    }),
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
  is_superuser?: boolean;
  date_joined: string;
}

export interface AdminOperatorWithRole extends AdminOperator {
  role_id: number | null;
  role_name: string | null;
}

export const operatorsApi = {
  list: () =>
    api<{ count: number; results: AdminOperatorWithRole[] }>("/admin/operators/"),
  create: (data: {
    phone: string;
    password: string;
    full_name?: string;
    role_id?: number | null;
    is_superuser?: boolean;
  }) =>
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
      is_superuser: boolean;
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

export type TranslateLang = "uz" | "uz_cyrl" | "ru" | "en";

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
  name_uz_cyrl?: string;
  name_ru?: string;
  name_en?: string;
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
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  description: string;
  description_uz_cyrl?: string;
  description_ru?: string;
  description_en?: string;
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
// Kids video kontent — Play tab (YouTube videolari)
// ============================================================================

export interface AdminKidsVideoCategory {
  id: number;
  name: string;
  name_uz_cyrl?: string;
  name_ru: string;
  name_en: string;
  icon: string | null;
  is_active: boolean;
  order: number;
  videos_count: number;
}

export interface AdminKidsVideo {
  id: number;
  category: number;
  category_name?: string | null;
  title: string;
  title_uz_cyrl?: string;
  title_ru: string;
  title_en: string;
  description: string;
  description_uz_cyrl?: string;
  description_ru: string;
  description_en: string;
  youtube_url: string;
  youtube_id?: string;
  thumbnail: string | null;
  thumbnail_url?: string | null;
  duration_label: string;
  age_min: number;
  age_max: number;
  views_count?: number;
  is_active: boolean;
  is_featured: boolean;
  order: number;
}

export const kidsVideosApi = {
  categories: {
    list: () =>
      api<{ results: AdminKidsVideoCategory[] }>(
        "/admin/kids/video-categories/",
      ),
    create: (data: Partial<AdminKidsVideoCategory>) =>
      api<AdminKidsVideoCategory>("/admin/kids/video-categories/", {
        method: "POST",
        body: data,
      }),
    update: (id: number, data: Partial<AdminKidsVideoCategory>) =>
      api<AdminKidsVideoCategory>(`/admin/kids/video-categories/${id}/`, {
        method: "PATCH",
        body: data,
      }),
    remove: (id: number) =>
      api<void>(`/admin/kids/video-categories/${id}/`, { method: "DELETE" }),
  },
  videos: {
    list: (q?: { category_id?: number; q?: string }) =>
      api<{ results: AdminKidsVideo[] }>("/admin/kids/videos/", { query: q }),
    create: (data: Partial<AdminKidsVideo>) =>
      api<AdminKidsVideo>("/admin/kids/videos/", {
        method: "POST",
        body: data,
      }),
    update: (id: number, data: Partial<AdminKidsVideo>) =>
      api<AdminKidsVideo>(`/admin/kids/videos/${id}/`, {
        method: "PATCH",
        body: data,
      }),
    remove: (id: number) =>
      api<void>(`/admin/kids/videos/${id}/`, { method: "DELETE" }),
  },
};

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

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
  device?: AdminDeviceBrief | null;
}

export interface AdminChildFull {
  child: {
    id: number;
    phone?: string;
    username: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    gender?: string;
    age?: number | null;
    language?: string;
    avatar?: string | null;
    child_status?: string;
    is_active: boolean;
    date_joined: string | null;
    last_login?: string | null;
  };
  parents: Array<{
    id: number;
    name: string;
    phone?: string;
    linked_at?: string | null;
  }>;
  devices: Array<{
    id: number;
    type: string;
    device_id: string;
    brand?: string;
    model?: string;
    os_version?: string;
    app_version?: string;
    is_active: boolean;
    last_login_at?: string | null;
    created_at?: string | null;
  }>;
  activity: ActivityEvent[];
}

export const childrenApi = {
  list: (query?: { offset?: number; page_size?: number }) =>
    api<{
      count: number;
      results: AdminChild[];
      offset: number;
      page_size: number;
    }>("/admin/children/", { query: query as Record<string, number> }),
  update: (
    id: number,
    data: Partial<{
      first_name: string;
      phone: string;
      username: string;
      age: number | null;
      gender: string;
      language: string;
      is_active: boolean;
    }>,
  ) =>
    api<AdminChild>(`/admin/children/${id}/`, { method: "PATCH", body: data }),
  remove: (id: number) =>
    api<void>(`/admin/children/${id}/`, { method: "DELETE" }),
  full: (id: number) =>
    api<AdminChildFull>(`/admin/children/${id}/full/`),
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

export interface AdminDeviceBrief {
  type: string;
  brand?: string;
  model?: string;
  os_version?: string;
  app_version?: string;
  last_login_at?: string | null;
  is_active?: boolean;
}

export interface AdminLeadParent {
  id: number;
  name: string;
  phone: string | null;
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
  device?: AdminDeviceBrief | null;
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
    language?: string;
    device?: AdminDeviceBrief | null;
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
  activity: ActivityEvent[];
}

export interface ActivityEvent {
  type: string;
  at: string | null;
  i18n_key: string;
  params: Record<string, string | number>;
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
  attachment_url?: string | null;
  attachment_kind?: "" | "photo" | "document";
  attachment_name?: string;
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

// Backend DRF default pagination o'chirilgan — ListCreateAPIView flat array
// qaytaradi. Frontend ikkala shaklni ham qabul qila olsin:
//   [...]                 → list
//   { results: [...] }    → pagination
export const quickRepliesApi = {
  list: () =>
    api<SupportQuickReply[] | { results: SupportQuickReply[] }>(
      "/admin/support/quick-replies/",
    ),
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
  board: (params?: {
    q?: string;
    operator_id?: number;
    per_column?: number;
    source?: string;
  }) =>
    api<LeadBoardResponse>("/admin/leads/board/", { query: params }),
  // Sidebar badge sanog'i.
  //   mode="new" (default) — sof "Yangi" status sanog'i (CRM uchun
  //     kanban "Yangi" kolonkasi bilan to'liq mos keladi).
  //   mode="needs_reply" — operator javob bermagan / foydalanuvchi qayta
  //     yozgan tikketlar (telegram support chat uchun).
  unreadCount: (params?: {
    source?: string;
    mode?: "new" | "needs_reply";
  }) =>
    api<{ count: number }>("/admin/leads/unread-count/", {
      query: params as Record<string, string>,
    }),
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
  // Fayl (rasm/hujjat) + ixtiyoriy matn yuboradi. Backend multipart-ni
  // qabul qiladi va Telegram orqali foydalanuvchiga ham yetkazadi.
  addCommentWithFile: (id: number, file: File, text?: string) => {
    const form = new FormData();
    form.append("attachment", file);
    if (text && text.trim()) form.append("text", text.trim());
    return api<LeadComment>(`/admin/leads/${id}/comments/`, {
      method: "POST",
      body: form,
      multipart: true,
    });
  },
};
