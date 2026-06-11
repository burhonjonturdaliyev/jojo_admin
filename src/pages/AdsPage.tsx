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
import { MultilangInput, type LangValue } from "../components/MultilangInput";
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
  const [titleL, setTitleL] = useState<LangValue>({ uz: "", uz_cyrl: "", ru: "", en: "" });
  const [bodyL, setBodyL] = useState<LangValue>({ uz: "", uz_cyrl: "", ru: "", en: "" });
  const [category, setCategory] = useState<"system" | "tip" | "premium">(
    "system",
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withSms, setWithSms] = useState(false);
  const title = titleL.uz;
  const body = bodyL.uz;

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
    setTitleL({ uz: row.title, uz_cyrl: "", ru: "", en: "" });
    setBodyL({ uz: row.body, uz_cyrl: "", ru: "", en: "" });
    setCategory(row.category as "system" | "tip" | "premium");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const send = async () => {
    setError(null);
    setResult(null);
    if (!titleL.uz.trim() || !bodyL.uz.trim()) {
      setError("O'zbek tilidagi sarlavha va matn majburiy");
      return;
    }
    setSending(true);
    try {
      const r = await broadcastApi.send({
        title: titleL.uz.trim(),
        body: bodyL.uz.trim(),
        title_uz_cyrl: titleL.uz_cyrl.trim() || undefined,
        title_ru: titleL.ru.trim() || undefined,
        title_en: titleL.en.trim() || undefined,
        body_uz_cyrl: bodyL.uz_cyrl.trim() || undefined,
        body_ru: bodyL.ru.trim() || undefined,
        body_en: bodyL.en.trim() || undefined,
        category,
        send_sms: withSms,
      });
      const smsLine = r.sms_sent ? ` + ${r.sms_sent} ta SMS` : "";
      setResult(`${r.sent_to} ta ota-onaga yetkazildi${smsLine}`);
      setTitleL({ uz: "", uz_cyrl: "", ru: "", en: "" });
      setBodyL({ uz: "", uz_cyrl: "", ru: "", en: "" });
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
              <MultilangInput
                label="Sarlavha"
                value={titleL}
                onChange={setTitleL}
                placeholder="Masalan: Yangi maslahatlar qo'shildi"
              />
              <MultilangInput
                label="Matn"
                value={bodyL}
                onChange={setBodyL}
                placeholder="Elon matnini kiriting..."
                multiline
                rows={6}
              />

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

              <label
                className={
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors " +
                  (withSms
                    ? "border-blue-500/40 bg-blue-500/5"
                    : "border-line bg-bg-input hover:border-blue-500/20")
                }
              >
                <input
                  type="checkbox"
                  checked={withSms}
                  onChange={(e) => setWithSms(e.target.checked)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold text-text-primary">
                    SMS bilan dublikat yuborish
                  </div>
                  <div className="text-[11px] text-text-muted">
                    SMSFLY orqali ham bittadan SMS yuboriladi
                  </div>
                </div>
              </label>

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
