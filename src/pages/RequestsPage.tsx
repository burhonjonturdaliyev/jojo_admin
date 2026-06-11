/**
 * Sorovlar (Support) sahifasi — operatorlar uchun ticket inbox + chat.
 *
 * Tugmalar:
 *   `/`  — composer'da bosilsa, tezkor javoblar (quick reply) menyusi ochiladi
 *   Enter — yuborish
 *   Shift+Enter — yangi qator
 *   Esc — qidiruv/komandalarni yopish
 *
 * Tezkor javoblar har bir til uchun alohida matnga ega — yuborilganda
 * tiketdagi `language` qiymatiga ko'ra mos matn olinadi.
 *
 * Realtime:  socket.io `lead_changed` + `lead_comment` event'lariga
 * obuna bo'lib, ro'yxat va aktiv chat avtomatik yangilanadi.
 */
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Hash,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import {
  leadsApi,
  quickRepliesApi,
  quickReplyTextFor,
  type AdminLead,
  type LeadComment,
  type LeadStatus,
  type SupportLanguage,
  type SupportQuickReply,
} from "../lib/resources";
import { subscribe } from "../lib/leadsSocket";

// ----------------------------------------------------------------------------
// Til / status / source — vizual yordamchilar
// ----------------------------------------------------------------------------

const LANG_META: Record<
  SupportLanguage,
  { flag: string; label: string }
> = {
  uz_latn: { flag: "🇺🇿", label: "Lotin" },
  uz_cyrl: { flag: "🇺🇿", label: "Кирилл" },
  ru: { flag: "🇷🇺", label: "Русский" },
  en: { flag: "🇬🇧", label: "English" },
};

const STATUS_META: Record<
  string,
  { label: string; dot: string; chip: string }
> = {
  new: {
    label: "Yangi",
    dot: "bg-status-new",
    chip: "bg-status-new/15 text-status-new",
  },
  in_progress: {
    label: "Jarayonda",
    dot: "bg-status-progress",
    chip: "bg-status-progress/15 text-status-progress",
  },
  waiting: {
    label: "Kutilmoqda",
    dot: "bg-status-waiting",
    chip: "bg-status-waiting/15 text-status-waiting",
  },
  resolved: {
    label: "Hal qilindi",
    dot: "bg-status-resolved",
    chip: "bg-status-resolved/15 text-status-resolved",
  },
  closed: {
    label: "Yopildi",
    dot: "bg-status-closed",
    chip: "bg-status-closed/15 text-status-closed",
  },
  blocked: {
    label: "Bloklangan",
    dot: "bg-status-blocked",
    chip: "bg-status-blocked/15 text-status-blocked",
  },
};

const SOURCE_META: Record<string, { label: string; icon: string }> = {
  telegram: { label: "Telegram", icon: "✈️" },
  app: { label: "Ilova", icon: "📱" },
  manual: { label: "Qo‘lda", icon: "✍️" },
};

