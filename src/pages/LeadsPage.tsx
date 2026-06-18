import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Plus,
  Phone,
  MessageSquare,
  Send,
  RefreshCw,
  ArrowUp,
  Users,
  UserCheck,
  Crown,
  Wallet,
  Ban,
  PhoneCall,
  Bell,
  Edit3,
  Trash2,
} from "lucide-react";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import {
  leadsApi,
  dashboardApi,
  usersApi,
  notificationsApi,
  unwrapList,
  type AdminLead,
  type AdminLeadFull,
  type LeadBoardResponse,
  type LeadStatus,
  type LeadComment,
  type AdminDashboardStats,
  type AdminUserRow,
} from "../lib/resources";
import {
  subscribe,
  reconnect as reconnectSocket,
  isConnected as isSocketConnected,
} from "../lib/leadsSocket";

interface ColumnDef {
  status: LeadStatus;
  label: string;
  dotClass: string;
}

const COLUMNS: ColumnDef[] = [
  { status: "new", label: "Yangi", dotClass: "bg-blue-500" },
  { status: "in_progress", label: "Jarayonda", dotClass: "bg-amber-500" },
  { status: "waiting", label: "Kutilmoqda", dotClass: "bg-purple-500" },
  { status: "resolved", label: "Hal qilingan", dotClass: "bg-emerald-500" },
  { status: "closed", label: "Yopilgan", dotClass: "bg-slate-400" },
  { status: "blocked", label: "Bloklangan", dotClass: "bg-red-500" },
];

const STATUS_PILL: Record<LeadStatus, string> = {
  new: "bg-blue-500/15 text-blue-500",
  in_progress: "bg-amber-500/15 text-amber-500",
  waiting: "bg-purple-500/15 text-purple-500",
  resolved: "bg-emerald-500/15 text-emerald-500",
  closed: "bg-slate-400/15 text-slate-400",
  blocked: "bg-red-500/15 text-red-500",
};

const STATUS_DOT: Record<LeadStatus, string> = {
  new: "bg-blue-500",
  in_progress: "bg-amber-500",
  waiting: "bg-purple-500",
  resolved: "bg-emerald-500",
  closed: "bg-slate-400",
  blocked: "bg-red-500",
};

const ACTIVITY_DOT: Record<string, string> = {
  login: "bg-emerald-500",
  sos: "bg-red-500",
  child_linked: "bg-purple-500",
  order: "bg-indigo-500",
  payment: "bg-amber-500",
  notification: "bg-blue-500",
  status: "bg-cyan-500",
  comment: "bg-text-muted",
  lead_created: "bg-primary",
};

