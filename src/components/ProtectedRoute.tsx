import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LogOut, ShieldOff } from "lucide-react";
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
};

/** Foydalanuvchi uchun birinchi ruxsat etilgan sahifani topadi. */
function firstAllowedPath(
  hasPermission: (key: string | string[]) => boolean,
): string | null {
  for (const [path, key] of Object.entries(PATH_PERMISSION)) {
    if (hasPermission(key)) return path;
  }
  return null;
}

function NoAccessScreen({
  onLogout,
  fullName,
  roleName,
}: {
  onLogout: () => void;
  fullName: string;
  roleName: string;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-status-blocked/15 text-status-blocked">
        <ShieldOff className="h-8 w-8" strokeWidth={2} />
      </div>
      <h1 className="mt-6 text-[20px] font-bold text-text-primary">
        Sizga hech qaysi bo'limga ruxsat berilmagan
      </h1>
      <p className="mt-2 max-w-[480px] text-[13.5px] text-text-secondary">
        {fullName ? `${fullName} (${roleName || "rolsiz"})` : roleName}
        — administratordan kerakli sahifalarni ruxsat etishini so'rang yoki
        boshqa hisob bilan kirib ko'ring.
      </p>
      <button
        onClick={onLogout}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-brand/30 hover:bg-brand-hover"
      >
        <LogOut className="h-4 w-4" strokeWidth={2.2} />
        Tizimdan chiqish
      </button>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, hasPermission, user, logout } = useAuth();
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

  // Joriy pathga kerakli permission kalitini aniqlaymiz. Topilmasa
  // (yangi sahifa) — ochiq deb hisoblaymiz.
  const pathKey = Object.keys(PATH_PERMISSION).find((p) =>
    location.pathname.startsWith(p),
  );

  if (pathKey && !user?.is_superuser && !hasPermission(PATH_PERMISSION[pathKey])) {
    // Ruxsat yo'q — birinchi mavjud sahifaga olib boramiz. Hech narsa
    // ruxsat etilmagan bo'lsa, "ruxsat yo'q" ekranini ko'rsatamiz va
    // chiqish tugmasini qoldiramiz (login redirect loop'iga tushib
    // qolmaslik uchun).
    const target = firstAllowedPath(hasPermission);
    if (target && target !== location.pathname) {
      return <Navigate to={target} replace />;
    }
    return (
      <NoAccessScreen
        onLogout={logout}
        fullName={user?.full_name || user?.phone || ""}
        roleName={user?.admin_role?.name || ""}
      />
    );
  }

  return <Outlet />;
}
