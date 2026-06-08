import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Phone,
  Clock,
  MessageSquare,
  X,
  Send,
  Trash2,
  Circle,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import {
  leadsApi,
  type AdminLead,
  type LeadBoardResponse,
  type LeadComment,
  type LeadStatus,
} from "../lib/resources";
import { subscribe } from "../lib/leadsSocket";

interface ColumnDef {
  status: LeadStatus;
  label: string;
  color: string;
  Icon: typeof Circle;
}

const COLUMNS: ColumnDef[] = [
  { status: "new", label: "Yangi", color: "bg-blue-500", Icon: Circle },
  { status: "in_progress", label: "Jarayonda", color: "bg-amber-500", Icon: AlertCircle },
  { status: "waiting", label: "Kutilmoqda", color: "bg-purple-500", Icon: PauseCircle },
  { status: "resolved", label: "Hal qilingan", color: "bg-emerald-500", Icon: CheckCircle2 },
  { status: "closed", label: "Yopilgan", color: "bg-slate-400", Icon: XCircle },
  { status: "blocked", label: "Bloklangan", color: "bg-red-500", Icon: ShieldAlert },
];

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-500/15 text-red-500",
  normal: "bg-text-secondary/15 text-text-secondary",
  low: "bg-emerald-500/15 text-emerald-500",
};

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff} soniya oldin`;
  if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function LeadsPage() {
  const [board, setBoard] = useState<LeadBoardResponse | null>(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [socketUp, setSocketUp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const reload = useCallback(async (q?: string) => {
    setError(null);
    try {
      const r = await leadsApi.board({ q: q || undefined });
      setBoard(r);
    } catch (e) {
      setError((e as { message?: string }).message || "Yuklash xato");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Debounce search input
  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void reload(searchDebounced);
  }, [searchDebounced, reload]);

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
  };

  // Socket.IO real-time
  useEffect(() => {
    const offConn = subscribe("connect", () => setSocketUp(true));
    const offDisc = subscribe("disconnect", () => setSocketUp(false));
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
        // Remove from old column
        for (const st of next.statuses) {
          next.columns[st] = (next.columns[st] || []).filter((l) => l.id !== ev.id);
        }
        if (ev.type === "deleted") {
          // recompute counts
        } else if (ev.lead) {
          const col = next.columns[ev.lead.status] || [];
          next.columns[ev.lead.status] = [ev.lead, ...col];
        }
        // recompute counts
        const counts = {} as Record<LeadStatus, number>;
        for (const st of next.statuses) {
          counts[st] = (next.columns[st] || []).length;
        }
        next.counts = counts;
        return next;
      });
      if (ev.type === "status_changed" && ev.from !== ev.to) {
        showToast(`Lead #${ev.id}: ${ev.from} → ${ev.to}`);
      } else if (ev.type === "created") {
        showToast(`Yangi lead: #${ev.id}`);
      } else if (ev.type === "deleted") {
        showToast(`Lead o'chirildi: #${ev.id}`);
      }
    });
    return () => {
      offConn();
      offDisc();
      offChanged();
    };
  }, []);

  const onDragStart = (id: number) => setDraggedId(id);
  const onDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const moveLead = async (leadId: number, toStatus: LeadStatus) => {
    if (!board) return;
    const fromStatus = board.statuses.find((s) =>
      (board.columns[s] || []).some((l) => l.id === leadId),
    );
    if (!fromStatus || fromStatus === toStatus) return;
    const lead = (board.columns[fromStatus] || []).find((l) => l.id === leadId);
    if (!lead) return;
    // Optimistic update
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
    } catch (e) {
      showToast("Saqlanmadi — qayta urinib ko'ring");
      void reload(searchDebounced);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Leadlar"
        subtitle={
          board
            ? `${Object.values(board.counts).reduce((a, b) => a + b, 0)} ta lead`
            : "Yuklanmoqda..."
        }
        actions={
          <div className="flex items-center gap-3">
            <div
              className={
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium " +
                (socketUp
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-text-muted/15 text-text-muted")
              }
              title={socketUp ? "Real-time ulangan" : "Ulanmagan"}
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (socketUp ? "bg-emerald-500" : "bg-text-muted")
                }
              />
              {socketUp ? "Live" : "Offline"}
            </div>
            <button
              onClick={() => reload(searchDebounced)}
              className="icon-btn h-8 w-8"
              title="Yangilash"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="px-7 pt-4">
        <div className="card p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish: ism, telefon, mavzu, izoh..."
              className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin px-7 py-4">
        {error && (
          <div className="card p-4 mb-4 text-[13px] text-red-500">{error}</div>
        )}
        {loading && !board ? (
          <div className="card p-12 text-center text-text-muted">
            Yuklanmoqda...
          </div>
        ) : (
          <div className="flex gap-3 h-full pb-4">
            {COLUMNS.map((col) => {
              const items = board?.columns[col.status] || [];
              const count = board?.counts[col.status] ?? 0;
              const isOver = dragOverCol === col.status;
              return (
                <div
                  key={col.status}
                  className={
                    "flex-shrink-0 w-[320px] flex flex-col rounded-2xl border transition-all " +
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
                    if (draggedId != null) {
                      void moveLead(draggedId, col.status);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
                    <div
                      className={"h-2 w-2 rounded-full " + col.color}
                    />
                    <col.Icon className="h-4 w-4 text-text-secondary" />
                    <div className="text-[13px] font-semibold text-text-primary flex-1">
                      {col.label}
                    </div>
                    <div className="rounded-full bg-bg-input px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                      {count}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-[11.5px] text-text-muted">
                        Bo'sh
                      </div>
                    ) : (
                      items.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          dragging={draggedId === lead.id}
                          onDragStart={() => onDragStart(lead.id)}
                          onDragEnd={onDragEnd}
                          onClick={() => setSelectedLead(lead)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onChanged={() => reload(searchDebounced)}
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

function LeadCard({
  lead,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  lead: AdminLead;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const priorityCls = PRIORITY_BADGE[lead.priority] || PRIORITY_BADGE.normal;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={
        "group cursor-grab active:cursor-grabbing rounded-xl bg-bg p-3 border border-line hover:border-primary/40 hover:shadow-sm transition-all " +
        (dragging ? "opacity-50 rotate-1" : "")
      }
    >
      <div className="flex items-start gap-2 mb-2">
        <Avatar name={lead.parent?.name || "?"} size={32} />
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-text-primary truncate">
            {lead.parent?.name || "Noma'lum"}
          </div>
          <div className="text-[10.5px] text-text-muted font-mono truncate">
            {lead.parent?.phone || ""}
          </div>
        </div>
        <span
          className={
            "rounded-full px-1.5 py-0.5 text-[9.5px] font-medium uppercase " +
            priorityCls
          }
        >
          {lead.priority}
        </span>
      </div>
      <div className="text-[12.5px] font-medium text-text-primary line-clamp-2">
        {lead.title}
      </div>
      {lead.description && (
        <div className="mt-1 text-[11px] text-text-secondary line-clamp-2">
          {lead.description}
        </div>
      )}
      <div className="mt-2 flex items-center gap-3 text-[10.5px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {fmtTime(lead.updated_at)}
        </span>
        {lead.comments_count > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {lead.comments_count}
          </span>
        )}
        {lead.operator && (
          <span className="ml-auto truncate text-text-secondary">
            {lead.operator.name}
          </span>
        )}
      </div>
    </div>
  );
}

function LeadDetailPanel({
  lead: initialLead,
  onClose,
  onChanged,
}: {
  lead: AdminLead;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [lead, setLead] = useState(initialLead);
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const r = await leadsApi.comments(lead.id);
      setComments(r.results || []);
    } finally {
      setLoadingComments(false);
    }
  }, [lead.id]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  // Listen for comment events on this ticket
  useEffect(() => {
    const off = subscribe("lead_comment", (raw) => {
      const ev = raw as { ticket_id: number; comment: LeadComment };
      if (ev.ticket_id === lead.id && ev.comment) {
        setComments((prev) =>
          prev.find((c) => c.id === ev.comment.id)
            ? prev
            : [ev.comment, ...prev],
        );
      }
    });
    return () => off();
  }, [lead.id]);

  const submitComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    setSending(true);
    try {
      const c = await leadsApi.addComment(lead.id, text);
      setComments((prev) =>
        prev.find((x) => x.id === c.id) ? prev : [c, ...prev],
      );
      setNewComment("");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (s: LeadStatus) => {
    const updated = await leadsApi.update(lead.id, { status: s });
    setLead(updated);
    onChanged();
  };

  const remove = async () => {
    if (!confirm("Lead o'chirilsinmi?")) return;
    await leadsApi.remove(lead.id);
    onChanged();
    onClose();
  };

  const statusOptions = useMemo(
    () => COLUMNS.map((c) => ({ status: c.status, label: c.label })),
    [],
  );

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] h-full bg-bg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-line">
          <div className="min-w-0 flex-1 flex items-start gap-3">
            <Avatar name={lead.parent?.name || "?"} size={44} />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-text-primary truncate">
                {lead.parent?.name}
              </div>
              <a
                href={lead.parent?.phone ? `tel:${lead.parent.phone}` : undefined}
                className="text-[12.5px] text-text-secondary font-mono inline-flex items-center gap-1 hover:text-primary"
              >
                <Phone className="h-3 w-3" /> {lead.parent?.phone}
              </a>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-5 space-y-4">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Mavzu
              </div>
              <div className="text-[14px] font-semibold text-text-primary">
                {lead.title}
              </div>
              {lead.description && (
                <div className="mt-1.5 text-[12.5px] text-text-secondary whitespace-pre-wrap">
                  {lead.description}
                </div>
              )}
            </div>

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Status
              </div>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((o) => (
                  <button
                    key={o.status}
                    onClick={() => updateStatus(o.status)}
                    className={
                      "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors " +
                      (lead.status === o.status
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-line bg-bg-input text-text-secondary hover:bg-bg-hover")
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <div className="text-text-muted text-[10.5px] uppercase font-semibold mb-0.5">
                  Operator
                </div>
                <div className="text-text-primary font-medium">
                  {lead.operator?.name || "—"}
                </div>
              </div>
              <div>
                <div className="text-text-muted text-[10.5px] uppercase font-semibold mb-0.5">
                  Yaratildi
                </div>
                <div className="text-text-primary">
                  {new Date(lead.created_at).toLocaleString("uz-UZ")}
                </div>
              </div>
              <div>
                <div className="text-text-muted text-[10.5px] uppercase font-semibold mb-0.5">
                  Oxirgi yangilanish
                </div>
                <div className="text-text-primary">
                  {fmtTime(lead.updated_at)}
                </div>
              </div>
              <div>
                <div className="text-text-muted text-[10.5px] uppercase font-semibold mb-0.5">
                  Prioritet
                </div>
                <div className="text-text-primary">{lead.priority}</div>
              </div>
            </div>

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                Izohlar tarixi ({comments.length})
              </div>
              <div className="space-y-2">
                {loadingComments && (
                  <div className="text-[11.5px] text-text-muted">
                    Yuklanmoqda...
                  </div>
                )}
                {!loadingComments && comments.length === 0 && (
                  <div className="rounded-lg bg-bg-input p-3 text-[12px] text-text-muted text-center">
                    Hozircha izoh yo'q
                  </div>
                )}
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-bg-input p-3 space-y-1"
                  >
                    <div className="flex items-baseline gap-2">
                      <div className="text-[11.5px] font-semibold text-text-primary">
                        {c.operator?.name || "—"}
                      </div>
                      <div className="text-[10.5px] text-text-muted">
                        {fmtTime(c.created_at)}
                      </div>
                      {c.old_status && c.new_status && c.old_status !== c.new_status && (
                        <div className="text-[10.5px] text-text-secondary ml-auto">
                          {c.old_status} → {c.new_status}
                        </div>
                      )}
                    </div>
                    <div className="text-[12.5px] text-text-primary whitespace-pre-wrap">
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-line p-4 space-y-2">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitComment();
                }
              }}
              placeholder="Izoh yozing..."
              className="flex-1 rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
            <button
              onClick={submitComment}
              disabled={sending || !newComment.trim()}
              className="btn-primary text-[12.5px] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={remove}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] font-medium text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Lead'ni o'chirish
          </button>
        </div>
      </div>
    </div>
  );
}
