/**
 * Backend (Django) ⇄ Admin UI ma'lumot ko'rinishlari orasidagi adapter.
 *
 * Admin UI ko'pchilik shakl'larda lokal "seed" data shaklini ishlatadi
 * (kebab-case yoki camelCase fieldlar, lokalized stringlar, va h.k.).
 * Backend esa snake_case + flat strings. Bu fayl ikkalasini bog'laydi.
 */

import type {
  AdminBanner,
  AdminBlogCategory,
  AdminBlogPost,
  AdminStoreCategory,
  AdminStoreProduct,
} from "./resources";

import type { PromoBanner } from "../data/banners";
import { type Localized, toLocalized } from "../types/locale";

// ============================================================================
// Banners
// ============================================================================

export function bannerToUi(b: AdminBanner): PromoBanner {
  return {
    id: String(b.id),
    kicker: toLocalized(b.kicker || ""),
    title: toLocalized(b.title || ""),
    subtitle: toLocalized(b.subtitle || ""),
    theme: (b.theme as PromoBanner["theme"]) || "sky",
    imageUrl: b.image ?? null,
    actionType:
      b.link_product != null
        ? "openProduct"
        : b.link_category_type
          ? "filterByType"
          : "none",
    actionValue:
      b.link_product != null
        ? String(b.link_product)
        : b.link_category_type || "",
    sortOrder: b.order ?? 0,
    isActive: b.is_active ?? true,
  };
}

function pickFirstFromLocalized(value: Localized<string> | string): string {
  if (typeof value === "string") return value;
  return value.uz || value.ru || value.en || "";
}

export function bannerToApi(b: PromoBanner): Partial<AdminBanner> {
  const action =
    b.actionType === "openProduct"
      ? { link_product: Number(b.actionValue) || null }
      : b.actionType === "filterByType"
        ? { link_category_type: b.actionValue || null, link_product: null }
        : { link_product: null, link_category_type: null };
  return {
    title: pickFirstFromLocalized(b.title),
    subtitle: pickFirstFromLocalized(b.subtitle),
    kicker: pickFirstFromLocalized(b.kicker),
    theme: b.theme,
    image: b.imageUrl,
    order: b.sortOrder,
    is_active: b.isActive,
    ...action,
  };
}

// ============================================================================
// Store products
// ============================================================================

export interface UiProduct {
  id: string;
  name: string;
  description: string;
  priceUzs: number;
  oldPriceUzs: number | null;
  categoryId: string | null;
  image: string | null;
  type: string;
  brand: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
}

export function productToUi(p: AdminStoreProduct): UiProduct {
  return {
    id: String(p.id),
    name: p.name || "",
    description: p.description || "",
    priceUzs: p.price ?? 0,
    oldPriceUzs: p.old_price ?? null,
    categoryId: p.category != null ? String(p.category) : null,
    image: p.cover_image ?? null,
    type: p.product_type || "",
    brand: p.brand || "",
    isActive: p.is_active ?? true,
    isFeatured: p.is_featured ?? false,
    stock: p.stock_count ?? 0,
  };
}

export function productToApi(u: UiProduct): Partial<AdminStoreProduct> {
  return {
    name: u.name,
    description: u.description,
    price: u.priceUzs,
    old_price: u.oldPriceUzs,
    category: u.categoryId != null ? Number(u.categoryId) : null,
    cover_image: u.image,
    product_type: u.type,
    brand: u.brand,
    is_active: u.isActive,
    is_featured: u.isFeatured,
    stock_count: u.stock,
  };
}

// ============================================================================
// Store categories
// ============================================================================

export interface UiCategory {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export function categoryToUi(c: AdminStoreCategory): UiCategory {
  return {
    id: String(c.id),
    name: c.name || "",
    type: c.category_type || "",
    icon: c.icon ?? null,
    order: c.order ?? 0,
    isActive: c.is_active ?? true,
  };
}

export function categoryToApi(u: UiCategory): Partial<AdminStoreCategory> {
  return {
    name: u.name,
    category_type: u.type,
    icon: u.icon,
    order: u.order,
    is_active: u.isActive,
  };
}

// ============================================================================
// Blog posts (Maslahatlar)
// ============================================================================

export interface UiAdvice {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  image: string | null;
  categoryId: string | null;
  type: string;
  readMinutes: number;
  isActive: boolean;
  isFeatured: boolean;
}

export function adviceToUi(p: AdminBlogPost): UiAdvice {
  return {
    id: String(p.id),
    title: p.title || "",
    excerpt: p.excerpt || "",
    body: p.body || "",
    image: p.cover_image ?? null,
    categoryId: p.category != null ? String(p.category) : null,
    type: p.post_type || "",
    readMinutes: p.read_minutes ?? 0,
    isActive: p.is_active ?? true,
    isFeatured: p.is_featured ?? false,
  };
}

export function adviceToApi(u: UiAdvice): Partial<AdminBlogPost> {
  return {
    title: u.title,
    excerpt: u.excerpt,
    body: u.body,
    cover_image: u.image,
    category: u.categoryId != null ? Number(u.categoryId) : null,
    post_type: u.type,
    read_minutes: u.readMinutes,
    is_active: u.isActive,
    is_featured: u.isFeatured,
  };
}

// ============================================================================
// Blog categories
// ============================================================================

export interface UiBlogCategory {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export function blogCategoryToUi(c: AdminBlogCategory): UiBlogCategory {
  return {
    id: String(c.id),
    name: c.name || "",
    icon: c.icon ?? null,
    order: c.order ?? 0,
    isActive: c.is_active ?? true,
  };
}

export function blogCategoryToApi(
  u: UiBlogCategory,
): Partial<AdminBlogCategory> {
  return {
    name: u.name,
    icon: u.icon,
    order: u.order,
    is_active: u.isActive,
  };
}
