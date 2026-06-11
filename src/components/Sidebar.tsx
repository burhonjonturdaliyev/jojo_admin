import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Baby,
  Crown,
  Wallet,
  MessageSquare,
  Bell,
  MessageCircle,
  Megaphone,
  Settings,
  Headphones,
  LogOut,
  Headset,
  Package,
  Image as ImageIcon,
  ShoppingBag,
  Lightbulb,
  Ban,
  FolderTree,
  Shield,
  Kanban,
  Gamepad2,
  AlarmClock,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import { leadsApi } from "../lib/resources";
import { subscribe } from "../lib/leadsSocket";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();

  // "Javob kutilayotgan murojaatlar" badge sanog'i — Sorovlar
  // sahifasi yonida ko'rinadi. Realtime: yangi tikket yoki yangi izoh
  // kelganda darrov yangilanadi. Fallback: 60 sekundlik polling.
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [unreadLeads, setUnreadLeads] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      // Sorovlar (Telegram support): "javob kutilayotgan"lar —
      // operator kimga javob berishi kerakligini ko'rsatadi.
      leadsApi
        .unreadCount({ source: "telegram", mode: "needs_reply" })
        .then((r) => !cancelled && setUnreadRequests(r.count ?? 0))
        .catch(() => {});
      // Leadlar (CRM): sof "Yangi" status sanog'i — kanban
      // "Yangi" kolonkasidagi kartochkalar bilan to'liq mos keladi.
      leadsApi
        .unreadCount({ source: "app,manual", mode: "new" })
        .then((r) => !cancelled && setUnreadLeads(r.count ?? 0))
        .catch(() => {});
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    const offChanged = subscribe("lead_changed", refresh);
    const offComment = subscribe("lead_comment", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      offChanged();
      offComment();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const sections = [
    {
      label: t("nav.section.home"),
      items: [{ to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard }],
    },
    {
      label: t("nav.section.users"),
      items: [
        { to: "/leads", label: t("nav.leads"), icon: Kanban, badge: unreadLeads },
        { to: "/users", label: t("nav.users"), icon: Users },
        { to: "/children", label: t("nav.children"), icon: Baby },
        { to: "/premium", label: t("nav.premium"), icon: Crown },
        { to: "/payments", label: t("nav.payments"), icon: Wallet },
        { to: "/requests", label: t("nav.requests"), icon: MessageSquare, badge: unreadRequests },
      ],
    },
    {
      label: t("nav.section.shop"),
      items: [
        { to: "/products", label: t("nav.products"), icon: Package },
        { to: "/categories", label: t("nav.categories"), icon: FolderTree },
        { to: "/banners", label: t("nav.banners"), icon: ImageIcon },
        { to: "/orders", label: t("nav.orders"), icon: ShoppingBag },
      ],
    },
    {
      label: t("nav.section.content"),
      items: [
        { to: "/advice", label: t("nav.advice"), icon: Lightbulb },
        { to: "/kids-content", label: t("nav.kidsContent"), icon: Gamepad2 },
      ],
    },
    {
      label: t("nav.section.management"),
      items: [
        { to: "/notifications", label: t("nav.notifications"), icon: Bell },
        { to: "/notification-rules", label: t("nav.notifRules"), icon: AlarmClock },
        { to: "/sms", label: t("nav.sms"), icon: MessageCircle },
        { to: "/bulk-sms", label: "Bulk SMS", icon: MessageCircle },
        { to: "/sms-log", label: "SMS jurnali", icon: MessageCircle },
        { to: "/ads", label: t("nav.ads"), icon: Megaphone },
        { to: "/settings", label: t("nav.settings"), icon: Settings },
        { to: "/operators", label: t("nav.operators"), icon: Headphones },
        { to: "/roles", label: t("nav.roles"), icon: Shield },
        { to: "/blocked", label: t("nav.blocked"), icon: Ban },
      ],
    },
  ];

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-line bg-bg-panel">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-line">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-blue-500 shadow-lg shadow-brand/30">
          <Headset className="h-5 w-5 text-white" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-wide text-text-primary">
            {t("nav.brand")}
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
            {t("nav.adminPanel")}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all",
                        isActive
                          ? "bg-brand-soft text-brand"
                          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    <span className="flex-1">{item.label}</span>
                    {"badge" in item && (item.badge ?? 0) > 0 && (
                      <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-status-blocked px-1.5 text-[10.5px] font-bold leading-none text-white">
                        {item.badge! > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3 space-y-2">
        <LanguageSwitcher />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
