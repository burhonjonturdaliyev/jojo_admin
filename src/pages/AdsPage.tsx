import { useCallback, useEffect, useState } from "react";
import {
  Megaphone,
  Send,
  CheckCircle2,
  AlertCircle,
  History,
  RotateCcw,
  Users as UsersIcon,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import {
  broadcastApi,
  type AdminBroadcastHistoryRow,
} from "../lib/resources";

/**
 * Elon (Announcement) — barcha parentlarga umumiy push xabari yuborish.
 * Backend `/api/admin/broadcast/` har bir aktiv parentga inbox yozuvi
 * yaratadi (record_parent_notification) + WS event + FCM push.
 */
export function AdsPage() {
  const { t } = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"system" | "tip" | "premium">(
    "system",
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<AdminBroadcastHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    broadcastApi
      .history()
      .then((r) => setHistory(r.results || []))
      .catch((e) => console.error("history", e))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const resend = (row: AdminBroadcastHistoryRow) => {
    setTitle(row.title);
    setBody(row.body);
    setCategory(row.category as "system" | "tip" | "premium");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const send = async () => {
    setError(null);
    setResult(null);
    if (!title.trim() || !body.trim()) {
      setError("Sarlavha va matn majburiy");
      return;
    }
    setSending(true);
    try {
      const r = await broadcastApi.send({
        title: title.trim(),
        body: body.trim(),
        category,
      });
      setResult(`${r.sent_to} ta ota-onaga yetkazildi`);
      setTitle("");
      setBody("");
      loadHistory();
    } catch (e) {
      const msg = (e as { message?: string }).message || "Xato yuz berdi";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.ads")}
        subtitle="Hamma parentlarga umumiy push xabari yuborish"
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-[1fr_320px] gap-5">
          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  Yangi elon yaratish
                </h3>
                <p className="text-[12px] text-text-secondary">
                  Yuborilgan zahoti barcha parent dasturlariga FCM va inbox
                  orqali yetkaziladi
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Sarlavha
                </label>
                <input
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] text-text-primary outline-none focus:border-primary"
                  placeholder="Masalan: Yangi maslahatlar qo'shildi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                />
                <div className="mt-1 text-right text-[10.5px] text-text-muted">
                  {title.length}/150
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Matn
                </label>
                <textarea
                  className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] text-text-primary outline-none focus:border-primary"
                  rows={6}
                  placeholder="Elon matnini kiriting..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={500}
                />
                <div className="mt-1 text-right text-[10.5px] text-text-muted">
                  {body.length}/500
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Kategoriya
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "system", label: "Tizim" },
                    { value: "tip", label: "Maslahat" },
                    { value: "premium", label: "Premium" },
                  ].map((c) => (
                    <button
                      key={c.value}
                      onClick={() =>
                        setCategory(c.value as "system" | "tip" | "premium")
                      }
                      className={
                        "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all " +
                        (category === c.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line bg-bg-input text-text-secondary hover:text-text-primary")
                      }
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-[12.5px] font-medium text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {result && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-[12.5px] font-medium text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {result}
                </div>
              )}

              <button
                onClick={send}
                disabled={sending}
                className="btn-primary w-full justify-center py-2.5 text-[13px] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Yuborilmoqda..." : "Hammaga yuborish"}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="card p-5">
            <h3 className="mb-3 text-[13px] font-semibold text-text-primary">
              Ko'rinish
            </h3>
            <div className="rounded-2xl border border-line bg-bg-input p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-text-primary">
                    {title || "Sarlavha shu yerda ko'rinadi"}
                  </div>
                  <div className="mt-1 line-clamp-3 text-[12px] text-text-secondary">
                    {body || "Matn shu yerda ko'rinadi..."}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11.5px] text-text-muted">
              Push notif + inbox yozuvi + WS event hammasi bir vaqtda
              yuboriladi.
            </div>
          </div>
        </div>

        {/* Yuborilgan elonlar tarixi */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-text-muted" />
            <h3 className="text-[15px] font-semibold text-text-primary">
              Yuborilgan elonlar
            </h3>
            <span className="text-[11.5px] text-text-muted">
              ({history.length} ta unikal)
            </span>
          </div>
          <div className="grid gap-2">
            {historyLoading && (
              <div className="card p-8 text-center text-text-muted">
                Yuklanmoqda...
              </div>
            )}
            {!historyLoading && history.length === 0 && (
              <div className="card p-12 text-center text-text-muted">
                <Megaphone className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Hozircha elon yuborilmagan
              </div>
            )}
            {history.map((row, i) => (
              <div key={i} className="card p-4 group">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[13.5px] font-semibold text-text-primary truncate">
                        {row.title}
                      </div>
                      <span className="rounded-full bg-text-muted/15 px-2 py-0.5 text-[10px] font-medium text-text-muted shrink-0">
                        {row.category}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-text-secondary line-clamp-2">
                      {row.body}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {row.count} qabul qildi
                      </span>
                      <span>
                        Oxirgi: {new Date(row.last_sent).toLocaleString("uz-UZ")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => resend(row)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11.5px] font-medium text-primary hover:bg-primary/10 shrink-0"
                    title="Bu xabarni formaga ko'chirib qaytadan yuborish"
                  >
                    <RotateCcw className="h-3 w-3" /> Qaytarish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
