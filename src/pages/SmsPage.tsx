import { useState } from "react";
import { Send, MessageCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import { broadcastApi } from "../lib/resources";

/**
 * SMS — joriy backend SMS provider'siz, lekin push notification orqali
 * barcha foydalanuvchilarga matn yuborish mumkin. Bu page xuddi
 * AdsPage.broadcast'iga o'xshaydi, lekin alohida brending bilan.
 */
export function SmsPage() {
  const { t } = useT();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    setResult(null);
    if (!body.trim()) {
      setError("Matn majburiy");
      return;
    }
    setSending(true);
    try {
      const r = await broadcastApi.send({
        title: "Jojo",
        body: body.trim(),
        category: "system",
      });
      setResult(`Yuborildi! ${r.sent_to} ta foydalanuvchiga yetkazildi.`);
      setBody("");
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
        title={t("nav.sms")}
        subtitle="Barcha foydalanuvchilarga matnli xabar yuborish"
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card p-6 max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15 text-green-500">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-text-primary">
                Yangi xabar
              </h3>
              <p className="text-[12px] text-text-secondary">
                Hozircha push notification orqali yuboriladi. SMS-provider
                ulanmagan.
              </p>
            </div>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Xabar matnini kiriting..."
            maxLength={500}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] text-text-primary outline-none focus:border-primary"
          />
          <div className="mt-1 text-right text-[10.5px] text-text-muted">
            {body.length}/500
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-[12.5px] font-medium text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {result && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-[12.5px] font-medium text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              {result}
            </div>
          )}

          <button
            onClick={send}
            disabled={sending}
            className="btn-primary mt-4 w-full justify-center py-2.5 text-[13px] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sending ? "Yuborilmoqda..." : "Hammaga yuborish"}
          </button>
        </div>
      </div>
    </div>
  );
}
