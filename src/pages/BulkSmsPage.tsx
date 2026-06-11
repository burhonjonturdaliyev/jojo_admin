/**
 * Bulk SMS — operator bir nechta raqamga bir martada SMS yuborish, kontakt
 * guruhlari va kampaniyalar tarixini ko'rish uchun professional sahifa.
 *
 * 3 ta tab:
 *   - Yangi yuborish (compose) — raqamlarni qo'lda kiritish / guruh tanlash /
 *     CSV-XLSX yuklash; 4 tildagi matn; preview; "Yuborish" tugmasi
 *   - Tarix (history) — kampaniyalar ro'yxati; klik → detail bilan
 *     per-recipient holatlari ko'rinadi
 *   - Guruhlar (groups) — kontakt guruhlarini boshqarish (CRUD + import)
 */
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Send,
  Upload,
  X,
  Users as UsersIcon,
  History,
  PlusCircle,
  Trash2,
  Search,
  AlertTriangle,
  Layers,
  FileText,
  Phone,
  Loader2,
  Sparkles,
  Hash,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  bulkSmsApi,
  type BulkSmsCampaign,
  type ParsedNumber,
  type SmsContactGroup,
  type SmsContact,
} from "../lib/resources";

type Tab = "compose" | "history" | "groups";

const STATUS_META: Record<
  BulkSmsCampaign["status"],
  { label: string; chip: string }
> = {
  queued: { label: "Navbatda", chip: "bg-text-muted/15 text-text-muted" },
  sending: { label: "Yuborilmoqda", chip: "bg-status-progress/15 text-status-progress" },
  done: { label: "Yakunlangan", chip: "bg-status-resolved/15 text-status-resolved" },
};

const SOURCE_META: Record<
  BulkSmsCampaign["source"],
  { label: string; icon: string }