function fmtNumber(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString("uz-UZ").replace(/,/g, " ");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Backend'dan kelgan `language` qiymatini i18n key'iga aylantirib qaytaradi.
 *  Mavjud qiymatlar: "uz_latn" | "uz_cyrl" | "uz" | "ru" | "en" | "". */
function userLanguageLabel(
  raw: string | undefined | null,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const v = (raw || "").toLowerCase().trim();
  if (!v) return t("userLang.none");
  // Backend "uz_latn"/"uz_cyrl"/"uz"/"ru"/"en" qaytaradi
  const key = `userLang.${v}`;
  const out = t(key);
  // t() topa olmasa key'ning o'zini qaytaradi — fallback
  return out === key ? v : out;
}

/** Qurilma brendi + modeli + OS versiyasi — bir qatorda. */
function deviceLabel(
  d: { type?: string; brand?: string; model?: string; os_version?: string } | null | undefined,
): string {
  if (!d) return "—";
  const bm = [d.brand, d.model].filter(Boolean).join(" ").trim();
  const head = bm || (d.type?.toLowerCase() === "ios" ? "iPhone" : "Android");
  if (d.os_version) {
    const osName = d.type?.toLowerCase() === "ios" ? "iOS" : "Android";
    return `${head} · ${osName} ${d.os_version}`;
  }
  return head;
}

function makeRelativeFormatter(
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  return function fmtRelativeTime(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return t("time.now");
    if (diff < 3600) return t("time.minAgo", { n: Math.floor(diff / 60) });
    if (diff < 86400) {
      return d.toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diff < 172800) return t("time.yesterday");
    if (diff < 86400 * 7) return t("time.dayAgo", { n: Math.floor(diff / 86400) });
    return fmtDate(iso);
  };
}

export function LeadsPage() {
  const { t } = useT();

  // Status'lar i18n bilan — har safar lang o'zgarganda yangi label'lar olinadi.
  const statusLabel = (s: LeadStatus): string => t(`leadStatus.${s}`);

  const [board, setBoard] = useState<LeadBoardResponse | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  // Boshlanish holatini darrov socket'dan o'qiymiz — agar boshqa
  // bo'limdan qaytib kelgan bo'lsak, socket allaqachon ulangan bo'lishi
  // mumkin va "connect" event boshqa qaytatdan otmaydi.
  const [socketUp, setSocketUp] = useState<boolean>(() => isSocketConnected());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [addingInCol, setAddingInCol] = useState<LeadStatus | null>(null);

  const reload = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([
        leadsApi.board({ per_column: 50, source: "app,manual" }),
        dashboardApi.stats(),
      ]);
      setBoard(b);
      setStats(s);
    } catch (e) {
      console.error("leads load", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2500);
  };

  // Socket.IO
  useEffect(() => {
    // Avval listener'larni ulab olamiz — keyin reconnect() chaqirilganda
    // yangi socket'ning birinchi "connect" event'i ham bizga yetadi.
    const offConn = subscribe("connect", () => setSocketUp(true));
    const offDisc = subscribe("disconnect", () => setSocketUp(false));

    // Komponent qaytib mount bo'lganda holatni socket bilan
    // sinxronlashtiramiz. Agar ulanmagan bo'lsa — avtomatik qayta
    // ulanishni boshlaymiz, foydalanuvchi "Reconnect" bosishi shart emas.
    if (isSocketConnected()) {
      setSocketUp(true);
    } else {
      setSocketUp(false);
      reconnectSocket();
    }
    const offChanged = subscribe("lead_changed", (raw) => {
      const ev = raw as {
        type: string;
        id: number;
        lead?: AdminLead;
        from?: LeadStatus;
        to?: LeadStatus;
      };
      setBoard((prev) => {
        if (!prev) return prev;
        const next: LeadBoardResponse = {
          statuses: prev.statuses,
          counts: { ...prev.counts },
          columns: { ...prev.columns },
        };
        for (const st of next.statuses) {
          next.columns[st] = (next.columns[st] || []).filter(
            (l) => l.id !== ev.id,
          );
        }
        if (ev.lead && ev.type !== "deleted") {
          const col = next.columns[ev.lead.status] || [];
          next.columns[ev.lead.status] = [ev.lead, ...col];
        }
        const counts = {} as Record<LeadStatus, number>;
        for (const st of next.statuses) {
          counts[st] = (next.columns[st] || []).length;
        }
        next.counts = counts;
        return next;
      });
      if (ev.type === "status_changed" && ev.from !== ev.to) {
        showToast(
          `Lead #${ev.id}: ${statusLabel(ev.from!)} → ${statusLabel(ev.to!)}`,
        );
      } else if (ev.type === "created") {
        showToast(t("lead.newRequest"));
      }
    });
    return () => {
      offConn();
      offDisc();
      offChanged();
    };
  }, []);

  const moveLead = async (leadId: number, toStatus: LeadStatus) => {
    if (!board) return;
    const fromStatus = board.statuses.find((s) =>
      (board.columns[s] || []).some((l) => l.id === leadId),
    );
    if (!fromStatus || fromStatus === toStatus) return;
    const lead = (board.columns[fromStatus] || []).find((l) => l.id === leadId);
    if (!lead) return;
    setBoard((prev) => {
      if (!prev) return prev;
      const next: LeadBoardResponse = {
        statuses: prev.statuses,
        counts: { ...prev.counts },
        columns: { ...prev.columns },
      };
      next.columns[fromStatus] = (next.columns[fromStatus] || []).filter(
        (l) => l.id !== leadId,
      );
      next.columns[toStatus] = [
        { ...lead, status: toStatus },
        ...(next.columns[toStatus] || []),
      ];
      next.counts[fromStatus] = (next.columns[fromStatus] || []).length;
      next.counts[toStatus] = (next.columns[toStatus] || []).length;
      return next;
    });
    try {
      await leadsApi.update(leadId, { status: toStatus });
    } catch {
      showToast(t("common.save_failed"));
      void reload();
    }
  };

  const totalLeads = board
    ? Object.values(board.counts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* Top stat tiles */}
      <div className="px-7 pt-5">
        <div className="grid grid-cols-5 gap-3">
          <StatTile
            title={t("lead.totalUsers")}
            value={fmtNumber(stats?.parents)}
            delta={stats?.parents_delta_pct}
            icon={Users}
            color="#3B82F6"
          />
          <StatTile
            title={t("lead.childConnected")}
            value={fmtNumber(stats?.children_connected)}
            icon={UserCheck}
            color="#10B981"
          />
          <StatTile
            title={t("lead.premiumUsers")}
            value={fmtNumber(stats?.premium_users)}
            icon={Crown}
            color="#8B5CF6"
          />
          <StatTile
            title={t("lead.premiumRevenue")}
            value={fmtNumber(stats?.premium_revenue)}
            icon={Wallet}
            color="#F59E0B"
          />
          <StatTile
            title={t("lead.blockedUsers")}
            value={fmtNumber(stats?.blocked_users)}
            icon={Ban}
            color="#EF4444"
          />
        </div>
      </div>

      {/* Header: live indicator + lead count */}
      <div className="px-7 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-text-secondary">
            {t("lead.countSuffix", { n: totalLeads })}
          </div>
          <button
            onClick={() => {
              if (!socketUp) reconnectSocket();
            }}
            disabled={socketUp}
            title={socketUp ? t("lead.realtimeConnected") : t("lead.reconnect")}
            className={
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors " +
              (socketUp
                ? "bg-emerald-500/15 text-emerald-600 cursor-default"
                : "bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer")
            }
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (socketUp ? "bg-emerald-500 animate-pulse" : "bg-red-500")
              }
            />
            {socketUp ? t("lead.realtimeConnected") : t("lead.reconnect")}
          </button>
        </div>
        <button
          onClick={() => {
            reconnectSocket();
            void reload();
          }}
          className="icon-btn h-8 w-8"
          title={t("lead.refreshReconnect")}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin px-7 pb-5">
        {loading && !board ? (
          <div className="card p-12 text-center text-text-muted">
            {t("common.loading")}
          </div>
        ) : (
          <div className="flex gap-3 h-full pb-2">
            {COLUMNS.map((col) => {
              const items = board?.columns[col.status] || [];
              const count = board?.counts[col.status] ?? 0;
              const isOver = dragOverCol === col.status;
              return (
                <div
                  key={col.status}
                  className={
                    "flex-shrink-0 w-[300px] flex flex-col rounded-2xl border transition-all " +
                    (isOver
                      ? "border-primary/60 bg-primary/5"
                      : "border-line bg-bg-panel/50")
                  }
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(col.status);
                  }}
                  onDragLeave={() => {
                    if (dragOverCol === col.status) setDragOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    if (draggedId != null) void moveLead(draggedId, col.status);
                  }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
                    <div className={"h-2 w-2 rounded-full " + col.dotClass} />
                    <div className="text-[13px] font-semibold text-text-primary flex-1">
                      {statusLabel(col.status)}
                    </div>
                    <div className="text-[12px] font-semibold text-text-secondary">
                      {count}
                    </div>
                    <button
                      onClick={() => setAddingInCol(col.status)}
                      title={t("lead.addCard")}
                      aria-label={t("lead.addCard")}
                      className="group/add inline-flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-all duration-200 ease-out hover:bg-brand hover:text-white hover:scale-110 hover:shadow-sm hover:shadow-brand/40 active:scale-95"
                    >
                      <Plus
                        className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover/add:rotate-90"
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
                    {items.length === 0 && (
                      <div className="text-center py-6 text-[11.5px] text-text-muted">
                        {t("lead.emptyColumn")}
                      </div>
                    )}
                    {items.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        selected={selectedLead?.id === lead.id}
                        dragging={draggedId === lead.id}
                        onDragStart={() => setDraggedId(lead.id)}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverCol(null);
                        }}
                        onClick={() => setSelectedLead(lead)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDetailPanel
          leadId={selectedLead.id}
          initialLead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onChanged={() => reload()}
        />
      )}

      {addingInCol && (
        <AddLeadModal
          initialStatus={addingInCol}
          onClose={() => setAddingInCol(null)}
          onCreated={() => {
            setAddingInCol(null);
            void reload();
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-text-primary px-4 py-2 text-[12px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatTile({
  title,
  value,
  delta,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  delta?: number;
  icon: typeof Users;
  color: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11.5px] text-text-secondary">{title}</div>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-[22px] font-bold text-text-primary leading-tight">
        {value}
      </div>
      {delta != null && (
        <div
          className={
            "mt-1 flex items-center gap-0.5 text-[11px] font-medium " +
            (delta >= 0 ? "text-emerald-600" : "text-red-500")
          }
        >
          <ArrowUp
            className={
              "h-3 w-3 " + (delta < 0 ? "rotate-180" : "")
            }
          />
          {Math.abs(delta)}% bu oyda
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  selected,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  lead: AdminLead;
  selected: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const { t } = useT();
  const fmtRelativeTime = useMemo(() => makeRelativeFormatter(t), [t]);
  const p = lead.parent;
  const childOK = !!p?.child_connected;
  const premiumActive = !!p?.premium_active;
  const premiumLabel = premiumActive
    ? p?.premium_days_left != null
      ? t("lead.premiumEndsIn", { n: p.premium_days_left })
      : t("lead.premiumActive")
    : t("lead.premiumNotPurchased");

  const contextLine = useMemo(() => {
    switch (lead.status) {
      case "in_progress":
        return t("lead.startedLabel", { when: fmtRelativeTime(lead.created_at) });
      case "waiting":
        return t("lead.waitingLabel", { when: fmtRelativeTime(lead.last_contact_at || lead.updated_at) });
      case "resolved":
        return t("lead.resolvedLabel", { when: fmtRelativeTime(lead.updated_at) });
      case "closed":
        return t("lead.closedLabel", { when: fmtDate(lead.closed_at || lead.updated_at) });
      case "blocked":
        return t("lead.blockedLabel", { when: fmtDate(lead.updated_at) });
      default:
        return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={
        "group cursor-grab active:cursor-grabbing rounded-xl bg-bg p-3 border transition-all " +
        (selected
          ? "border-primary shadow-sm"
          : "border-line hover:border-primary/40") +
        (dragging ? " opacity-50 rotate-1" : "")
      }
    >
      <div className="flex items-start gap-2 mb-2">
        {p?.avatar ? (
          <img
            src={p.avatar}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <Avatar name={p?.name || "?"} size={36} />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-text-primary truncate">
            {p?.name || t("common.unknown")}
          </div>
          <div className="text-[11px] text-text-muted font-mono truncate">
            {p?.phone || ""}
          </div>
        </div>
        {p?.phone && (
          <a
            href={`tel:${p.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-text-muted hover:text-primary"
            title={t("lead.actionCall")}
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div
        className={
          "text-[12px] font-medium mb-1 " +
          (childOK ? "text-emerald-600" : "text-red-500")
        }
      >
        {childOK ? t("lead.childConnected") : t("lead.childNotConnected")}
      </div>
      <div className="text-[11.5px] text-text-secondary">{premiumLabel}</div>
      {lead.operator && (
        <div className="text-[11.5px] text-text-secondary">
          {t("lead.operatorLabel", { name: lead.operator.name })}
        </div>
      )}
      {contextLine && (
        <div className="text-[11.5px] text-text-secondary">{contextLine}</div>
      )}

      <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
        <span>{fmtRelativeTime(lead.updated_at)}</span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {lead.comments_count}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Add Lead modal
// ============================================================================

function AddLeadModal({
  initialStatus,
  onClose,
  onCreated,
}: {
  initialStatus: LeadStatus;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useT();
  const statusLabel = (s: LeadStatus): string => t(`leadStatus.${s}`);
  const [parents, setParents] = useState<AdminUserRow[]>([]);
  const [parentId, setParentId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void (async () => {
      const r = await usersApi.list({ role: "parent", q: search || undefined, page_size: 20 });
      setParents(unwrapList(r));
    })();
  }, [search]);

  const submit = async () => {
    setError(null);
    if (!parentId) {
      setError(t("lead.selectUser"));
      return;
    }
    setBusy(true);
    try {
      await leadsApi.create({
        parent_id: parentId,
        title: title.trim() || t("lead.userTitle"),
        description: description.trim(),
        priority,
        status: initialStatus,
      });
      onCreated();
    } catch (e) {
      setError((e as { message?: string }).message || t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-text-primary">
            {t("lead.newLeadWith", { status: statusLabel(initialStatus) })}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("lead.user")}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("lead.searchByPhoneOrName")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <div className="mt-1.5 max-h-40 overflow-y-auto scrollbar-thin rounded-lg border border-line">
              {parents.length === 0 && (
                <div className="p-3 text-[12px] text-text-muted text-center">
                  {t("common.notFoundShort")}
                </div>
              )}
              {parents.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setParentId(u.id)}
                  className={
                    "w-full text-left px-3 py-2 text-[12.5px] hover:bg-bg-hover " +
                    (parentId === u.id ? "bg-primary/10" : "")
                  }
                >
                  <div className="font-medium text-text-primary">
                    {u.first_name || u.phone}
                  </div>
                  <div className="text-[11px] text-text-muted font-mono">
                    {u.phone}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("lead.subject")}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("lead.description")}
            rows={3}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          >
            <option value="low">{t("lead.priorityLow")}</option>
            <option value="normal">{t("lead.priorityNormal")}</option>
            <option value="high">{t("lead.priorityHigh")}</option>
          </select>
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
              {error}
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            {t("lead.actionCancel")}
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={submit}
            disabled={busy}
          >
            {busy ? t("lead.creating") : t("lead.actionCreate")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Detail panel
// ============================================================================

type Tab = "info" | "children" | "payments" | "activity";

function LeadDetailPanel({
  leadId,
  initialLead,
  onClose,
  onChanged,
}: {
  leadId: number;
  initialLead: AdminLead;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useT();
  const statusLabel = (s: LeadStatus): string => t(`leadStatus.${s}`);
  const [full, setFull] = useState<AdminLeadFull | null>(null);
  const [lead, setLead] = useState<AdminLead>(initialLead);
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [commentFilter, setCommentFilter] = useState<LeadStatus | "all">("all");
  const [newComment, setNewComment] = useState("");
  const [operatorNote, setOperatorNote] = useState("");
  const [tab, setTab] = useState<Tab>("info");
  const [sending, setSending] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadFull = useCallback(async () => {
    try {
      const r = await leadsApi.full(leadId);
      setFull(r);
      setLead(r.lead);
    } catch (e) {
      console.error("lead full", e);
    }
  }, [leadId]);

  const loadComments = useCallback(async () => {
    try {
      const r = await leadsApi.comments(leadId);
      setComments(r.results || []);
    } catch (e) {
      console.error("comments", e);
    }
  }, [leadId]);

  useEffect(() => {
    void loadFull();
    void loadComments();
  }, [loadFull, loadComments]);

  // Listen for live comment updates
  useEffect(() => {
    const off = subscribe("lead_comment", (raw) => {
      const ev = raw as { ticket_id: number; comment: LeadComment };
      if (ev.ticket_id === leadId && ev.comment) {
        setComments((prev) =>
          prev.find((c) => c.id === ev.comment.id)
            ? prev
            : [ev.comment, ...prev],
        );
      }
    });
    return () => off();
  }, [leadId]);

  const submitComment = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const c = await leadsApi.addComment(leadId, { text: trimmed });
      setComments((prev) =>
        prev.find((x) => x.id === c.id) ? prev : [c, ...prev],
      );
      setNewComment("");
      setOperatorNote("");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (s: LeadStatus) => {
    const updated = await leadsApi.update(leadId, { status: s });
    setLead(updated);
    setShowStatusMenu(false);
    onChanged();
  };

  const blockUser = async () => {
    if (!lead.parent) return;
    if (!confirm(t("lead.confirmBlockUser", { name: lead.parent.name }))) return;
    try {
      await usersApi.toggleActive(lead.parent.id);
      await updateStatus("blocked");
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
    }
  };

  const deleteLead = async () => {
    if (!confirm(t("lead.confirmDeleteLead"))) return;
    try {
      await leadsApi.remove(leadId);
      onChanged();
      onClose();
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
    }
  };

  const filteredComments = useMemo(() => {
    if (commentFilter === "all") return comments;
    return comments.filter(
      (c) => c.new_status === commentFilter || c.old_status === commentFilter,
    );
  }, [comments, commentFilter]);

  const p = lead.parent;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] h-full bg-bg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-line">
          <div className="min-w-0 flex-1 flex items-start gap-3">
            {p?.avatar ? (
              <img
                src={p.avatar}
                alt=""
                className="h-12 w-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <Avatar name={p?.name || "?"} size={48} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="text-[15px] font-semibold text-text-primary truncate">
                  {p?.name}
                </div>
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
                    STATUS_PILL[lead.status]
                  }
                >
                  <span
                    className={
                      "h-1.5 w-1.5 rounded-full " + STATUS_DOT[lead.status]
                    }
                  />
                  {statusLabel(lead.status)}
                </span>
              </div>
              <a
                href={p?.phone ? `tel:${p.phone}` : undefined}
                className="text-[12px] text-text-secondary font-mono inline-flex items-center gap-1 hover:text-primary"
              >
                <Phone className="h-3 w-3" /> {p?.phone}
              </a>
              <div className="text-[10.5px] text-text-muted mt-0.5">
                {t("lead.registeredAt")}: {fmtDateTime(p?.registered_at)}
              </div>
              <div className="text-[10.5px] text-text-muted">
                {t("lead.idLabel", { id: String(p?.id || 0).padStart(8, "0") })}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line px-5">
          {[
            { k: "info" as Tab, label: t("lead.tabInfo") },
            {
              k: "children" as Tab,
              label: t("lead.tabChildren", { count: full?.children.length ?? p?.child_count ?? 0 }),
            },
            { k: "payments" as Tab, label: t("lead.tabPayments") },
            { k: "activity" as Tab, label: t("lead.tabActivity") },
          ].map((tabDef) => (
            <button
              key={tabDef.k}
              onClick={() => setTab(tabDef.k)}
              className={
                "px-3 py-3 text-[12.5px] font-medium border-b-2 transition-colors " +
                (tab === tabDef.k
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary")
              }
            >
              {tabDef.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === "info" && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoCard title={t("lead.basicInfo")}>
                  <InfoRow label={t("lead.fullName")} value={p?.name} />
                  <InfoRow label={t("lead.phoneNumber")} value={p?.phone} mono />
                  <InfoRow label={t("user.email")} value={p?.email || "—"} />
                  <InfoRow
                    label={t("lead.gender")}
                    value={
                      p?.gender === "male"
                        ? t("lead.genderMale")
                        : p?.gender === "female"
                          ? t("lead.genderFemale")
                          : "—"
                    }
                  />
                  <InfoRow
                    label={t("lead.registeredAt")}
                    value={fmtDateTime(p?.registered_at)}
                  />
                  <InfoRow
                    label={t("lead.lastActivity")}
                    value={fmtDateTime(p?.last_activity)}
                  />
                  <InfoRow
                    label={t("lead.language")}
                    value={userLanguageLabel(p?.language, t)}
                  />
                  <InfoRow
                    label={t("lead.device")}
                    value={deviceLabel(p?.device)}
                  />
                </InfoCard>

                <InfoCard title={t("lead.accountStatus")}>
                  <InfoRow
                    label={t("lead.childConnected")}
                    value={
                      p?.child_connected ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t("common.yes")}
                        </span>
                      ) : (
                        <span className="text-red-500">{t("common.no")}</span>
                      )
                    }
                  />
                  <InfoRow
                    label={t("lead.premiumStatus")}
                    value={
                      p?.premium_active ? (
                        <span className="text-emerald-600">{t("lead.activeShort")}</span>
                      ) : (
                        <span className="text-text-secondary">{t("lead.notPurchased")}</span>
                      )
                    }
                  />
                  <InfoRow
                    label={t("lead.premiumExpires")}
                    value={
                      p?.premium_days_left != null
                        ? t("premium.duration", { n: p.premium_days_left })
                        : fmtDate(p?.premium_expires_at)
                    }
                  />
                  <InfoRow
                    label={t("lead.currentOperator")}
                    value={lead.operator?.name || "—"}
                  />
                  <InfoRow
                    label={t("lead.startedTime")}
                    value={fmtDateTime(lead.created_at)}
                  />
                  <InfoRow
                    label={t("lead.currentStatus")}
                    value={
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium " +
                          STATUS_PILL[lead.status]
                        }
                      >
                        <span
                          className={
                            "h-1 w-1 rounded-full " + STATUS_DOT[lead.status]
                          }
                        />
                        {statusLabel(lead.status)}
                      </span>
                    }
                  />
                </InfoCard>
              </div>

              {/* Operator note */}
              <div>
                <div className="text-[12px] font-semibold text-text-primary mb-2">
                  {t("lead.operatorNote")}
                </div>
                <div className="rounded-xl bg-bg-input p-3 mb-2 text-[12.5px] text-text-secondary">
                  {lead.description || t("lead.defaultDescriptionPlaceholder")}
                </div>
                <div className="flex gap-2">
                  <input
                    value={operatorNote}
                    onChange={(e) => setOperatorNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void submitComment(operatorNote);
                      }
                    }}
                    placeholder={t("lead.addNotePlaceholder")}
                    className="flex-1 rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => submitComment(operatorNote)}
                    disabled={sending || !operatorNote.trim()}
                    className="btn-primary text-[12.5px] disabled:opacity-50"
                  >
                    {t("lead.actionSave")}
                  </button>
                </div>
              </div>

              {/* Comments history */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[12px] font-semibold text-text-primary">
                    {t("lead.commentsHistory")}
                  </div>
                  <select
                    value={commentFilter}
                    onChange={(e) =>
                      setCommentFilter(e.target.value as LeadStatus | "all")
                    }
                    className="rounded-lg border border-line bg-bg-input px-2 py-1 text-[11.5px] outline-none"
                  >
                    <option value="all">{t("lead.commentsAll")}</option>
                    {COLUMNS.map((c) => (
                      <option key={c.status} value={c.status}>
                        {statusLabel(c.status)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  {filteredComments.length === 0 && (
                    <div className="rounded-lg bg-bg-input p-3 text-[12px] text-text-muted text-center">
                      {t("lead.noComments")}
                    </div>
                  )}
                  {filteredComments.map((c) => {
                    const badgeStatus = (c.new_status ||
                      c.old_status) as LeadStatus | "";
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg bg-bg-input p-3 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={c.operator?.name || "?"}
                            size={20}
                          />
                          <div className="text-[11.5px] font-semibold text-text-primary">
                            {c.operator?.name}
                          </div>
                          {badgeStatus && STATUS_PILL[badgeStatus as LeadStatus] && (
                            <span
                              className={
                                "rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
                                STATUS_PILL[badgeStatus as LeadStatus]
                              }
                            >
                              {statusLabel(badgeStatus as LeadStatus)}
                            </span>
                          )}
                          <div className="ml-auto text-[10.5px] text-text-muted">
                            {fmtDateTime(c.created_at)}
                          </div>
                        </div>
                        {c.text && (
                          <div className="text-[12.5px] text-text-primary whitespace-pre-wrap">
                            {c.text}
                          </div>
                        )}
                        {c.attachment_url && c.attachment_kind === "photo" && (
                          <a
                            href={c.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block mt-1"
                          >
                            <img
                              src={c.attachment_url}
                              alt={c.attachment_name || "photo"}
                              className="max-h-64 w-auto rounded-lg border border-line object-contain"
                              loading="lazy"
                            />
                          </a>
                        )}
                        {c.attachment_url && c.attachment_kind === "document" && (
                          <a
                            href={c.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 mt-1 rounded-lg border border-line bg-bg p-2 text-[12px] text-primary hover:bg-bg-hover"
                          >
                            📎 {c.attachment_name || t("lead.attachFile")}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "children" && (
            <div className="p-5">
              {!full ? (
                <div className="text-center py-10 text-[12px] text-text-muted">
                  {t("common.loading")}
                </div>
              ) : full.children.length === 0 ? (
                <div className="text-center py-10 text-[12px] text-text-muted">
                  {t("lead.noChildren")}
                </div>
              ) : (
                <div className="space-y-2">
                  {full.children.map((c) => (
                    <div
                      key={c.id}
                      className="card p-3 flex items-center gap-3"
                    >
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar name={c.name} size={40} />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-text-primary">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-text-secondary">
                          {c.age ? t("lead.ageYears", { n: c.age }) : ""}
                          {c.gender ? ` • ${c.gender === "male" ? t("lead.boy") : t("lead.girl")}` : ""}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10.5px] text-text-muted">
                          {c.language && (
                            <span>
                              {t("lead.language")}: {userLanguageLabel(c.language, t)}
                            </span>
                          )}
                          {c.device && (
                            <span>
                              {t("lead.device")}: {deviceLabel(c.device)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={
                          "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
                          (c.status === "active"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-text-muted/15 text-text-muted")
                        }
                      >
                        {c.status === "active" ? t("lead.connected") : t("lead.notConnected")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "payments" && (
            <div className="p-5">
              {!full ? (
                <div className="text-center py-10 text-[12px] text-text-muted">
                  {t("common.loading")}
                </div>
              ) : full.payments.length === 0 ? (
                <div className="text-center py-10 text-[12px] text-text-muted">
                  {t("lead.noPayments")}
                </div>
              ) : (
                <div className="space-y-2">
                  {full.payments.map((py) => (
                    <div
                      key={py.id}
                      className="card p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[13px] font-medium text-text-primary">
                          {py.plan_name || "Premium"}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {fmtDateTime(py.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13.5px] font-semibold text-text-primary">
                          {fmtNumber(py.amount)} {py.currency}
                        </div>
                        <div className="text-[11px] text-text-secondary">
                          {py.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "activity" && (
            <div className="p-5">
              {!full ? (
                <div className="text-center py-10 text-[12px] text-text-muted">
                  {t("common.loading")}
                </div>
              ) : full.activity.length === 0 ? (
                <div className="text-center py-10 text-[12px] text-text-muted">
                  {t("lead.noActivityRecords")}
                </div>
              ) : (
                <>
                  <div className="mb-3 text-[11px] text-text-muted">
                    {t("lead.totalActivityRecords", { n: full.activity.length })}
                  </div>
                  <div className="space-y-2">
                    {full.activity.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-line p-3"
                      >
                        <div
                          className={
                            "h-2 w-2 rounded-full mt-1.5 shrink-0 " +
                            (ACTIVITY_DOT[a.type] || "bg-text-muted")
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] text-text-primary">
                            {a.label}
                          </div>
                          <div className="text-[10.5px] text-text-muted">
                            {fmtDateTime(a.at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t border-line p-4 space-y-2">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitComment(newComment);
                }
              }}
              placeholder={t("lead.quickNotePlaceholder")}
              className="flex-1 rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <button
              onClick={() => submitComment(newComment)}
              disabled={sending || !newComment.trim()}
              className="btn-primary text-[12.5px] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu((v) => !v)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 text-[12.5px] font-medium"
              >
                <Edit3 className="h-3.5 w-3.5" /> {t("lead.changeStatus")}
              </button>
              {showStatusMenu && (
                <div
                  className="absolute bottom-full mb-1 left-0 right-0 rounded-lg border border-line bg-bg shadow-lg overflow-hidden z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {COLUMNS.map((c) => (
                    <button
                      key={c.status}
                      onClick={() => updateStatus(c.status)}
                      className={
                        "w-full text-left px-3 py-2 text-[12.5px] hover:bg-bg-hover flex items-center gap-2 " +
                        (lead.status === c.status
                          ? "bg-primary/10 text-primary"
                          : "text-text-primary")
                      }
                    >
                      <span
                        className={"h-1.5 w-1.5 rounded-full " + c.dotClass}
                      />
                      {statusLabel(c.status)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setNotifOpen(true)}
              disabled={!lead.parent}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 text-[12.5px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title={lead.parent ? t("lead.pushNotification") : t("lead.noParentLinked")}
            >
              <Bell className="h-3.5 w-3.5" /> {t("lead.actionNotify")}
            </button>
            <button
              onClick={blockUser}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-[12.5px] font-medium"
            >
              <Ban className="h-3.5 w-3.5" /> {t("lead.actionBlock")}
            </button>
            <button
              onClick={deleteLead}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-[12.5px] font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t("lead.actionDelete")}
            </button>
            <a
              href={p?.phone ? `tel:${p.phone}` : undefined}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-text-primary/10 hover:bg-text-primary/20 text-text-primary px-3 py-2 text-[12.5px] font-medium"
            >
              <PhoneCall className="h-3.5 w-3.5" /> {t("lead.actionCall")}
            </a>
          </div>
        </div>
      </div>

      {notifOpen && lead.parent && (
        <SendNotifModal
          parentId={lead.parent.id}
          parentName={lead.parent.name}
          onClose={() => setNotifOpen(false)}
          onSent={() => {
            setNotifOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SendNotifModal({
  parentId,
  parentName,
  onClose,
  onSent,
}: {
  parentId: number;
  parentName: string;
  onClose: () => void;
  onSent: (count: number) => void;
}) {
  const { t } = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("system");
  const [withSms, setWithSms] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      alert(t("lead.titleAndBodyRequired"));
      return;
    }
    setSending(true);
    try {
      const r = await notificationsApi.broadcast({
        title: title.trim(),
        body: body.trim(),
        category,
        audience: "selected",
        parent_ids: [parentId],
        send_sms: withSms,
      });
      onSent(r.sent ?? 0);
    } catch (e) {
      alert((e as { message?: string }).message || t("lead.failedToSend"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {t("lead.notifSendPush")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-[12px] text-text-secondary">
          {t("lead.notifRecipient", { name: "" })}
          <span className="font-medium text-text-primary">{parentName}</span>
        </p>
        <div className="space-y-3">
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("lead.notifTitle")}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder={t("lead.notifTitlePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("lead.notifBody")}
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={t("lead.notifBodyPlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("lead.notifCategory")}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              <option value="system">{t("lead.notifCatSystem")}</option>
              <option value="tip">{t("lead.notifCatTip")}</option>
              <option value="premium">{t("lead.notifCatPremium")}</option>
              <option value="sos">{t("lead.notifCatSos")}</option>
              <option value="order">{t("lead.notifCatOrder")}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={withSms}
              onChange={(e) => setWithSms(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-[12.5px] text-text-secondary">
              {t("lead.notifAlsoBySms")}
            </span>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("lead.actionCancel")}
          </button>
          <button
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />{" "}
            {sending ? t("lead.notifSending") : t("lead.actionSend")}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 text-[11.5px]">
      <div className="text-text-muted">{label}</div>
      <div
        className={
          "text-text-primary font-medium truncate " + (mono ? "font-mono" : "")
        }
      >
        {value ?? "—"}
      </div>
    </div>
  );
}
