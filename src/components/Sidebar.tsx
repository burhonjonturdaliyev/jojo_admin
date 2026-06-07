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
  Ban,
  LogOut,
  Headset,
  Package,
  Image as ImageIcon,
  ShoppingBag,
  Lightbulb,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";

const sections = [
  {
    label: "BOSH SAHIFA",
    items: [{ to: "/dashboard", label: "Asosiy panel", icon: LayoutDashboard }],
  },
  {
    label: "FOYDALANUVCHILAR",
    items: [
      { to: "/users", label: "Foydalanuvchilar", icon: Users },
      { to: "/children", label: "Bolalar", icon: Baby },
      { to: "/premium", label: "Premium obunalar", icon: Crown },
      { to: "/payments", label: "To'lovlar tarixi", icon: Wallet },
      { to: "/requests", label: "So'rovlar", icon: MessageSquare },
    ],
  },
  {
    label: "DO'KON",
    items: [
      { to: "/products", label: "Mahsulotlar", icon: Package },
      { to: "/banners", label: "Promo bannerlar", icon: ImageIcon },
      { to: "/orders", label: "Buyurtmalar", icon: ShoppingBag },
    ],
  },
  {
    label: "KONTENT",
    items: [{ to: "/advice", label: "Maslahatlar", icon: Lightbulb }],
  },
  {
    label: "BOSHQARUV",
    items: [
      { to: "/notifications", label: "Bildirishnomalar", icon: Bell },
      { to: "/sms", label: "SMS xabarlar", icon: MessageCircle },
      { to: "/ads", label: "Reklamalar", icon: Megaphone },
      { to: "/settings", label: "Sozlamalar", icon: Settings },
      { to: "/operators", label: "Operatorlar", icon: Headphones },
      { to: "/blocked", label: "Bloklanganlar", icon: Ban },
    ],
  },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-line bg-bg-panel">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-line">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-blue-500 shadow-lg shadow-brand/30">
          <Headset className="h-5 w-5 text-white" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-wide text-text-primary">
            CALL CENTER
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
            Admin Panel
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
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