> = {
  manual: { label: "Qo'lda", icon: "✍️" },
  group: { label: "Guruh", icon: "📋" },
  csv: { label: "CSV/XLSX", icon: "📄" },
  mixed: { label: "Aralash", icon: "🔀" },
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BulkSmsPage() {
  const [tab, setTab] = useState<Tab>("compose");
  const [groups, setGroups] = useState<SmsContactGroup[]>([]);
  const [campaigns, setCampaigns] = useState<BulkSmsCampaign[]>([]);
  const [openCampaign, setOpenCampaign] = useState<BulkSmsCampaign | null>(null);

  const reloadGroups = useCallback(async () => {
    try {
      const r = await bulkSmsApi.groupList();
      setGroups(r.results || []);
    } catch {
      setGroups([]);
    }
  }, []);

  const reloadCampaigns = useCallback(async () => {
    try {
      const r = await bulkSmsApi.campaignList({ page_size: 50 });
      setCampaigns(r.results || []);
    } catch {
      setCampaigns([]);
    }
  }, []);

  useEffect(() => {
    void reloadGroups();
    void reloadCampaigns();
  }, [reloadGroups, reloadCampaigns]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Bulk SMS"
        subtitle="Bir nechta raqamga bir martada SMS yuborish — qo'lda, guruhdan yoki CSV/XLSX dan"
        actions={
          <div className="flex gap-1.5">
            {[
              { v: "compose" as Tab, label: "Yangi yuborish", icon: Send },
              { v: "history" as Tab, label: "Tarix", icon: History },
              { v: "groups" as Tab, label: "Guruhlar", icon: Layers },
            ].map((t) => {
              const active = tab === t.v;
              return (
                <button
                  key={t.v}
                  onClick={() => setTab(t.v)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition " +
                    (active
                      ? "bg-brand text-white"
                      : "border border-line bg-bg-input text-text-secondary hover:text-text-primary")
                  }
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {tab === "compose" && (
          <ComposeTab
            groups={groups}
            onSent={() => {
              void reloadCampaigns();
              setTab("history");
            }}
          />
        )}
        {tab === "history" && (
          <HistoryTab
            campaigns={campaigns}
            onOpen={setOpenCampaign}
            onReload={reloadCampaigns}
          />
        )}
        {tab === "groups" && (
          <GroupsTab groups={groups} onChange={reloadGroups} />
        )}
      </div>

      {openCampaign && (
        <CampaignDetailModal
          campaign={openCampaign}
          onClose={() => setOpenCampaign(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Compose tab — yangi yuborish
// ----------------------------------------------------------------------------

function ComposeTab({
  groups,
  onSent,
}: {
  groups: SmsContactGroup[];
  onSent: () => void;
}) {
  type Mode = "manual" | "group" | "csv";
  const [mode, setMode] = useState<Mode>("manual");

  // Manual: ko'p qatorli textarea (raqamlar)
  const [manualText, setManualText] = useState("");

  // Group
  const [groupId, setGroupId] = useState<number | null>(null);

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedFromFile, setParsedFromFile] = useState<ParsedNumber[]>([]);

  // Message
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");

  // Parsed numbers (for manual/csv preview)
  const [parsedNumbers, setParsedNumbers] = useState<ParsedNumber[]>([]);
  const [parsing, setParsing] = useState(false);

  // Sending
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
    total: number;
    failedSample: Array<{ phone: string; reason: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live parse — manual text yoki csv fayl uchun
  useEffect(() => {
    if (mode !== "manual") return;
    if (!manualText.trim()) {
      setParsedNumbers([]);
      return;
    }
    const handler = window.setTimeout(async () => {
      setParsing(true);
      try {
        const r = await bulkSmsApi.parseNumbers(manualText);
        setParsedNumbers(r.numbers);
      } catch {
        setParsedNumbers([]);
      } finally {
        setParsing(false);
      }
    }, 350);
    return () => window.clearTimeout(handler);
  }, [manualText, mode]);

  // CSV file → parse on backend
  const onCsvChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCsvFile(f);
    setParsing(true);
    try {
      const r = await bulkSmsApi.parseNumbersFile(f);
      setParsedFromFile(r.numbers);
    } catch {
      setParsedFromFile([]);
    } finally {
      setParsing(false);
    }
  };

  const groupContactCount =
    groups.find((g) => g.id === groupId)?.contacts_count || 0;

  const recipientCount = useMemo(() => {
    if (mode === "manual") return parsedNumbers.filter((n) => n.valid).length;
    if (mode === "csv") return parsedFromFile.filter((n) => n.valid).length;
    if (mode === "group") return groupContactCount;
    return 0;
  }, [mode, parsedNumbers, parsedFromFile, groupContactCount]);

  const invalidCount = useMemo(() => {
    if (mode === "manual") return parsedNumbers.filter((n) => !n.valid).length;
    if (mode === "csv") return parsedFromFile.filter((n) => !n.valid).length;
    return 0;
  }, [mode, parsedNumbers, parsedFromFile]);

  const smsCount = useMemo(() => {
    const len = message.length;
    if (len === 0) return 0;
    return Math.ceil(len / 160);
  }, [message]);

  const canSend = recipientCount > 0 && message.trim().length > 0 && !sending;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const body: Parameters<typeof bulkSmsApi.campaignCreate>[0] = {
        title: title.trim() || undefined,
        message: message.trim(),
      };
      if (mode === "manual") {
        body.phones = parsedNumbers.filter((n) => n.valid).map((n) => n.normalized);
      } else if (mode === "group" && groupId) {
        body.group_id = groupId;
      } else if (mode === "csv") {
        body.phones = parsedFromFile.filter((n) => n.valid).map((n) => n.normalized);
      }
      const r = await bulkSmsApi.campaignCreate(body);
      setResult({
        sent: r.campaign.sent_count,
        failed: r.campaign.failed_count,
        total: r.campaign.total,
        failedSample: r.failed_sample || [],
      });
      // Form clear (partial)
      setManualText("");
      setParsedNumbers([]);
      setCsvFile(null);
      setParsedFromFile([]);
      setMessage("");
      setTitle("");
      // Refresh list
      onSent();
    } catch (e) {
      setError((e as { message?: string }).message || "Xato yuz berdi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_360px] gap-5">
      <form onSubmit={submit} className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-text-primary">
              Yangi bulk SMS yuborish
            </h3>
            <p className="text-[12px] text-text-secondary">
              Raqamlarni tanlang, matnni yozing va yuboring. Har bir raqamga
              alohida yuboriladi va natija jurnalga yoziladi.
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { v: "manual" as Mode, label: "Qo'lda kiritish", icon: Phone },
            { v: "group" as Mode, label: "Guruhdan", icon: Layers },
            { v: "csv" as Mode, label: "CSV / XLSX", icon: FileText },
          ].map((m) => {
            const active = mode === m.v;
            return (
              <button
                key={m.v}
                type="button"
                onClick={() => setMode(m.v)}
                className={
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[12.5px] font-medium transition " +
                  (active
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-bg-input text-text-secondary hover:text-text-primary")
                }
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Mode-specific input */}
        {mode === "manual" && (
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Telefon raqamlar
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder={
                "+998 90 123 45 67\n+998 91 234 56 78\n998 93 345 67 89"
              }
              rows={6}
              className="w-full resize-none rounded-lg border border-line bg-bg-input px-3 py-2 font-mono text-[13px] text-text-primary outline-none focus:border-brand"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Har qatordan bittadan, yoki probel/vergul bilan ajratib yozish
              mumkin. Yangi qatorni bossangiz avto-parse qilinadi.
            </p>
          </div>
        )}

        {mode === "group" && (
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Kontakt guruh
            </label>
            <select
              value={groupId ?? ""}
              onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
            >
              <option value="">— guruhni tanlang —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.contacts_count || 0} ta kontakt)
                </option>
              ))}
            </select>
            {groups.length === 0 && (
              <p className="mt-1 text-[11px] text-text-muted">
                Hozircha guruhlar yo'q. "Guruhlar" tabidan yangi yarating.
              </p>
            )}
          </div>
        )}

        {mode === "csv" && (
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              CSV / XLSX fayl
            </label>
            <label
              htmlFor="csv-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-bg-input py-8 transition hover:border-brand hover:bg-brand/5"
            >
              <Upload className="mb-2 h-6 w-6 text-text-muted" />
              <div className="text-[13px] font-medium text-text-primary">
                {csvFile ? csvFile.name : "Faylni tanlang yoki shu yerga tashlang"}
              </div>
              <div className="mt-0.5 text-[11px] text-text-muted">
                CSV, TSV yoki Excel-CSV (UTF-8). Birinchi ustun yoki `phone`
                ustuni avtomatik aniqlanadi.
              </div>
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv,.tsv,.txt,.xlsx"
              onChange={onCsvChange}
              className="hidden"
            />
          </div>
        )}

        {/* Title (optional) */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
            Kampaniya nomi (ixtiyoriy)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Premium foydalanuvchilarga 50% chegirma"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
          />
        </div>

        {/* Message */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[12px] font-medium text-text-secondary">
              Xabar matni *
            </label>
            <span className="text-[10.5px] text-text-muted">
              {message.length} / 500 belgi · {smsCount} ta SMS
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder="Salom! Bizning yangi aksiyamizdan foydalaning..."
            rows={4}
            className="w-full resize-none rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
            required
          />
        </div>

        {/* Errors / results */}
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-status-blocked/10 px-3 py-2 text-[12.5px] font-medium text-status-blocked">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}
        {result && (
          <div className="mb-3 space-y-2 rounded-lg border border-status-resolved/30 bg-status-resolved/5 p-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-status-resolved">
              <CheckCircle2 className="h-4 w-4" />
              Yuborildi: {result.sent} / {result.total} muvaffaqiyatli
              {result.failed > 0 && (
                <span className="ml-2 text-status-blocked">
                  ({result.failed} xato)
                </span>
              )}
            </div>
            {result.failedSample.length > 0 && (
              <details className="text-[11.5px] text-text-secondary">
                <summary className="cursor-pointer hover:text-text-primary">
                  Xato raqamlar ({result.failedSample.length}{result.failed > result.failedSample.length ? "+" : ""}) — tafsilot
                </summary>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {result.failedSample.map((f, i) => (
                    <li key={i}>
                      {f.phone} → <span className="text-status-blocked">{f.reason}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSend}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Yuborilmoqda...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {recipientCount} ta raqamga yuborish
            </>
          )}
        </button>
      </form>

      {/* Preview / stats */}
      <aside className="card p-5">
        <div className="mb-4 flex items-center gap-2 text-[12.5px] font-semibold text-text-secondary">
          <Sparkles className="h-3.5 w-3.5" />
          Yuborish ko'rinishi
        </div>

        <div className="space-y-3">
          <PreviewStat
            label="Qabul qiluvchilar"
            value={recipientCount.toString()}
            suffix="ta yaroqli raqam"
            highlight={recipientCount > 0}
          />
          {invalidCount > 0 && (
            <PreviewStat
              label="Rad etilgan"
              value={invalidCount.toString()}
              suffix="ta noto'g'ri format"
              tone="warn"
            />
          )}
          <PreviewStat
            label="Xabar uzunligi"
            value={`${message.length} belgi`}
            suffix={`${smsCount} ta SMS / qabul qiluvchi`}
          />
          {parsing && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-input px-3 py-2 text-[11.5px] text-text-secondary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Raqamlar tahlil qilinmoqda...
            </div>
          )}
        </div>

        {(parsedNumbers.length > 0 || parsedFromFile.length > 0) && (
          <div className="mt-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Birinchi 10 ta raqam
            </div>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-line bg-bg-input p-2 font-mono text-[11.5px] scrollbar-thin">
              {(mode === "manual" ? parsedNumbers : parsedFromFile)
                .slice(0, 10)
                .map((n, i) => (
                  <div
                    key={i}
                    className={
                      "flex items-center justify-between py-0.5 " +
                      (n.valid ? "text-text-primary" : "text-text-muted line-through")
                    }
                  >
                    <span>{n.normalized}</span>
                    {n.valid ? (
                      <CheckCircle2 className="h-3 w-3 text-status-resolved" />
                    ) : (
                      <X className="h-3 w-3 text-status-blocked" />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  suffix,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
  tone?: "warn";
}) {
  return (
    <div className="rounded-lg border border-line bg-bg-input px-3 py-2">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div
        className={
          "mt-0.5 text-[16px] font-bold " +
          (tone === "warn"
            ? "text-status-progress"
            : highlight
              ? "text-brand"
              : "text-text-primary")
        }
      >
        {value}
      </div>
      {suffix && (
        <div className="text-[10.5px] text-text-muted">{suffix}</div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// History tab
// ----------------------------------------------------------------------------

function HistoryTab({
  campaigns,
  onOpen,
  onReload,
}: {
  campaigns: BulkSmsCampaign[];
  onOpen: (c: BulkSmsCampaign) => void;
  onReload: () => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="text-[13px] font-semibold text-text-primary">
          Yuborilgan kampaniyalar ({campaigns.length})
        </div>
        <button
          onClick={onReload}
          className="text-[12px] text-text-secondary hover:text-text-primary"
        >
          Yangilash
        </button>
      </div>
      {campaigns.length === 0 ? (
        <div className="px-4 py-12 text-center text-text-muted">
          <History className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <div className="text-[13px]">Hozircha hech qanday kampaniya yo'q</div>
        </div>
      ) : (
        <table className="min-w-full text-[13px]">
          <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-4 py-3 w-32">Vaqt</th>
              <th className="px-4 py-3">Nomi / matn</th>
              <th className="px-4 py-3 w-24">Manba</th>
              <th className="px-4 py-3 w-24">Holat</th>
              <th className="px-4 py-3 w-40">Natija</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const status = STATUS_META[c.status];
              const source = SOURCE_META[c.source];
              const successRate = c.total
                ? Math.round((c.sent_count / c.total) * 100)
                : 0;
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c)}
                  className="cursor-pointer border-b border-line/40 hover:bg-bg-hover/60"
                >
                  <td className="px-4 py-2.5 align-top font-mono text-[11px] text-text-muted">
                    {fmtTime(c.created_at)}
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <div className="font-medium text-text-primary">
                      {c.title || (c.message?.slice(0, 60) + (c.message.length > 60 ? "…" : ""))}
                    </div>
                    {c.title && (
                      <div className="mt-0.5 text-[11.5px] text-text-secondary line-clamp-1">
                        {c.message}
                      </div>
                    )}
                    {c.group_name && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-bg-input px-2 py-0.5 text-[10.5px] text-text-muted">
                        <Layers className="h-2.5 w-2.5" />
                        {c.group_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-text-secondary">
                      <span>{source.icon}</span>
                      {source.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
                        status.chip
                      }
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[14px] font-bold text-status-resolved">
                        {c.sent_count}
                      </span>
                      <span className="text-[11.5px] text-text-muted">/</span>
                      <span className="text-[12px] text-text-primary">{c.total}</span>
                      {c.failed_count > 0 && (
                        <span className="ml-2 text-[11.5px] text-status-blocked">
                          {c.failed_count} xato
                        </span>
                      )}
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bg-input">
                      <div
                        className={
                          "h-full " +
                          (successRate > 90
                            ? "bg-status-resolved"
                            : successRate > 50
                              ? "bg-status-progress"
                              : "bg-status-blocked")
                        }
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Campaign detail modal — per-recipient breakdown
// ----------------------------------------------------------------------------

function CampaignDetailModal({
  campaign,
  onClose,
}: {
  campaign: BulkSmsCampaign;
  onClose: () => void;
}) {
  const [full, setFull] = useState<BulkSmsCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "fail">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    bulkSmsApi
      .campaignDetail(campaign.id)
      .then((r) => {
        if (!cancelled) setFull(r);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [campaign.id]);

  const logs = full?.logs || [];
  const filtered = useMemo(() => {
    if (filter === "success") return logs.filter((l) => l.success);
    if (filter === "fail") return logs.filter((l) => !l.success);
    return logs;
  }, [logs, filter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-bg-panel shadow-panel">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold text-text-primary">
              Kampaniya #{campaign.id} {campaign.title && `— ${campaign.title}`}
            </h2>
            <p className="mt-0.5 text-[12px] text-text-secondary">
              {fmtTime(campaign.created_at)} ·{" "}
              {campaign.created_by_name || "system"} · {STATUS_META[campaign.status].label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b border-line px-5 py-4">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <StatChip label="Jami" value={campaign.total} />
            <StatChip
              label="Yetkazildi"
              value={campaign.sent_count}
              tone="success"
            />
            <StatChip
              label="Xato"
              value={campaign.failed_count}
              tone="error"
            />
          </div>
          <div className="rounded-lg border border-line bg-bg-input p-3 text-[13px] text-text-primary">
            {campaign.message}
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          {(["all", "success", "fail"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-lg px-3 py-1 text-[12px] font-medium " +
                (filter === f
                  ? "bg-brand text-white"
                  : "border border-line bg-bg-input text-text-secondary hover:text-text-primary")
              }
            >
              {f === "all" ? "Hammasi" : f === "success" ? "Yetkazildi" : "Xato"}
            </button>
          ))}
          <div className="ml-auto text-[11.5px] text-text-muted">
            {filtered.length} ta yozuv
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="px-4 py-12 text-center text-text-muted">
              Yuklanmoqda...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-text-muted">
              Yozuvlar yo'q
            </div>
          ) : (
            <table className="min-w-full text-[12.5px]">
              <thead className="sticky top-0 border-b border-line bg-bg-input text-left text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-2 w-12 text-center">#</th>
                  <th className="px-4 py-2 w-36">Telefon</th>
                  <th className="px-4 py-2 w-16 text-center">Holat</th>
                  <th className="px-4 py-2">Sabab</th>
                  <th className="px-4 py-2 w-16 text-center">Retry</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id} className="border-b border-line/30">
                    <td className="px-4 py-1.5 text-center text-[10.5px] text-text-muted">
                      {i + 1}
                    </td>
                    <td className="px-4 py-1.5 font-mono text-text-primary">
                      {l.phone}
                    </td>
                    <td className="px-4 py-1.5 text-center">
                      {l.success ? (
                        <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-status-resolved" />
                      ) : (
                        <X className="mx-auto h-3.5 w-3.5 text-status-blocked" />
                      )}
                    </td>
                    <td className="px-4 py-1.5 text-text-secondary">
                      {l.success ? "OK" : l.reason}
                      {l.result_code !== -1 && l.result_code !== 0 && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-bg-input px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                          <Hash className="h-2.5 w-2.5" />
                          {l.result_code}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-1.5 text-center text-text-secondary">
                      {l.retry_count > 0 ? l.retry_count : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "error";
}) {
  return (
    <div className="rounded-lg border border-line bg-bg-input px-3 py-2">
      <div className="text-[10.5px] uppercase text-text-muted">{label}</div>
      <div
        className={
          "mt-0.5 text-[18px] font-bold " +
          (tone === "success"
            ? "text-status-resolved"
            : tone === "error"
              ? "text-status-blocked"
              : "text-text-primary")
        }
      >
        {value}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Groups tab — kontakt guruhlarini boshqarish
// ----------------------------------------------------------------------------

function GroupsTab({
  groups,
  onChange,
}: {
  groups: SmsContactGroup[];
  onChange: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [openGroup, setOpenGroup] = useState<SmsContactGroup | null>(null);

  const createGroup = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await bulkSmsApi.groupCreate({
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setNewName("");
      setNewDesc("");
      onChange();
    } finally {
      setCreating(false);
    }
  };

  const removeGroup = async (id: number) => {
    if (!confirm("Guruh o'chirilsinmi? Ichidagi kontaktlar ham yo'qoladi.")) return;
    await bulkSmsApi.groupRemove(id);
    onChange();
  };

  return (
    <div className="grid grid-cols-[1fr_360px] gap-5">
      <div className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3 text-[13px] font-semibold text-text-primary">
          Kontakt guruhlar ({groups.length})
        </div>
        {groups.length === 0 ? (
          <div className="px-4 py-12 text-center text-text-muted">
            <Layers className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <div className="text-[13px]">Hozircha guruhlar yo'q</div>
          </div>
        ) : (
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Nomi</th>
                <th className="px-4 py-3 w-32">Kontaktlar</th>
                <th className="px-4 py-3 w-32">Yangilangan</th>
                <th className="px-4 py-3 w-20 text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b border-line/40 hover:bg-bg-hover/60">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setOpenGroup(g)}
                      className="text-left font-medium text-text-primary hover:text-brand"
                    >
                      {g.name}
                    </button>
                    {g.description && (
                      <div className="mt-0.5 text-[11.5px] text-text-secondary">
                        {g.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-bg-input px-2 py-0.5 text-[11.5px] text-text-secondary">
                      <UsersIcon className="h-3 w-3" />
                      {g.contacts_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-text-muted">
                    {fmtTime(g.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeGroup(g.id)}
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-status-blocked/15 hover:text-status-blocked"
                      title="O'chirish"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <aside className="card p-5">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-text-primary">
          <PlusCircle className="h-4 w-4 text-brand" />
          Yangi guruh
        </div>
        <div className="space-y-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Guruh nomi (masalan: STEM mijozlar)"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Eslatma (ixtiyoriy)"
            rows={2}
            className="w-full resize-none rounded-lg border border-line bg-bg-input px-3 py-2 text-[12.5px] text-text-primary outline-none focus:border-brand"
          />
          <button
            onClick={createGroup}
            disabled={!newName.trim() || creating}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-[12.5px] font-semibold text-white disabled:opacity-50 hover:bg-brand-hover"
          >
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PlusCircle className="h-3.5 w-3.5" />
            )}
            Guruh yaratish
          </button>
        </div>
      </aside>

      {openGroup && (
        <GroupDetailModal
          group={openGroup}
          onClose={() => {
            setOpenGroup(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Group detail modal — kontaktlarni boshqarish + CSV import
// ----------------------------------------------------------------------------

function GroupDetailModal({
  group,
  onClose,
}: {
  group: SmsContactGroup;
  onClose: () => void;
}) {
  const [contacts, setContacts] = useState<SmsContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPhone, setAddPhone] = useState("");
  const [addName, setAddName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [mode, setMode] = useState<"single" | "bulk" | "csv">("single");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await bulkSmsApi.contactList(group.id);
      setContacts(r.results || []);
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addSingle = async () => {
    if (!addPhone.trim()) return;
    setBusy(true);
    try {
      await bulkSmsApi.contactAdd(group.id, {
        phone: addPhone.trim(),
        name: addName.trim() || undefined,
      });
      setAddPhone("");
      setAddName("");
      void reload();
    } finally {
      setBusy(false);
    }
  };

  const addBulk = async () => {
    const lines = bulkText
      .split(/[\n,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setBusy(true);
    try {
      const r = await bulkSmsApi.contactAdd(group.id, {
        contacts: lines.map((p) => ({ phone: p })),
      });
      alert(`${r.added} ta qo'shildi, ${r.skipped} ta o'tkazib yuborildi (takror/noto'g'ri)`);
      setBulkText("");
      void reload();
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const r = await bulkSmsApi.groupImportCsv(group.id, f);
      alert(`${r.added} ta qo'shildi, ${r.skipped} ta o'tkazib yuborildi (${r.total_parsed} ta parse qilindi)`);
      void reload();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeContact = async (id: number) => {
    if (!confirm("Kontaktni o'chirasizmi?")) return;
    await bulkSmsApi.contactRemove(group.id, id);
    void reload();
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        c.phone_normalized.includes(q) ||
        c.name.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-bg-panel shadow-panel">
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <h2 className="text-[15px] font-bold text-text-primary">
              {group.name}
            </h2>
            <p className="mt-0.5 text-[12px] text-text-secondary">
              {contacts.length} ta kontakt
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
          {/* Add panel */}
          <aside className="border-r border-line p-4">
            <div className="mb-3 flex gap-1 rounded-lg bg-bg-input p-0.5">
              {(["single", "bulk", "csv"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={
                    "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition " +
                    (mode === m
                      ? "bg-brand text-white"
                      : "text-text-secondary hover:text-text-primary")
                  }
                >
                  {m === "single" ? "Bitta" : m === "bulk" ? "Ko'p" : "CSV"}
                </button>
              ))}
            </div>

            {mode === "single" && (
              <div className="space-y-2">
                <input
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="+998 ..."
                  className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-2 font-mono text-[12.5px] text-text-primary outline-none focus:border-brand"
                />
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Ism (ixtiyoriy)"
                  className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-2 text-[12.5px] text-text-primary outline-none focus:border-brand"
                />
                <button
                  onClick={addSingle}
                  disabled={!addPhone.trim() || busy}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-[12px] font-semibold text-white disabled:opacity-50 hover:bg-brand-hover"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Qo'shish
                </button>
              </div>
            )}

            {mode === "bulk" && (
              <div className="space-y-2">
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"+998 ...\n+998 ...\n+998 ..."}
                  rows={6}
                  className="w-full resize-none rounded-lg border border-line bg-bg-input px-2.5 py-2 font-mono text-[12px] text-text-primary outline-none focus:border-brand"
                />
                <button
                  onClick={addBulk}
                  disabled={!bulkText.trim() || busy}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-[12px] font-semibold text-white disabled:opacity-50 hover:bg-brand-hover"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Hammasini qo'shish
                </button>
              </div>
            )}

            {mode === "csv" && (
              <div className="space-y-2">
                <label
                  htmlFor="csv-import"
                  className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-line bg-bg-input py-6 text-center hover:border-brand hover:bg-brand/5"
                >
                  <Upload className="mb-1 h-5 w-5 text-text-muted" />
                  <div className="text-[12px] font-medium text-text-primary">
                    Faylni tanlang
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-text-muted">
                    CSV / TSV / Excel-CSV
                  </div>
                </label>
                <input
                  ref={fileRef}
                  id="csv-import"
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx"
                  onChange={importCsv}
                  className="hidden"
                />
              </div>
            )}
          </aside>

          {/* Contacts list */}
          <div className="flex flex-col overflow-hidden">
            <div className="border-b border-line px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Qidirish..."
                  className="w-full rounded-lg border border-line bg-bg-input pl-8 pr-3 py-1.5 text-[12.5px] text-text-primary outline-none focus:border-brand"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="px-4 py-12 text-center text-text-muted">
                  Yuklanmoqda...
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-12 text-center text-text-muted">
                  <UsersIcon className="mx-auto mb-2 h-6 w-6 opacity-40" />
                  <div className="text-[12.5px]">
                    {contacts.length === 0
                      ? "Kontakt yo'q — chap tomondan qo'shing"
                      : "Topilmadi"}
                  </div>
                </div>
              ) : (
                <table className="min-w-full text-[12.5px]">
                  <tbody>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-line/30 hover:bg-bg-hover/60"
                      >
                        <td className="px-4 py-2 font-mono text-text-primary">
                          {c.phone}
                        </td>
                        <td className="px-4 py-2 text-text-secondary">
                          {c.name || "—"}
                        </td>
                        <td className="px-4 py-2 w-12 text-right">
                          <button
                            onClick={() => removeContact(c.id)}
                            className="rounded p-1 text-text-muted hover:bg-status-blocked/15 hover:text-status-blocked"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
