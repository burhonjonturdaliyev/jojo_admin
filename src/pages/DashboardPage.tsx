import { useEffect, useState } from "react";
import {
  Users,
  Baby,
  PhoneCall,
  Package,
  BookOpen,
  Image as ImageIcon,
  AlertTriangle,
  Calendar,
  Download,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StatCard } from "../components/StatCard";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import {
  dashboardApi,
  leadsApi,
  usersApi,
  unwrapList,
  type AdminDashboardStats,
  type LeadBoardResponse,
  type AdminUserRow,
  type AdminLead,
} from "../lib/resources";

const STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  new: { label: "Yangi", color: "#3B82F6" },
  in_progress: { label: "Jarayonda", color: "#F59E0B" },
  waiting: { label: "Kutilmoqda", color: "#A855F7" },
  resolved: { label: "Hal qilingan", color: "#10B981" },
  closed: { label: "Yopilgan", color: "#6B7280" },
  blocked: { label: "Bloklangan", color: "#EF4444" },
};

export function DashboardPage() {
  const { t } = useT();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [board, setBoard] = useState<LeadBoardResponse | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUserRow[]>([]);
  const [recentLeads, setRecentLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, b, u] = await Promise.all([
          dashboardApi.stats(),
          leadsApi.board({ per_column: 5 }),
          usersApi.list({ page_size: 6 }),
        ]);
        setStats(s);
        setBoard(b);
        setRecentUsers(unwrapList(u).slice(0, 6));
        const all: AdminLead[] = Object.values(b.columns).flat();
        all.sort(
          (a, c) =>
            new Date(c.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
        setRecentLeads(all.slice(0, 6));
      } catch (e) {
        console.error("dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmt = (n: number | undefined) =>
    (n ?? 0).toLocaleString("uz-UZ").replace(/,/g, " ");

  const totalLeads =
    board ? Object.values(board.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.dashboard")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <>
            <button className="btn-secondary text-[12.5px]">
              <Calendar className="h-4 w-4" />{" "}
              {new Date().toLocaleDateString("uz-UZ")}
            </button>
            <button className="btn-secondary text-[12.5px]">
              <Download className="h-4 w-4" /> {t("common.export")}
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {/* Stat tiles */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Ota-onalar"
            value={fmt(stats?.parents)}
            delta=""
            icon={Users}
            iconColor="#3B82F6"
            iconBg="rgba(59,130,246,0.15)"
          />
          <StatCard
            label="Farzandlar"
            value={fmt(stats?.children)}
            delta=""
            icon={Baby}
            iconColor="#8B5CF6"
            iconBg="rgba(139,92,246,0.15)"
          />
          <StatCard
            label="24 soatda faol"
            value={fmt(stats?.active_24h)}
            delta=""
            icon={PhoneCall}
            iconColor="#F59E0B"
            iconBg="rgba(245,158,11,0.15)"
          />
          <StatCard
            label="SOS bildirishnomalar"
            value={fmt(stats?.sos_alerts)}
            delta=""
            icon={AlertTriangle}
            iconColor="#EF4444"
            iconBg="rgba(239,68,68,0.15)"
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4">
          <SmallStat
            label="Mahsulotlar"
            value={fmt(stats?.products)}
            icon={Package}
            color="#10B981"
          />
          <SmallStat
            label="Maqolalar"
            value={fmt(stats?.blog_posts)}
            icon={BookOpen}
            color="#0EA5E9"
          />
          <SmallStat
            label="Bannerlar"
            value={fmt(stats?.banners)}
            icon={ImageIcon}
            color="#EC4899"
          />
          <SmallStat
            label="Leadlar"
            value={fmt(totalLeads)}
            icon={PhoneCall}
            color="#6366F1"
            link="/leads"
          />
        </div>

        {/* 7-day signups bar chart + revenue */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <ChartCard
            title="7 kunlik ro'yxatdan o'tish"
            subtitle="Yangi ota-onalar / kun"
            data={(stats?.signups_7d ?? []).map((d) => ({
              label: new Date(d.date).toLocaleDateString("uz-UZ", {
                day: "2-digit",
                month: "2-digit",
              }),
              value: d.count,
            }))}
            color="#3B82F6"
            suffix=" ta"
          />
          <ChartCard
            title="7 kunlik daromad"
            subtitle="Premium to'lovlar / kun"
            data={(stats?.revenue_7d ?? []).map((d) => ({
              label: new Date(d.date).toLocaleDateString("uz-UZ", {
                day: "2-digit",
                month: "2-digit",
              }),
              value: d.amount,
            }))}
            color="#F59E0B"
            valueFormatter={(v) =>
              v > 1000
                ? `${(v / 1000).toFixed(0)}k`
                : v.toString()
            }
            suffix=" so'm"
          />
        </div>

        {/* Lead status distribution + Recent leads */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  Lead statuslari
                </h3>
                <p className="text-[12px] text-text-secondary">
                  Joriy taqsimot
                </p>
              </div>
              <Link
                to="/leads"
                className="text-[11.5px] text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Ko'rish <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {board ? (
                board.statuses.map((s) => {
                  const meta = STATUS_META[s] || { label: s, color: "#9CA3AF" };
                  const count = board.counts[s] || 0;
                  const pct = totalLeads
                    ? Math.round((count / totalLeads) * 100)
                    : 0;
                  return (
                    <div key={s}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]">
                        <span className="text-text-secondary">{meta.label}</span>
                        <span className="font-medium text-text-primary">
                          {count}{" "}
                          <span className="text-text-muted text-[11px]">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-bg-input">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[12px] text-text-muted">Yuklanmoqda...</div>
              )}
            </div>
          </div>

          <div className="card col-span-2 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  So'nggi murojaatlar
                </h3>
                <p className="text-[12px] text-text-secondary">
                  Kanban'dan oxirgi 6 ta
                </p>
              </div>
              <Link
                to="/leads"
                className="text-[11.5px] text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Hammasi <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentLeads.length === 0 && (
                <div className="text-center py-6 text-[12px] text-text-muted">
                  {loading ? "Yuklanmoqda..." : "Lead yo'q"}
                </div>
              )}
              {recentLeads.map((l) => {
                const meta = STATUS_META[l.status] || {
                  label: l.status,
                  color: "#9CA3AF",
                };
                return (
                  <Link
                    to="/leads"
                    key={l.id}
                    className="flex items-center gap-3 rounded-lg border border-line p-2.5 hover:bg-bg-hover transition-colors"
                  >
                    <Avatar name={l.parent?.name || "?"} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-medium text-text-primary truncate">
                        {l.title}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">
                        {l.parent?.name} • {l.parent?.phone}
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        backgroundColor: meta.color + "20",
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent users */}
        <div className="mt-5 card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-text-primary">
                Yangi foydalanuvchilar
              </h3>
              <p className="text-[12px] text-text-secondary">
                Oxirgi ro'yxatdan o'tganlar
              </p>
            </div>
            <Link
              to="/users"
              className="text-[11.5px] text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Hammasi <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recentUsers.length === 0 && (
              <div className="col-span-3 text-center py-6 text-[12px] text-text-muted">
                {loading ? "Yuklanmoqda..." : "Foydalanuvchilar yo'q"}
              </div>
            )}
            {recentUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-lg border border-line p-3"
              >
                <Avatar name={u.first_name || u.phone || "?"} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-text-primary truncate">
                    {u.first_name || u.last_name || u.phone || "Noma'lum"}
                  </div>
                  <div className="text-[11px] text-text-muted font-mono truncate">
                    {u.phone}
                  </div>
                </div>
                {u.is_active ? (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                    Faol
                  </span>
                ) : (
                  <span className="rounded-full bg-text-muted/15 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                    Faol emas
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  icon: Icon,
  color,
  link,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  color: string;
  link?: string;
}) {
  const inner = (
    <div className="card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
        style={{ backgroundColor: color + "20" }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[18px] font-bold text-text-primary leading-tight">
          {value}
        </div>
        <div className="text-[11.5px] text-text-secondary truncate">
          {label}
        </div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}

function ChartCard({
  title,
  subtitle,
  data,
  color,
  suffix,
  valueFormatter,
}: {
  title: string;
  subtitle: string;
  data: Array<{ label: string; value: number }>;
  color: string;
  suffix?: string;
  valueFormatter?: (v: number) => string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">
            {title}
          </h3>
          <p className="text-[12px] text-text-secondary">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-[20px] font-bold text-text-primary">
            {(valueFormatter ? valueFormatter(total) : total.toLocaleString("uz-UZ"))}
          </div>
          <div className="text-[10.5px] text-text-muted">{suffix ?? "jami"}</div>
        </div>
      </div>
      <div className="mt-4 flex h-32 items-end gap-1.5">
        {data.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-md bg-bg-input/50"
                style={{ height: "30%" }}
              />
            ))
          : data.map((d, i) => {
              const h = (d.value / maxValue) * 100;
              return (
                <div
                  key={i}
                  className="group relative flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-md transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(h, 3)}%`,
                      backgroundColor: color,
                      opacity: 0.85,
                    }}
                    title={
                      (valueFormatter ? valueFormatter(d.value) : d.value.toString()) +
                      (suffix ?? "")
                    }
                  />
                </div>
              );
            })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9.5px] text-text-muted truncate"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
