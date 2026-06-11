/**
 * SMS yuborish jurnali — har bir urinish (OTP / broadcast / rule / test).
 *
 * Maqsad: operator "filan raqamga SMS yetib bordimi?" deb savol bersa,
 * DB orqali aniq javob berish. Backend `SmsSendLog` modelidan o'qiymiz.
 *
 * Filtrlar:
 *   kind     — qaysi turdagi SMS (OTP/broadcast/...)
 *   success  — faqat muvaffaqiyatli yoki faqat xatolar
 *   phone    — substring search (raqamlar bo'yicha)
 */
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  Hash,
  Filter,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  smsApi,
  type SmsKind,
  type SmsSendLogRow,
  type SmsLogStats,
} from "../lib/resources";

const KIND_META: Record<SmsKind, { label: string; color: string }> = {
  otp: { label: "OTP", color: "bg-blue-500/15 text-blue-500" },
  broadcast: { label: "Broadcast", color: "bg-purple-500/15 text-purple-500" },
  rule: { label: "Notif rule", color: "bg-emerald-500/15 text-emerald-500" },
  test: { label: "Test", color: "bg-amber-500/15 text-amber-500" },
  other: { label: "Boshqa", color: "bg-text-muted/15 text-text-muted" },
};

const REASON_FRIENDLY: Record<string, string> = {
  OK: "Yetkazildi",
  INVALID_PHONE: "Noto'g'ri raqam formati",
  SESSION_NOT_BOUND: "SMSFLY sessiya yo'qoldi (avto-retry ham yordam bermadi)",
  NETWORK: "Tarmoq xatosi",
  TIMEOUT: "SMSFLY javob bermadi (timeout)",
  DEV_MODE: "Dev rejim — SMS yuborilmadi",
  KEY_INVALID: "SMSFLY kalit noto'g'ri",
};