const STATUS_TABS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "new", label: "Yangi" },
  { value: "in_progress", label: "Jarayonda" },
  { value: "waiting", label: "Kutilmoqda" },
  { value: "resolved", label: "Hal qilindi" },
  { value: "closed", label: "Yopildi" },
];

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "hozir";
  if (m < 60) return `${m} daq oldin`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} kun oldin`;
  return date.toLocaleDateString("uz-UZ");
}

function formatTime(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ----------------------------------------------------------------------------
// Sahifa
// ----------------------------------------------------------------------------

export function RequestsPage() {
  const { t } = useT();
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<LeadStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quickReplies, setQuickReplies] = useState<SupportQuickReply[]>([]);
  const [qrEditorOpen, setQrEditorOpen] = useState(false);

  // ---- Tiklash & ro'yxat olish
  const reload = async () => {
    setLoading(true);
    try {
      const board = await leadsApi.board({ per_column: 100 });
      // Hammasi kolonkasi yo'q — barcha statuslarni birlashtiramiz
      const merged: AdminLead[] = [];
      board.statuses.forEach((s) => {
        (board.columns[s] || []).forEach((it) => merged.push(it));
      });
      merged.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      setLeads(merged);
    } finally {
      setLoading(false);
    }
  };

  const loadQuickReplies = async () => {
    try {
      const r = await quickRepliesApi.list();
      setQuickReplies(r.results || []);
    } catch {
      setQuickReplies([]);
    }
  };

  useEffect(() => {
    void reload();
    void loadQuickReplies();
  }, []);

  // ---- Realtime: ro'yxat o'zgarishlari
  useEffect(() => {
    const offChanged = subscribe("lead_changed", (raw) => {
      const data = raw as { id: number; lead?: AdminLead; type?: string };
      if (!data?.id) return;
      if (data.type === "deleted") {
        setLeads((prev) => prev.filter((x) => x.id !== data.id));
        return;
      }
      if (!data.lead) return;
      setLeads((prev) => {
        const idx = prev.findIndex((x) => x.id === data.id);
        if (idx === -1) return [data.lead as AdminLead, ...prev];
        const next = prev.slice();
        next[idx] = data.lead as AdminLead;
        next.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
        return next;
      });
    });
    return () => {
      offChanged();
    };
  }, []);

  // ---- Filtrlash
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((it) => {
      if (statusTab !== "all" && it.status !== statusTab) return false;
      if (!q) return true;
      return (
        it.title?.toLowerCase().includes(q) ||
        it.parent?.name?.toLowerCase().includes(q) ||
        it.parent?.phone?.includes(q) ||
        it.telegram?.name?.toLowerCase().includes(q) ||
        it.telegram?.username?.toLowerCase().includes(q)
      );
    });
  }, [leads, search, statusTab]);

  // ---- Aktiv ticket — selectedId yo'q yoki filterga tushmasa, birinchisini olamiz
  const effectiveId = useMemo(() => {
    if (selectedId && filtered.some((x) => x.id === selectedId)) return selectedId;
    return filtered[0]?.id ?? null;
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => leads.find((x) => x.id === effectiveId) ?? null,
    [leads, effectiveId],
  );

  // ---- Statistika
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: leads.length,
      new: 0,
      in_progress: 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
    };
    leads.forEach((l) => {
      c[l.status] = (c[l.status] || 0) + 1;
    });
    return c;
  }, [leads]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.requests")}
        subtitle={`${counts.all} ta murojaat · ${counts.new || 0} yangi · ${counts.in_progress || 0} jarayonda`}
        actions={
          <button
            onClick={() => setQrEditorOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-input px-3 py-1.5 text-[12.5px] font-medium text-text-secondary hover:text-text-primary hover:border-brand/40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Shortcutlar ({quickReplies.length})
          </button>
        }
      />

      <div className="flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-[360px_1fr] gap-0 bg-bg">
          <TicketList
            items={filtered}
            counts={counts}
            loading={loading}
            search={search}
            onSearch={setSearch}
            statusTab={statusTab}
            onStatusTab={setStatusTab}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <ChatPanel
            ticket={selected}
            quickReplies={quickReplies}
            onTicketChange={(t) =>
              setLeads((prev) => prev.map((x) => (x.id === t.id ? t : x)))
            }
          />
        </div>
      </div>

      {qrEditorOpen && (
        <QuickReplyEditor
          items={quickReplies}
          onClose={() => setQrEditorOpen(false)}
          onChange={loadQuickReplies}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Ticket list (chap panel)
// ----------------------------------------------------------------------------

interface TicketListProps {
  items: AdminLead[];
  counts: Record<string, number>;
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  statusTab: LeadStatus | "all";
  onStatusTab: (v: LeadStatus | "all") => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function TicketList({
  items,
  counts,
  loading,
  search,
  onSearch,
  statusTab,
  onStatusTab,
  selectedId,
  onSelect,
}: TicketListProps) {
  return (
    <aside className="flex h-full flex-col border-r border-line bg-bg-panel">
      <div className="border-b border-line px-4 pb-3 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Mavzu, ism, telefon..."
            className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab.value;
            const count = counts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => onStatusTab(tab.value)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition " +
                  (active
                    ? "bg-brand text-white"
                    : "bg-bg-input text-text-secondary hover:text-text-primary")
                }
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={
                      "rounded-full px-1.5 py-px text-[10px] " +
                      (active
                        ? "bg-white/20 text-white"
                        : "bg-bg/60 text-text-muted")
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && (
          <div className="px-4 py-6 text-center text-[12.5px] text-text-muted">
            Yuklanmoqda...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="px-4 py-12 text-center text-text-muted">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
            <div className="text-[12.5px]">Murojaatlar yo'q</div>
          </div>
        )}
        {items.map((it) => (
          <TicketCard
            key={it.id}
            ticket={it}
            active={selectedId === it.id}
            onSelect={() => onSelect(it.id)}
          />
        ))}
      </div>
    </aside>
  );
}

function TicketCard({
  ticket,
  active,
  onSelect,
}: {
  ticket: AdminLead;
  active: boolean;
  onSelect: () => void;
}) {
  const name =
    ticket.parent?.name ||
    ticket.telegram?.name ||
    ticket.telegram?.username ||
    "Foydalanuvchi";
  const phone = ticket.parent?.phone || "";
  const status = STATUS_META[ticket.status] ?? STATUS_META.new;
  const lang = ticket.language as SupportLanguage | "";
  const langMeta = lang && LANG_META[lang as SupportLanguage];
  const source = ticket.source ? SOURCE_META[ticket.source] : null;
  const unread =
    ticket.last_message?.direction === "in" &&
    (ticket.status === "new" || ticket.status === "waiting");

  return (
    <button
      onClick={onSelect}
      className={
        "flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition " +
        (active
          ? "border-brand bg-bg-hover"
          : "border-transparent hover:bg-bg-hover/60")
      }
    >
      <div className="relative">
        <Avatar name={name} size={40} />
        {unread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-panel bg-brand" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold text-text-primary">
              {name}
            </span>
            {langMeta && (
              <span
                title={langMeta.label}
                className="text-[13px] leading-none"
              >
                {langMeta.flag}
              </span>
            )}
          </div>
          <span className="shrink-0 text-[10.5px] text-text-muted">
            {timeAgo(ticket.last_contact_at || ticket.updated_at)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
          {source && (
            <span className="inline-flex items-center gap-0.5">
              <span>{source.icon}</span>
              <span>{source.label}</span>
            </span>
          )}
          {phone && (
            <>
              <span>·</span>
              <span>{phone}</span>
            </>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 truncate text-[12px] text-text-secondary">
            {ticket.last_message ? (
              <>
                {ticket.last_message.direction === "out" && (
                  <span className="text-text-muted">Siz: </span>
                )}
                {ticket.last_message.text}
              </>
            ) : (
              <span className="text-text-muted italic">
                Hali xabar yo'q
              </span>
            )}
          </div>
          <span
            className={
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium " +
              status.chip
            }
          >
            {status.label}
          </span>
        </div>
        {ticket.rating != null && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-yellow-400">
            {"⭐".repeat(ticket.rating)}
            <span className="text-text-muted">({ticket.rating}/5)</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ----------------------------------------------------------------------------
// Chat panel (o'ng tomon)
// ----------------------------------------------------------------------------

function ChatPanel({
  ticket,
  quickReplies,
  onTicketChange,
}: {
  ticket: AdminLead | null;
  quickReplies: SupportQuickReply[];
  onTicketChange: (t: AdminLead) => void;
}) {
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrFilter, setQrFilter] = useState("");
  const messagesEnd = useRef<HTMLDivElement | null>(null);
  // Chat skrolini bevosita boshqaramiz — `scrollIntoView` global window
  // scroll'ni qo'zg'atishi mumkin, bu murojaatga bosganda butun sahifa
  // tepaga sakrab ketishiga sabab bo'lardi.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const lastTicketIdRef = useRef<number | null>(null);

  const ticketId = ticket?.id ?? null;

  const fetchComments = useCallback(
    (id: number) => {
      let cancelled = false;
      setLoading(true);
      setLoadError(null);
      leadsApi
        .comments(id)
        .then((r) => {
          if (cancelled) return;
          setComments((r.results || []).slice().reverse());
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          const msg =
            (e as { message?: string })?.message ||
            "Xabarlarni yuklab bo'lmadi";
          setLoadError(msg);
          setComments([]);
          console.error("[Requests] failed to load comments:", e);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    },
    [],
  );

  useEffect(() => {
    if (ticketId == null) {
      setComments([]);
      setLoadError(null);
      return;
    }
    const cancel = fetchComments(ticketId);
    setDraft("");
    setShowQr(false);
    return cancel;
  }, [ticketId, fetchComments]);

  // Realtime — yangi izoh kelsa
  useEffect(() => {
    if (ticketId == null) return;
    const off = subscribe("lead_comment", (raw) => {
      const data = raw as { ticket_id: number; comment: LeadComment };
      if (!data?.comment || data.ticket_id !== ticketId) return;
      setComments((prev) =>
        prev.find((x) => x.id === data.comment.id)
          ? prev
          : [...prev, data.comment],
      );
    });
    return () => {
      off();
    };
  }, [ticketId]);

  // Chat scrollni bevosita container ichida boshqaramiz. `scrollIntoView`
  // brauzer bo'yicha eng yaqin scrollable parent'ni topadi va ba'zi
  // hollarda window'gacha "ko'tarilib" ketadi — admin panelida shu
  // bilan "yangi murojaatga bossam sahifa tepaga sakraydi" muammosini
  // keltirib chiqarardi.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const switched = lastTicketIdRef.current !== ticketId;
    lastTicketIdRef.current = ticketId;
    // Murojaat o'zgarsa darrov pastga; xuddi shu murojaat ichida yangi
    // xabar kelsa — smooth animatsiya bilan.
    el.scrollTo({
      top: el.scrollHeight,
      behavior: switched ? "auto" : "smooth",
    });
  }, [ticketId, comments.length]);

  // Textarea draft o'sganda balandligini avto-moslash — `rows=1` bilan
  // qulflanmasin.
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft]);

  if (!ticket) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <div className="text-center text-text-muted">
          <MessageCircle className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <div className="text-[13px]">
            Suhbatni boshlash uchun chap tomondan murojaatni tanlang
          </div>
        </div>
      </div>
    );
  }

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const c = await leadsApi.addComment(ticket.id, { text });
      setComments((prev) =>
        prev.find((x) => x.id === c.id) ? prev : [...prev, c],
      );
      setDraft("");
      setShowQr(false);
    } finally {
      setSending(false);
      composerRef.current?.focus();
    }
  };

  const sendQuickReply = async (qr: SupportQuickReply) => {
    if (sending) return;
    setSending(true);
    try {
      const c = await leadsApi.addComment(ticket.id, {
        quick_reply_id: qr.id,
      });
      setComments((prev) =>
        prev.find((x) => x.id === c.id) ? prev : [...prev, c],
      );
      setDraft("");
      setShowQr(false);
    } finally {
      setSending(false);
      composerRef.current?.focus();
    }
  };

  const insertQuickReply = (qr: SupportQuickReply) => {
    const text = quickReplyTextFor(qr, ticket.language as SupportLanguage);
    setDraft(text);
    setShowQr(false);
    composerRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
      return;
    }
    if (e.key === "Escape") {
      setShowQr(false);
    }
  };

  const onDraftChange = (v: string) => {
    setDraft(v);
    if (v.startsWith("/")) {
      setQrFilter(v.slice(1).trim().toLowerCase());
      setShowQr(true);
    } else if (v === "") {
      setShowQr(false);
    } else {
      setShowQr(false);
    }
  };

  const filteredQr = quickReplies.filter((q) => {
    if (!qrFilter) return true;
    return (
      q.code.toLowerCase().includes(qrFilter) ||
      q.title.toLowerCase().includes(qrFilter)
    );
  });

  const changeStatus = async (newStatus: LeadStatus) => {
    try {
      const updated = await leadsApi.update(ticket.id, { status: newStatus });
      onTicketChange(updated);
    } catch {
      /* noop */
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-bg">
      <ChatHeader ticket={ticket} onStatusChange={changeStatus} />

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-6 py-5"
      >
        {loading && (
          <div className="py-12 text-center text-[12.5px] text-text-muted">
            Yuklanmoqda...
          </div>
        )}
        {!loading && loadError && (
          <div className="mx-auto max-w-md rounded-xl border border-status-blocked/30 bg-status-blocked/5 p-4 text-center">
            <div className="text-[12.5px] font-semibold text-status-blocked">
              Xabarlarni yuklab bo'lmadi
            </div>
            <div className="mt-1 text-[11.5px] text-text-muted">
              {loadError}
            </div>
            <button
              onClick={() => ticketId != null && fetchComments(ticketId)}
              className="btn-secondary mt-3 text-[12px]"
            >
              Qayta urinish
            </button>
          </div>
        )}
        {!loading && !loadError && comments.length === 0 && (
          <div className="py-12 text-center text-text-muted">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
            <div className="text-[12.5px]">
              {ticket.bot_state === "awaiting_language"
                ? "Foydalanuvchi suhbatni boshladi, til tanlashi kutilmoqda"
                : "Hali xabar yo'q — javob yozib suhbatni boshlang"}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {comments.map((c) => (
            <MessageBubble key={c.id} comment={c} />
          ))}
          {ticket.rating != null && (
            <RatingCard ticket={ticket} />
          )}
        </div>
        <div ref={messagesEnd} />
      </div>

      <div className="relative shrink-0 border-t border-line bg-bg-panel">
        {showQr && filteredQr.length > 0 && (
          <QuickReplyMenu
            items={filteredQr}
            ticketLang={ticket.language as SupportLanguage | ""}
            onPick={insertQuickReply}
            onSend={sendQuickReply}
          />
        )}
        <form onSubmit={send} className="flex items-end gap-2 px-4 py-3">
          <button
            type="button"
            title="Shortcutlar (/)"
            onClick={() => {
              setShowQr((v) => !v);
              setQrFilter("");
            }}
            className="rounded-lg border border-line bg-bg-input p-2 text-text-secondary hover:text-text-primary"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <textarea
            ref={composerRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Xabarni yozing... ( / — shortcutlar, Enter — yuborish )"
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none overflow-y-auto rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] leading-5 text-text-primary outline-none focus:border-brand scrollbar-thin"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-brand-hover"
          >
            <Send className="h-3.5 w-3.5" />
            Yuborish
          </button>
        </form>
      </div>
    </section>
  );
}

function ChatHeader({
  ticket,
  onStatusChange,
}: {
  ticket: AdminLead;
  onStatusChange: (s: LeadStatus) => void;
}) {
  const name =
    ticket.parent?.name ||
    ticket.telegram?.name ||
    ticket.telegram?.username ||
    "Foydalanuvchi";
  const lang = ticket.language as SupportLanguage | "";
  const langMeta = lang && LANG_META[lang as SupportLanguage];
  const source = ticket.source ? SOURCE_META[ticket.source] : null;
  const status = STATUS_META[ticket.status] ?? STATUS_META.new;

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-line bg-bg-panel px-6 py-3">
      <Avatar name={name} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-[14.5px] font-semibold text-text-primary">
            {name}
          </h2>
          {langMeta && (
            <span
              title={`Til: ${langMeta.label}`}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-input px-2 py-0.5 text-[10.5px] text-text-secondary"
            >
              <span>{langMeta.flag}</span>
              <span>{langMeta.label}</span>
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-text-secondary">
          {source && (
            <span className="inline-flex items-center gap-1">
              <span>{source.icon}</span>
              <span>{source.label}</span>
            </span>
          )}
          {ticket.parent?.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {ticket.parent.phone}
            </span>
          )}
          {ticket.telegram?.username && (
            <span>@{ticket.telegram.username}</span>
          )}
          <span className="inline-flex items-center gap-1 text-text-muted">
            <Hash className="h-3 w-3" />
            {ticket.id}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-bg-input px-2.5 py-1 text-[11px] text-text-secondary">
          <span className={"h-1.5 w-1.5 rounded-full " + status.dot} />
          {status.label}
        </div>
        <select
          value={ticket.status}
          onChange={(e) => onStatusChange(e.target.value as LeadStatus)}
          className="rounded-lg border border-line bg-bg-input px-2 py-1 text-[11.5px] text-text-primary outline-none focus:border-brand"
        >
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

function MessageBubble({ comment }: { comment: LeadComment }) {
  const isOut = comment.direction === "out" || comment.is_operator;
  return (
    <div className={"flex " + (isOut ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[70%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed " +
          (isOut
            ? "bg-brand text-white"
            : "bg-bg-card text-text-primary border border-line")
        }
      >
        {isOut && comment.operator && (
          <div className="mb-0.5 text-[10.5px] font-medium text-white/70">
            {comment.operator.name}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{comment.text}</div>
        <div
          className={
            "mt-1 text-right text-[10px] " +
            (isOut ? "text-white/60" : "text-text-muted")
          }
        >
          {formatTime(comment.created_at)}
        </div>
      </div>
    </div>
  );
}

function RatingCard({ ticket }: { ticket: AdminLead }) {
  const rating = ticket.rating ?? 0;
  return (
    <div className="mx-auto max-w-[420px] rounded-xl border border-status-resolved/30 bg-status-resolved/5 px-4 py-3 text-center">
      <div className="text-[11.5px] uppercase tracking-wide text-status-resolved">
        Foydalanuvchi baholadi
      </div>
      <div className="mt-1 text-[22px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              "inline-block h-5 w-5 " +
              (i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-text-muted/30")
            }
          />
        ))}
      </div>
      {ticket.rating_comment && (
        <div className="mt-2 text-[12px] italic text-text-secondary">
          “{ticket.rating_comment}”
        </div>
      )}
      <div className="mt-1 text-[10.5px] text-text-muted">
        {ticket.rated_at ? new Date(ticket.rated_at).toLocaleString("uz-UZ") : ""}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Quick reply menyusi (composer ustida)
// ----------------------------------------------------------------------------

function QuickReplyMenu({
  items,
  ticketLang,
  onPick,
  onSend,
}: {
  items: SupportQuickReply[];
  ticketLang: SupportLanguage | "";
  onPick: (q: SupportQuickReply) => void;
  onSend: (q: SupportQuickReply) => void;
}) {
  return (
    <div className="absolute bottom-full left-4 right-4 mb-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-bg-card p-1 shadow-panel scrollbar-thin">
      <div className="px-3 py-2 text-[10.5px] uppercase tracking-wide text-text-muted">
        Tezkor javoblar — bosing kiritish, ✈ — to'g'ridan-to'g'ri yuborish
      </div>
      {items.map((q) => {
        const preview = quickReplyTextFor(q, ticketLang);
        return (
          <div
            key={q.id}
            className="group flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-bg-hover"
          >
            <div
              className="min-w-0 flex-1 cursor-pointer"
              onClick={() => onPick(q)}
            >
              <div className="flex items-center gap-2 text-[12px]">
                <span className="rounded bg-bg-input px-1.5 py-0.5 font-mono text-[11px] text-brand">
                  /{q.code}
                </span>
                <span className="font-semibold text-text-primary">
                  {q.title}
                </span>
                {q.scope === "personal" && (
                  <span className="rounded bg-bg-input px-1.5 py-0.5 text-[9.5px] text-text-muted">
                    shaxsiy
                  </span>
                )}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[11.5px] text-text-secondary">
                {preview || (
                  <span className="italic text-text-muted">
                    Tilingiz uchun matn yo'q
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onSend(q)}
              title="Darrov yuborish"
              className="rounded-md bg-brand/15 p-1.5 text-brand opacity-0 hover:bg-brand/30 group-hover:opacity-100"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Quick reply editor (modal)
// ----------------------------------------------------------------------------

function QuickReplyEditor({
  items,
  onClose,
  onChange,
}: {
  items: SupportQuickReply[];
  onClose: () => void;
  onChange: () => void;
}) {
  const empty = (): Partial<SupportQuickReply> => ({
    code: "",
    title: "",
    scope: "global",
    text_uz_latn: "",
    text_uz_cyrl: "",
    text_ru: "",
    text_en: "",
    order: 0,
  });
  const [editing, setEditing] = useState<Partial<SupportQuickReply> | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!editing) return;
    if (!editing.code?.trim() || !editing.title?.trim()) return;
    setSaving(true);
    try {
      if (editing.id) {
        await quickRepliesApi.update(editing.id, editing);
      } else {
        await quickRepliesApi.create(editing);
      }
      onChange();
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Shortcut o'chirilsinmi?")) return;
    await quickRepliesApi.remove(id);
    onChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-bg-panel shadow-panel">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <h2 className="text-[15px] font-bold text-text-primary">
              Tezkor javoblar (shortcuts)
            </h2>
            <p className="mt-0.5 text-[11.5px] text-text-secondary">
              Operatorlar chatda <code className="text-brand">/code</code> yozib
              foydalanadi. Har bir til uchun alohida matn yozish mumkin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid flex-1 grid-cols-[260px_1fr] overflow-hidden">
          <div className="overflow-y-auto border-r border-line scrollbar-thin">
            <button
              onClick={() => setEditing(empty())}
              className="flex w-full items-center gap-2 border-b border-line px-4 py-3 text-[12.5px] font-semibold text-brand hover:bg-bg-hover"
            >
              <Plus className="h-3.5 w-3.5" /> Yangi shortcut
            </button>
            {items.map((q) => (
              <button
                key={q.id}
                onClick={() => setEditing(q)}
                className={
                  "flex w-full flex-col items-start gap-0.5 border-l-2 px-4 py-2.5 text-left " +
                  (editing?.id === q.id
                    ? "border-brand bg-bg-hover"
                    : "border-transparent hover:bg-bg-hover/60")
                }
              >
                <div className="flex w-full items-center gap-2">
                  <span className="rounded bg-bg-input px-1.5 py-0.5 font-mono text-[10.5px] text-brand">
                    /{q.code}
                  </span>
                  <span className="truncate text-[12.5px] font-medium text-text-primary">
                    {q.title}
                  </span>
                </div>
                {q.scope === "personal" && (
                  <span className="text-[10px] text-text-muted">
                    shaxsiy
                  </span>
                )}
              </button>
            ))}
            {items.length === 0 && (
              <div className="px-4 py-6 text-center text-[12px] text-text-muted">
                Hozircha shortcut yo'q
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-5 scrollbar-thin">
            {!editing && (
              <div className="flex h-full items-center justify-center text-text-muted">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 opacity-40" />
                  <div className="text-[12.5px]">
                    Chap tomondan shortcut tanlang yoki yangisini yarating
                  </div>
                </div>
              </div>
            )}
            {editing && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Kod (komanda)">
                    <input
                      value={editing.code || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, code: e.target.value })
                      }
                      placeholder="salom"
                      className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 font-mono text-[13px] text-text-primary outline-none focus:border-brand"
                    />
                  </Field>
                  <Field label="Sarlavha">
                    <input
                      value={editing.title || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, title: e.target.value })
                      }
                      placeholder="Salomlashish"
                      className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ko'rinish">
                    <select
                      value={editing.scope || "global"}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          scope: e.target.value as "global" | "personal",
                        })
                      }
                      className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none"
                    >
                      <option value="global">Hammaga</option>
                      <option value="personal">Faqat menga</option>
                    </select>
                  </Field>
                  <Field label="Tartib">
                    <input
                      type="number"
                      value={editing.order ?? 0}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          order: parseInt(e.target.value || "0", 10),
                        })
                      }
                      className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none"
                    />
                  </Field>
                </div>

                <TextArea
                  label={"🇺🇿 O‘zbek (lotin)"}
                  value={editing.text_uz_latn || ""}
                  onChange={(v) =>
                    setEditing({ ...editing, text_uz_latn: v })
                  }
                />
                <TextArea
                  label={"🇺🇿 Ўзбек (кирилл)"}
                  value={editing.text_uz_cyrl || ""}
                  onChange={(v) =>
                    setEditing({ ...editing, text_uz_cyrl: v })
                  }
                />
                <TextArea
                  label={"🇷🇺 Русский"}
                  value={editing.text_ru || ""}
                  onChange={(v) => setEditing({ ...editing, text_ru: v })}
                />
                <TextArea
                  label={"🇬🇧 English"}
                  value={editing.text_en || ""}
                  onChange={(v) => setEditing({ ...editing, text_en: v })}
                />

                <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
                  <div>
                    {editing.id && (
                      <button
                        onClick={() => remove(editing.id!)}
                        className="text-[12px] text-status-blocked hover:underline"
                      >
                        O'chirish
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-line bg-bg-input px-3 py-1.5 text-[12.5px] text-text-secondary hover:text-text-primary"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Saqlash
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
      />
    </Field>
  );
}
