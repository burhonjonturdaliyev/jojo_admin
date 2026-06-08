import type { Localized } from "./locale";

export type AccessLevel = "none" | "view" | "edit";

/**
 * Stable identifiers for every admin menu surface. Roles store a
 * permission map keyed by these identifiers; the runtime looks up labels
 * through the i18n dictionary (`nav.{key}`) so the matrix stays in sync
 * with the sidebar even after a rename.
 */
export const MENU_KEYS = [
  "dashboard",
  "users",
  "children",
  "premium",
  "payments",
  "requests",
  "products",
  "banners",
  "orders",
  "advice",
  "notifications",
  "sms",
  "ads",
  "settings",
  "operators",
  "blocked",
  "roles",
] as const;

export type MenuKey = (typeof MENU_KEYS)[number];

export type Permissions = Record<MenuKey, AccessLevel>;

export interface Role {
  id: string;
  name: Localized<string> | string;
  description: Localized<string> | string;
  /** Built-in roles can't be deleted (they ship with the system). */
  isSystem?: boolean;
  /** Pinned visually but otherwise behaves like any other role. */
  isDefault?: boolean;
  color: string;
  permissions: Permissions;
  /** Number of admins/operators currently assigned this role. Display-only. */
  assignedCount: number;
  createdAt: string;
  updatedAt: string;
}

export const ALL_NONE: Permissions = Object.fromEntries(
  MENU_KEYS.map((k) => [k, "none"] as const),
) as Permissions;

export const ALL_VIEW: Permissions = Object.fromEntries(
  MENU_KEYS.map((k) => [k, "view"] as const),
) as Permissions;

export const ALL_EDIT: Permissions = Object.fromEntries(
  MENU_KEYS.map((k) => [k, "edit"] as const),
) as Permissions;

/**
 * Sidebar groupings so the permission editor mirrors the navigation the
 * admin already knows from the sidebar. Keys map 1:1 to i18n labels
 * (`nav.section.{key}`).
 */
export const MENU_SECTIONS: { key: string; menus: MenuKey[] }[] = [
  { key: "home", menus: ["dashboard"] },
  {
    key: "users",
    menus: ["users", "children", "premium", "payments", "requests"],
  },
  { key: "shop", menus: ["products", "banners", "orders"] },
  { key: "content", menus: ["advice"] },
  {
    key: "management",
    menus: [
      "notifications",
      "sms",
      "ads",
      "settings",
      "operators",
      "blocked",
      "roles",
    ],
  },
];

export function countByLevel(permissions: Permissions) {
  let view = 0;
  let edit = 0;
  let none = 0;
  for (const key of MENU_KEYS) {
    const lvl = permissions[key];
    if (lvl === "edit") edit++;
    else if (lvl === "view") view++;
    else none++;
  }
  return { view, edit, none, total: MENU_KEYS.length };
}
