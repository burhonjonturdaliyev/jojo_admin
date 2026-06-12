import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

/** Pathname (route) → permission kalit jadvali. Sidebar bilan mos. */
const PATH_PERMISSION: Record<string, string> = {
  "/dashboard": "dashboard",
  "/leads": "leads",
  "/users": "users",
  "/children": "children",
  "/premium": "premium",
  "/payments": "payments",
  "/requests": "requests",
  "/products": "products",
  "/categories": "categories",
  "/banners": "banners",
  "/orders": "orders",
  "/advice": "advice",
  "/kids-content": "kids_content",
  "/notifications": "notifications",
  "/notification-rules": "notification_rules",
  "/sms": "sms",
  "/bulk-sms": "sms",
  "/sms-log": "sms",
  "/ads": "ads",
  "/settings": "settings",
  "/operators": "operators",
  "/roles": "roles",
  "/blocked": "blocked",
};

/** Foydalanuvchi uchun birinchi ruxsat etilgan sahifani topadi. */
function firstAllowedPath(
  hasPermission: (key: string | string[]) => boolean,
): string {
  for (const [path, key] of Object.entries(PATH_PERMISSION)) {
    if (hasPermission(key)) return path;
  }
  return "/login";
}

export function ProtectedRoute() {
  const { isAuthenticated, hasPermission, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Joriy pathga kerakli permission kaliti aniqlanadi. Topilmasa ochiq
  // sahifa hisoblanadi (yangi sahifalar uchun fallback).
  const pathKey = Object.keys(PATH_PERMISSION).find((p) =>
    location.pathname.startsWith(p),
  );
  if (pathKey && !user?.is_superuser && !hasPermission(PATH_PERMISSION[pathKey])) {
    const target = firstAllowedPath(hasPermission);
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