function friendlyReason(reason: string): string {
  return REASON_FRIENDLY[reason] || reason || "—";
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function SmsLogPage() {
  const [rows, setRows] = useState<SmsSendLogRow[]>([]);
  const [stats, setStats] = useState<SmsLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [pageSize] = useState(50);

  const [kindFilter, setKindFilter] = useState<SmsKind | "">("");
  const [successFilter, setSuccessFilter] = useState<"" | "true" | "false">("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const r = await smsApi.log({
        kind: kindFilter || undefined,
        success: successFilter === "" ? undefined : successFilter === "true",
        phone: phoneFilter || undefined,
        page_size: pageSize,
        offset,
      });
      setRows(r.results);
      setStats(r.stats);
      setCount(r.count);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindFilter, successFilter, phoneFilter, offset]);

  const submitPhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setPhoneFilter(searchInput.trim());
  };

  const resetFilters = () => {
    setKindFilter("");
    setSuccessFilter("");
    setSearchInput("");
    setPhoneFilter("");
    setOffset(0);
  };

  const failureRate = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.failed / stats.total) * 100);
  }, [stats]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="SMS jurnali"
        subtitle={
          stats
            ? `${stats.total} ta urinish · ${stats.sent} yetkazildi · ${stats.failed} xato (${failureRate}%)`
            : "Yuklanmoqda..."
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {/* Stats cards */}
        {stats && (
          <div className="mb-4 grid grid-cols-4 gap-3">
            <StatCard
              label="Jami urinishlar"
              value={stats.total.toLocaleString()}
              tone="default"
            />
            <StatCard
              label="Yetkazilgan"
              value={stats.sent.toLocaleString()}
              tone="success"
            />
            <StatCard
              label="Xato"
              value={stats.failed.toLocaleString()}
              tone="error"
            />
            <StatCard
              label="Failure rate"
              value={`${failureRate}%`}
              tone={failureRate > 20 ? "error" : failureRate > 5 ? "warn" : "success"}
            />
          </div>
        )}

        {/* Top failure reasons */}
        {stats && stats.top_failure_reasons.length > 0 && (
          <div className="mb-4 card p-4">
            <div className="mb-2 flex items-center gap-2 text-[12.5px] font-semibold text-text-secondary">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Eng tez-tez uchraydigan xato sabablari
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.top_failure_reasons.map((r) => (
                <span
                  key={r.reason}
                  className="inline-flex items-center gap-1 rounded-full bg-bg-input px-2.5 py-1 text-[11.5px] text-text-secondary"
                >
                  <span className="font-mono text-[10.5px] text-text-muted">
                    {r.reason || "—"}
                  </span>
                  <span className="font-semibold text-text-primary">{r.c}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={submitPhoneSearch} className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Raqam bo'yicha qidirish... (Enter)"
                className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
              />
            </form>
            <select
              value={kindFilter}
              onChange={(e) => {
                setOffset(0);
                setKindFilter(e.target.value as SmsKind | "");
              }}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
            >
              <option value="">Hamma turlari</option>
              {Object.entries(KIND_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              value={successFilter}
              onChange={(e) => {
                setOffset(0);
                setSuccessFilter(e.target.value as "" | "true" | "false");
              }}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand"
            >
              <option value="">Hammasi</option>
              <option value="true">Faqat yetkazilgan</option>
              <option value="false">Faqat xato</option>
            </select>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-input px-3 py-2 text-[12.5px] font-medium text-text-secondary hover:text-text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Tozalash
            </button>
          </div>
          {(kindFilter || successFilter || phoneFilter) && (
            <div className="mt-3 flex items-center gap-2 text-[11.5px] text-text-muted">
              <Filter className="h-3 w-3" />
              <span>
                Filtr faol:{" "}
                {[
                  kindFilter && `kind=${kindFilter}`,
                  successFilter && `status=${successFilter === "true" ? "OK" : "FAIL"}`,
                  phoneFilter && `phone~${phoneFilter}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading && (
            <div className="px-4 py-8 text-center text-text-muted">
              Yuklanmoqda...
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="px-4 py-12 text-center text-text-muted">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <div className="text-[13px]">Yozuvlar topilmadi</div>
            </div>
          )}
          {!loading && rows.length > 0 && (
            <table className="min-w-full text-[13px]">
              <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3 w-32">Vaqt</th>
                  <th className="px-4 py-3 w-16 text-center">Holat</th>
                  <th className="px-4 py-3 w-36">Telefon</th>
                  <th className="px-4 py-3 w-24">Turi</th>
                  <th className="px-4 py-3">Xabar / sabab</th>
                  <th className="px-4 py-3 w-20 text-center">Retry</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-line/40 hover:bg-bg-hover/60"
                  >
                    <td className="px-4 py-2.5 align-top font-mono text-[11px] text-text-muted">
                      {fmtTime(r.created_at)}
                    </td>
                    <td className="px-4 py-2.5 align-top text-center">
                      {r.success ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-status-resolved" />
                      ) : (
                        <XCircle className="mx-auto h-4 w-4 text-status-blocked" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-top font-mono text-[12px] text-text-primary">
                      {r.phone}
                      {r.phone_normalized !== r.phone && (
                        <div className="text-[10px] text-text-muted">
                          → {r.phone_normalized}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
                          (KIND_META[r.kind]?.color || "bg-bg-input text-text-secondary")
                        }
                      >
                        {KIND_META[r.kind]?.label || r.kind}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-top text-[12px] text-text-secondary">
                      {r.success ? (
                        <span className="line-clamp-2">{r.message || "—"}</span>
                      ) : (
                        <div>
                          <span className="font-medium text-status-blocked">
                            {friendlyReason(r.reason)}
                          </span>
                          {r.result_code !== -1 && (
                            <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-bg-input px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                              <Hash className="h-2.5 w-2.5" />
                              {r.result_code}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-top text-center text-[12px] text-text-secondary">
                      {r.retry_count > 0 ? r.retry_count : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && count > pageSize && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <div className="text-[12px] text-text-secondary">
                {offset + 1}–{Math.min(offset + pageSize, count)} / {count}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - pageSize))}
                  disabled={offset === 0}
                  className="rounded-lg border border-line bg-bg-input px-3 py-1.5 text-[12px] text-text-secondary disabled:opacity-40 hover:text-text-primary"
                >
                  ← Oldingi
                </button>
                <button
                  onClick={() => setOffset(offset + pageSize)}
                  disabled={offset + pageSize >= count}
                  className="rounded-lg border border-line bg-bg-input px-3 py-1.5 text-[12px] text-text-secondary disabled:opacity-40 hover:text-text-primary"
                >
                  Keyingi →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "success" | "warn" | "error";
}) {
  const colors = {
    default: "text-text-primary",
    success: "text-status-resolved",
    warn: "text-status-progress",
    error: "text-status-blocked",
  };
  return (
    <div className="card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className={"mt-1 text-[22px] font-bold " + colors[tone]}>{value}</div>
    </div>
  );
}
