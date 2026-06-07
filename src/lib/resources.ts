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
  role: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  age?: number | null;
  gender?: string | null;
  language?: string;
  child_status?: string | null;
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

export const broadcastApi = {
  send: (data: { title: string; body: string; category?: string }) =>
    api<{ status: boolean; sent_to: number }>("/admin/broadcast/", {
      method: "POST",
      body: data,
    }),
};

// ============================================================================
// Dashboard
// ============================================================================

export interface AdminDashboardStats {
  parents: number;
  children: number;
  active_24h: number;
  products: number;
  blog_posts: number;
  banners: number;
  sos_alerts: number;
}

export const dashboardApi = {
  stats: () => api<AdminDashboardStats>("/admin/dashboard/stats/"),
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
