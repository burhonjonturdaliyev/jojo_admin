import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Send,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  History,
  RotateCcw,
  Users as UsersIcon,
  UserCheck,
  Search,
  X,
  Phone,
  Languages,
  Zap,
  Loader2,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { MultilangInput, buildLangValue, type LangValue } from "../components/MultilangInput";
import { useT } from "../lib/i18n";
import {
  broadcastApi,
  smsApi,
  usersApi,
  type AdminBroadcastHistoryRow,
  type AdminUserRow,
  type BroadcastAudience,
} from "../lib/resources";

type Lang = "uz" | "ru" | "en";

const LANG_FLAGS: Record<Lang, string> = { uz: "🇺🇿", ru: "🇷🇺", en: "🇬🇧" };
const LANG_LABEL: Record<Lang, string> = { uz: "O'zbek", ru: "Русский", en: "English" };

const TITLE_PRESET = "Jojo";

type AudienceOption = {
  value: BroadcastAudience;
  label: string;
  hint: string;
};

const AUDIENCE_OPTIONS: AudienceOption[] = [
  { value: "all", label: "Hammaga", hint: "Faol va nofaol parentlar" },
  { value: "active", label: "Faollarga", hint: "Faqat is_active=true" },
  { value: "inactive", label: "Nofaollarga", hint: "Bloklangan/o'chirilgan" },
  { value: "premium", label: "Premiumlarga", hint: "Muddati o'tmagan premium" },
  { value: "non_premium", label: "Premiumsizlarga", hint: "Premium sotib olmaganlar" },
  { value: "selected", label: "Tanlanganlarga", hint: "Aniq odamlar ro'yxati" },
];

