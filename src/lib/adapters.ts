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
import { type Localized, emptyLocalized, toLocalized } from "../types/locale";

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

export interface UiProductTag {
  id?: number;
  slug?: string;
  name: string;       // uz nomi (admin yozadi)
  name_ru?: string;
  name_en?: string;
}

export interface UiProduct {
  id: string;
  name: Localized<string>;
  description: Localized<string>;
  shortDescription: Localized<string>;
  categoryLabel: Localized<string>;
  tags: UiProductTag[];
  priceUzs: number;
  oldPriceUzs: number | null;
  categoryId: string | null;
  image: string | null;
  brand: string;
  videoUrl: string;  // YouTube URL
  ageLabel: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
}

type StoreProductRaw = AdminStoreProduct & {
  name_ru?: string;
  name_en?: string;
  name_uz_cyrl?: string;
  short_description?: string;
  short_description_ru?: string;
  short_description_en?: string;
  short_description_uz_cyrl?: string;
  description?: string;
  description_ru?: string;
  description_en?: string;
  description_uz_cyrl?: string;
  category_label?: string;
  category_label_ru?: string;
  category_label_en?: string;
  category_label_uz_cyrl?: string;
  video_url?: string;
  age_label?: string;
  tags?: UiProductTag[];
};

export function productToUi(p: AdminStoreProduct): UiProduct {
  const raw = p as StoreProductRaw;
  return {
    id: String(p.id),
    name: {
      uz: p.name || "",
      uz_cyrl: raw.name_uz_cyrl || "",
      ru: raw.name_ru || "",
      en: raw.name_en || "",
    },
    description: {
      uz: raw.description || "",
      uz_cyrl: raw.description_uz_cyrl || "",
      ru: raw.description_ru || "",
      en: raw.description_en || "",
    },
    shortDescription: {
      uz: raw.short_description || "",
      uz_cyrl: raw.short_description_uz_cyrl || "",
      ru: raw.short_description_ru || "",
      en: raw.short_description_en || "",
    },
    categoryLabel: {
      uz: raw.category_label || p.product_type || "",
      uz_cyrl: raw.category_label_uz_cyrl || "",
      ru: raw.category_label_ru || "",
      en: raw.category_label_en || "",
    },
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    priceUzs: p.price ?? 0,
    oldPriceUzs: p.old_price ?? null,
    categoryId: p.category != null ? String(p.category) : null,
    image: p.cover_image ?? null,
    brand: p.brand || "",
    videoUrl: raw.video_url || "",
    ageLabel: raw.age_label || "",
    isActive: p.is_active ?? true,
    isFeatured: p.is_featured ?? false,
    stock: p.stock_count ?? 0,
  };
}

export interface ProductToApiOptions {
  autoTranslate?: boolean;
  translateSource?: "uz" | "uz_cyrl" | "ru" | "en";
}

export function productToApi(
  u: UiProduct,
  opts: ProductToApiOptions = {},
): Partial<AdminStoreProduct> & Record<string, unknown> {
  return {
    name: u.name.uz,
    name_ru: u.name.ru,
    name_en: u.name.en,
    name_uz_cyrl: u.name.uz_cyrl,
    short_description: u.shortDescription.uz,
    short_description_ru: u.shortDescription.ru,
    short_description_en: u.shortDescription.en,
    short_description_uz_cyrl: u.shortDescription.uz_cyrl,
    description: u.description.uz,
    description_ru: u.description.ru,
    description_en: u.description.en,
    description_uz_cyrl: u.description.uz_cyrl,
    category_label: u.categoryLabel.uz,
    category_label_ru: u.categoryLabel.ru,
    category_label_en: u.categoryLabel.en,
    category_label_uz_cyrl: u.categoryLabel.uz_cyrl,
    tags_input: u.tags.map((t) => (t.id ? t.id : t.name)).filter(Boolean),
    auto_translate: !!opts.autoTranslate,
    translate_source: opts.translateSource || "uz",
    price: u.priceUzs,
    old_price: u.oldPriceUzs,
    category: u.categoryId != null ? Number(u.categoryId) : null,
    cover_image: u.image,
    product_type: u.categoryLabel.uz,
    brand: u.brand,
    video_url: u.videoUrl,
    age_label: u.ageLabel,
    is_active: u.isActive,
    is_featured: u.isFeatured,
    stock_count: u.stock,
  };
}

export function emptyLocalizedString(): Localized<string> {
  return emptyLocalized();
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
  title: Localized<string>;
  excerpt: Localized<string>;
  body: Localized<string>;
  image: string | null;
  videoUrl: string;
  categoryId: string | null;
  type: string;
  readMinutes: number;
  isActive: boolean;
  isFeatured: boolean;
}

/**
 * Backend may also include the language-suffixed fields. When loading legacy
 * posts that only have the bare `title`/`excerpt`/`body`, those are treated as
 * the Uzbek value and other locales start empty (admin will fill them in).
 */
function localizedFromBackend(
  base: string | undefined | null,
  ru: string | undefined | null,
  en: string | undefined | null,
): Localized<string> {
  return {
    uz: base ?? "",
    ru: ru ?? "",
    en: en ?? "",
  };
}

export function adviceToUi(p: AdminBlogPost): UiAdvice {
  // Backend uz qiymatini `short_description`/`content` orqali yuboradi
  // (yoki `excerpt`/`body` alias orqali — bir xil qiymat).
  return {
    id: String(p.id),
    title: localizedFromBackend(p.title, p.title_ru, p.title_en),
    excerpt: localizedFromBackend(
      p.short_description ?? p.excerpt,
      p.short_description_ru,
      p.short_description_en,
    ),
    body: localizedFromBackend(
      p.content ?? p.body,
      p.content_ru,
      p.content_en,
    ),
    image: p.cover_image ?? null,
    videoUrl: (p as { video_url?: string }).video_url || "",
    categoryId: p.category != null ? String(p.category) : null,
    type: p.post_type || "",
    readMinutes: p.read_minutes ?? 0,
    isActive: p.is_active ?? true,
    isFeatured: p.is_featured ?? false,
  };
}

export function adviceToApi(u: UiAdvice): Partial<AdminBlogPost> & Record<string, unknown> {
  return {
    title: u.title.uz,
    title_ru: u.title.ru,
    title_en: u.title.en,
    // Backend uchun canonical field nomlari — `excerpt_ru`/`body_ru` mavjud emas.
    short_description: u.excerpt.uz,
    short_description_ru: u.excerpt.ru,
    short_description_en: u.excerpt.en,
    content: u.body.uz,
    content_ru: u.body.ru,
    content_en: u.body.en,
    cover_image: u.image,
    video_url: u.videoUrl,
    category: u.categoryId != null ? Number(u.categoryId) : null,
    // Agar video_url berilgan bo'lsa avtomatik "video" tipga o'tkazamiz.
    post_type: u.videoUrl && u.videoUrl.trim() ? "video" : (u.type || "blog"),
    read_minutes: u.readMinutes,
    is_active: u.isActive,
    is_featured: u.isFeatured,
  };
}

export function emptyUiAdvice(): Pick<UiAdvice, "title" | "excerpt" | "body"> {
  return {
    title: emptyLocalized(),
    excerpt: emptyLocalized(),
    body: emptyLocalized(),
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