const AUDIENCE_LABEL: Record<BroadcastAudience, string> = Object.fromEntries(
  AUDIENCE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<BroadcastAudience, string>;

export function SmsPage() {
  const { t } = useT();

  // Form state
  const [body, setBody] = useState<LangValue>(buildLangValue());
  const [audience, setAudience] = useState<BroadcastAudience>("active");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<Lang>("uz");

  // Selected recipients
  const [selected, setSelected] = useState<Map<number, AdminUserRow>>(new Map());
  const [pickerOpen, setPickerOpen] = useState(false);

  // SMSFLY provider status
  const [smsStatus, setSmsStatus] = useState<{
    enabled: boolean;
    key_valid: boolean;
  } | null>(null);
  const [smsStatusLoading, setSmsStatusLoading] = useState(true);

  // History
  const [history, setHistory] = useState<AdminBroadcastHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyFilter, setHistoryFilter] =
    useState<"all" | BroadcastAudience>("all");

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    broadcastApi
      .history({ category: "system" })
      .then((r) =>
        setHistory((r.results || []).filter((x) => x.title === TITLE_PRESET)),
      )
      .catch((e) => console.error("sms history", e))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setSmsStatusLoading(true);
    smsApi
      .status()
      .then(setSmsStatus)
      .catch(() => setSmsStatus({ enabled: false, key_valid: false }))
      .finally(() => setSmsStatusLoading(false));
  }, []);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return history;
    // Eski yozuvlarda audience yo'q bo'lishi mumkin — ularni "active" ga
    // moslab ko'rsatamiz (eski default).
    return history.filter((h) => (h.audience || "active") === historyFilter);
  }, [history, historyFilter]);

  const charCount = body[previewLang]?.length || 0;
  const hasAnyBody = body.uz.trim() || body.ru.trim() || body.en.trim();
  const canSend =
    !!body.uz.trim() &&
    (audience !== "selected" || selected.size > 0) &&
    !sending;

  const send = async () => {
    setError(null);
    setResult(null);
    if (!body.uz.trim()) {
      setError("Asosiy (uz) matn majburiy");
      return;
    }
    if (audience === "selected" && selected.size === 0) {
      setError("Hech bo'lmasa bitta odam tanlang");
      return;
    }
    setSending(true);
    try {
      const r = await broadcastApi.send({
        title: TITLE_PRESET,
        body: body.uz.trim(),
        body_uz_cyrl: body.uz_cyrl.trim() || undefined,
        body_ru: body.ru.trim() || undefined,
        body_en: body.en.trim() || undefined,
        category: "system",
        send_sms: true,
        audience,
        parent_ids: audience === "selected" ? Array.from(selected.keys()) : undefined,
      });
      const smsLine = r.sms_sent ? ` · ${r.sms_sent} ta SMS` : "";
      setResult(`Yuborildi! ${r.sent_to} ta foydalanuvchi${smsLine}.`);
      setBody(buildLangValue());
      setSelected(new Map());
      setAudience("active");
      loadHistory();
    } catch (e) {
      const msg = (e as { message?: string }).message || "Xato yuz berdi";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const resend = (row: AdminBroadcastHistoryRow) => {
    setBody(buildLangValue(row.body, row.body_ru, row.body_en, row.body_uz_cyrl));
    setAudience(row.audience || "active");
    setSelected(new Map());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSelected = (u: AdminUserRow) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(u.id)) next.delete(u.id);
      else next.set(u.id, u);
      return next;
    });
  };

  const removeSelected = (id: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.sms")}
        subtitle="Push + SMS orqali parentlarga ko'p tilli xabarnoma"
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <SmsProviderBanner
          status={smsStatus}
          loading={smsStatusLoading}
        />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* COMPOSER */}
          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15 text-green-500">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold text-text-primary">
                  Yangi xabar
                </h3>
                <p className="text-[12px] text-text-secondary">
                  Parentning ilova tiliga qarab o'z tilida yetkaziladi
                </p>
              </div>
            </div>

            {/* AUDIENCE PICKER — 6 options as 2x3 grid */}
            <div className="mb-4">
              <div className="text-[11.5px] font-medium text-text-secondary mb-1.5">
                Kimga yuboriladi?
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {AUDIENCE_OPTIONS.map((opt) => {
                  const isSelected = audience === opt.value;
                  const isManualPicker = opt.value === "selected";
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAudience(opt.value)}
                      title={opt.hint}
                      className={
                        "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-all " +
                        (isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line bg-bg-input text-text-secondary hover:border-line/80 hover:bg-bg-input/80")
                      }
                    >
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                        {isManualPicker ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UsersIcon className="h-3.5 w-3.5" />
                        )}
                        {opt.label}
                        {isManualPicker && selected.size > 0 && (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                            {selected.size}
                          </span>
                        )}
                      </span>
                      <span className="text-[10.5px] text-text-muted leading-tight">
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {audience === "selected" && (
                <div className="mt-3 rounded-xl border border-dashed border-line p-3">
                  {selected.size === 0 ? (
                    <button
                      onClick={() => setPickerOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5 text-[12.5px] font-medium text-primary hover:bg-primary/10"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Foydalanuvchilarni tanlash
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11.5px] font-medium text-text-secondary">
                          {selected.size} ta tanlandi
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPickerOpen(true)}
                            className="text-[11.5px] font-semibold text-primary hover:underline"
                          >
                            + Qo'shish
                          </button>
                          <button
                            onClick={() => setSelected(new Map())}
                            className="text-[11.5px] font-medium text-text-muted hover:text-status-blocked"
                          >
                            Tozalash
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                        {Array.from(selected.values()).map((u) => (
                          <span
                            key={u.id}
                            className="inline-flex items-center gap-1 rounded-full bg-bg-input px-2 py-1 text-[11px] text-text-primary border border-line"
                          >
                            <span className="text-[10px]">
                              {LANG_FLAGS[(u.language as Lang) || "uz"] || "🇺🇿"}
                            </span>
                            <span className="max-w-[120px] truncate">
                              {u.full_name || u.first_name || u.phone}
                            </span>
                            <button
                              onClick={() => removeSelected(u.id)}
                              className="text-text-muted hover:text-status-blocked"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* MULTILANG BODY */}
            <MultilangInput
              value={body}
              onChange={setBody}
              label="Xabar matni"
              placeholder="Xabar matnini kiriting..."
              multiline
              rows={7}
              required
            />
            <div className="mt-1 flex items-center justify-between text-[10.5px] text-text-muted">
              <span className="inline-flex items-center gap-1">
                <Languages className="h-3 w-3" />
                Parent ilovasidagi tiliga qarab tanlanadi
              </span>
              <span>{charCount}/500</span>
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
              disabled={!canSend}
              className="btn-primary mt-4 w-full justify-center py-2.5 text-[13px] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending
                ? "Yuborilmoqda..."
                : audience === "selected"
                ? `${selected.size} odamga yuborish`
                : `${AUDIENCE_LABEL[audience]} yuborish`}
            </button>
          </div>

          {/* LIVE PREVIEW */}
          <div className="card p-4 h-fit">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-semibold text-text-primary">
                Ko'rinish
              </h4>
              <div className="flex gap-0.5">
                {(["uz", "ru", "en"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setPreviewLang(l)}
                    className={
                      "rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors " +
                      (previewLang === l
                        ? "bg-primary text-white"
                        : "bg-bg-input text-text-secondary")
                    }
                  >
                    {LANG_FLAGS[l]} {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-bg-input p-3">
              <div className="flex items-start gap-2 mb-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <MessageCircle className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-text-primary">
                    {TITLE_PRESET}
                  </div>
                  <div className="text-[10.5px] text-text-muted">
                    {LANG_LABEL[previewLang]} · Hozir
                  </div>
                </div>
              </div>
              <div className="text-[12.5px] text-text-primary whitespace-pre-wrap min-h-[80px]">
                {body[previewLang]?.trim() ||
                  (hasAnyBody ? (
                    <span className="text-text-muted italic">
                      {previewLang} tilida tarjima yo'q, asosiy uz ishlatiladi
                    </span>
                  ) : (
                    <span className="text-text-muted italic">
                      Matn kiritilmagan
                    </span>
                  ))}
              </div>
            </div>
            <div className="mt-3 text-[10.5px] text-text-muted leading-relaxed">
              SMS limiti: 500 belgi. Push xabarnoma cheksiz.
            </div>
          </div>
        </div>

        {/* HISTORY */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-text-muted" />
              <h3 className="text-[15px] font-semibold text-text-primary">
                Yuborilgan xabarlar
              </h3>
              <span className="text-[11.5px] text-text-muted">
                ({filteredHistory.length} ta)
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { v: "all" as const, l: "Barchasi" },
                  ...AUDIENCE_OPTIONS.map((o) => ({ v: o.value, l: o.label })),
                ]
              ).map((f) => (
                <button
                  key={f.v}
                  onClick={() => setHistoryFilter(f.v)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-[11.5px] font-medium transition-colors " +
                    (historyFilter === f.v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line bg-bg-input text-text-secondary hover:text-text-primary")
                  }
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            {historyLoading && (
              <div className="card p-8 text-center text-text-muted">
                Yuklanmoqda...
              </div>
            )}
            {!historyLoading && filteredHistory.length === 0 && (
              <div className="card p-12 text-center text-text-muted">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Xabarlar yo'q
              </div>
            )}
            {filteredHistory.map((row, i) => (
              <HistoryCard
                key={`${row.last_sent}-${i}`}
                row={row}
                onResend={() => resend(row)}
              />
            ))}
          </div>
        </div>
      </div>

      {pickerOpen && (
        <RecipientPicker
          selected={selected}
          onClose={() => setPickerOpen(false)}
          onToggle={toggleSelected}
          onClearAll={() => setSelected(new Map())}
        />
      )}
    </div>
  );
}

// ===========================================================================
// SMSFLY provider status + test
// ===========================================================================

function SmsProviderBanner({
  status,
  loading,
}: {
  status: { enabled: boolean; key_valid: boolean } | null;
  loading: boolean;
}) {
  const [phone, setPhone] = useState("");
  const [testMsg, setTestMsg] = useState("JoJo: test SMS");
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<{ ok: boolean; text: string } | null>(null);

  const healthy = !!status?.enabled && !!status?.key_valid;

  const sendTest = async () => {
    setResp(null);
    if (!phone.trim()) {
      setResp({ ok: false, text: "Telefon raqamini kiriting" });
      return;
    }
    setBusy(true);
    try {
      const r = await smsApi.test({ phone: phone.trim(), message: testMsg });
      setResp({
        ok: !!r.success,
        text: r.success
          ? `Jo'natildi: ${r.phone}`
          : "Provider muvaffaqiyatsiz qaytardi",
      });
    } catch (e) {
      setResp({
        ok: false,
        text: (e as { message?: string }).message || "Xato yuz berdi",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={
        "card p-4 mb-5 border-l-4 " +
        (loading
          ? "border-l-text-muted"
          : healthy
          ? "border-l-green-500"
          : "border-l-amber-500")
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
              (healthy
                ? "bg-green-500/15 text-green-500"
                : "bg-amber-500/15 text-amber-500")
            }
          >
            <Zap className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[13.5px] font-semibold text-text-primary">
                SMSFLY provider
              </h4>
              {loading ? (
                <span className="text-[11px] text-text-muted">tekshirilmoqda...</span>
              ) : healthy ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  ulangan · kalit haqiqiy
                </span>
              ) : status?.enabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-500">
                  <AlertCircle className="h-3 w-3" />
                  kalit noto'g'ri yoki muddati o'tgan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-500">
                  <AlertCircle className="h-3 w-3" />
                  ulanmagan (DEV rejim — SMS jo'natilmaydi)
                </span>
              )}
            </div>
            <p className="mt-1 text-[11.5px] text-text-secondary leading-relaxed">
              Hammaga / tanlanganlarga jo'natish faqat <b>parent</b> rolidagi
              foydalanuvchilarga ketadi. Admin sifatida o'zingiz qabul qilmaysiz —
              shu yerdan o'z telefoningizga test SMS jo'natib SMSFLY haqiqatan
              ham yetkazyaptimi tekshiring.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[180px]">
          <div className="text-[11px] font-medium text-text-secondary mb-1">
            Test telefon raqami
          </div>
          <div className="relative">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              className="w-full rounded-lg border border-line bg-bg-input pl-8 pr-3 py-2 text-[12.5px] outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="text-[11px] font-medium text-text-secondary mb-1">
            Matn
          </div>
          <input
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            placeholder="JoJo: test SMS"
            maxLength={160}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[12.5px] outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={sendTest}
          disabled={busy || loading}
          className="btn-primary py-2 text-[12.5px] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Test jo'natish
        </button>
      </div>

      {resp && (
        <div
          className={
            "mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium " +
            (resp.ok
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500")
          }
        >
          {resp.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" />
          )}
          {resp.text}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// History card
// ===========================================================================

function HistoryCard({
  row,
  onResend,
}: {
  row: AdminBroadcastHistoryRow;
  onResend: () => void;
}) {
  const [openLang, setOpenLang] = useState<Lang>("uz");
  const langs: Lang[] = ["uz", "ru", "en"];
  const bodyByLang: Record<Lang, string> = {
    uz: row.body,
    ru: row.body_ru || "",
    en: row.body_en || "",
  };
  const hasLang = (l: Lang) => bodyByLang[l].trim().length > 0;
  const audienceKey: BroadcastAudience = row.audience || "active";
  const audienceLabel = AUDIENCE_LABEL[audienceKey] || "Faollarga";

  return (
    <div className="card p-3.5 group">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-green-500">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold " +
                (audienceKey === "selected"
                  ? "bg-primary/15 text-primary"
                  : audienceKey === "premium"
                  ? "bg-amber-500/15 text-amber-600"
                  : audienceKey === "inactive"
                  ? "bg-text-muted/15 text-text-muted"
                  : "bg-blue-500/15 text-blue-500")
              }
            >
              {audienceKey === "selected" ? (
                <UserCheck className="h-3 w-3" />
              ) : (
                <UsersIcon className="h-3 w-3" />
              )}
              {audienceLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
              <UsersIcon className="h-3 w-3" />
              {row.count} qabul qildi
            </span>
            <span className="text-[11px] text-text-muted">
              {new Date(row.last_sent).toLocaleString("uz-UZ")}
            </span>
            {langs.filter(hasLang).length > 1 && (
              <span className="inline-flex items-center gap-0.5 text-[10.5px] text-text-muted">
                {langs.filter(hasLang).map((l) => (
                  <span key={l} title={LANG_LABEL[l]}>
                    {LANG_FLAGS[l]}
                  </span>
                ))}
              </span>
            )}
          </div>

          {/* Language tabs */}
          {langs.filter(hasLang).length > 1 && (
            <div className="flex gap-0.5 mb-1">
              {langs.filter(hasLang).map((l) => (
                <button
                  key={l}
                  onClick={() => setOpenLang(l)}
                  className={
                    "rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold " +
                    (openLang === l
                      ? "bg-primary text-white"
                      : "bg-bg-input text-text-secondary")
                  }
                >
                  {LANG_FLAGS[l]} {l.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          <div className="text-[12.5px] text-text-primary line-clamp-3 whitespace-pre-wrap">
            {bodyByLang[openLang] || row.body}
          </div>
        </div>
        <button
          onClick={onResend}
          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11.5px] font-medium text-primary hover:bg-primary/10 shrink-0"
        >
          <RotateCcw className="h-3 w-3" /> Qaytarish
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Recipient picker modal
// ===========================================================================

function RecipientPicker({
  selected,
  onClose,
  onToggle,
  onClearAll,
}: {
  selected: Map<number, AdminUserRow>;
  onClose: () => void;
  onToggle: (u: AdminUserRow) => void;
  onClearAll: () => void;
}) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [langFilter, setLangFilter] = useState<Lang | "all">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      usersApi
        .list({
          role: "parent",
          is_active: true,
          q: search.trim() || undefined,
          page_size: 200,
        })
        .then((r) => {
          if (!cancelled) setUsers(r.results || []);
        })
        .catch((e) => console.error("recipients load", e))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const visible = useMemo(() => {
    if (langFilter === "all") return users;
    return users.filter(
      (u) => ((u.language || "uz") as Lang) === langFilter,
    );
  }, [users, langFilter]);

  const selectAllVisible = () => {
    visible.forEach((u) => {
      if (!selected.has(u.id)) onToggle(u);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-xl rounded-2xl p-5 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-semibold text-text-primary">
            Qabul qiluvchilarni tanlash
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, telefon yoki @username..."
            className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex gap-1">
            <button
              onClick={() => setLangFilter("all")}
              className={
                "rounded-lg border px-2.5 py-1 text-[11px] font-medium " +
                (langFilter === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line bg-bg-input text-text-secondary")
              }
            >
              Barchasi
            </button>
            {(["uz", "ru", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLangFilter(l)}
                className={
                  "rounded-lg border px-2.5 py-1 text-[11px] font-medium " +
                  (langFilter === l
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-bg-input text-text-secondary")
                }
              >
                {LANG_FLAGS[l]} {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllVisible}
              disabled={visible.length === 0}
              className="text-[11.5px] font-semibold text-primary hover:underline disabled:opacity-40"
            >
              Hammasini belgilash
            </button>
            <button
              onClick={onClearAll}
              disabled={selected.size === 0}
              className="text-[11.5px] font-medium text-text-muted hover:text-status-blocked disabled:opacity-40"
            >
              Tozalash ({selected.size})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin -mx-5 px-5">
          {loading ? (
            <div className="py-12 text-center text-text-muted text-[12.5px]">
              Yuklanmoqda...
            </div>
          ) : visible.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-[12.5px]">
              Foydalanuvchi topilmadi
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((u) => {
                const isSel = selected.has(u.id);
                return (
                  <li key={u.id}>
                    <button
                      onClick={() => onToggle(u)}
                      className={
                        "w-full flex items-center gap-3 py-2 px-1 text-left rounded-lg transition-colors " +
                        (isSel ? "bg-primary/5" : "hover:bg-bg-input")
                      }
                    >
                      <div
                        className={
                          "flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 transition-colors " +
                          (isSel
                            ? "border-primary bg-primary"
                            : "border-line bg-bg-input")
                        }
                      >
                        {isSel && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12.5px] font-medium text-text-primary truncate">
                            {u.full_name || u.first_name || "—"}
                          </span>
                          <span className="text-[10.5px]">
                            {LANG_FLAGS[(u.language as Lang) || "uz"] || "🇺🇿"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-text-muted">
                          {u.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {u.phone}
                            </span>
                          )}
                          {u.is_premium && (
                            <span className="text-amber-500">Premium</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-line">
          <div className="text-[11.5px] text-text-muted">
            {selected.size} ta tanlandi
          </div>
          <button
            onClick={onClose}
            className="btn-primary text-[12.5px] px-4"
          >
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}
