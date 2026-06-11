import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Clock,
  X,
  Save,
  AlarmClock,
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  CalendarRange,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { MultilangInput, type LangValue } from "../components/MultilangInput";
import {
  notifRulesApi,
  type AdminNotifRule,
  type NotifTriggerType,
  type NotifAudience,
} from "../lib/resources";

const TRIGGER_LABELS: Record<NotifTriggerType, string> = {
  premium_expiry: "Premium tugashidan oldin",
  daily: "Har kuni",
  weekly: "Har hafta",
  monthly: "Har oy",
  one_off: "Bir martalik",
};

const TRIGGER_ICONS: Record<NotifTriggerType, typeof Clock> = {
  premium_expiry: AlarmClock,
  daily: CalendarDays,
  weekly: CalendarRange,
  monthly: CalendarClock,
  one_off: CalendarCheck,
};

const AUDIENCE_LABELS: Record<NotifAudience, string> = {
  all_parents: "Hamma ota-onalar",
  premium_active: "Premium aktiv",
  premium_expiring: "Premium tugashga yaqin",
  free_users: "Bepul foydalanuvchilar",
  no_active_child: "Bolasi ulanmagan",
};

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];

function fmtDateTime(iso?: string | null): string {
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

export function NotificationRulesPage() {
  const [rules, setRules] = useState<AdminNotifRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminNotifRule | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    notifRulesApi
      .list()
      .then((r) => setRules(r.results || []))
      .catch((e) => console.error("rules load", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = async (rule: AdminNotifRule) => {
    if (!confirm(`"${rule.name}" qoidasini o'chirasizmi?`)) return;
    try {
      await notifRulesApi.remove(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    }
  };

  const runNow = async (rule: AdminNotifRule) => {
    if (!confirm(`Endi "${rule.name}" ni darrov yuborishni xohlaysizmi?`)) return;
    try {
      const r = await notifRulesApi.runNow(rule.id);
      alert(
        `Yuborildi.\nQabul qiluvchilar: ${r.recipients_count}\nPush: ${r.push_sent}\nSMS: ${r.sms_sent}` +
          (r.success ? "" : `\n\nXato: ${r.detail}`),
      );
      reload();
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    }
  };

  const toggleActive = async (rule: AdminNotifRule) => {
    const next = !rule.is_active;
    try {
      await notifRulesApi.update(rule.id, { is_active: next });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: next } : r)),
      );
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    }
  };

  const emptyRule = (): AdminNotifRule => ({
    id: 0,
    name: "",
    trigger_type: "premium_expiry",
    trigger_params: { days_before: 3 },
    audience: "premium_active",
    audience_params: {},
    title: "",
    title_ru: "",
    title_en: "",
    body: "",
    body_ru: "",
    body_en: "",
    category: "premium",
    send_push: true,
    send_sms: false,
    is_active: true,
    last_run_at: null,
    next_run_at: null,
    created_at: "",
  });

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Bildirishnoma qoidalari"
        subtitle={`${rules.length} ta avtomatik reja`}
        actions={
          <button
            onClick={() => setEditing(emptyRule())}
            className="btn-primary text-[12.5px]"
          >
            <Plus className="h-4 w-4" /> Yangi qoida
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {loading && (
          <div className="card p-12 text-center text-text-muted">
            Yuklanmoqda...
          </div>
        )}
        {!loading && rules.length === 0 && (
          <div className="card p-12 text-center text-text-muted">
            <AlarmClock className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <div className="text-[14px] mb-1">Hozircha qoida yo'q</div>
            <div className="text-[12px]">
              Premium tugashidan oldin yoki kunlik eslatma uchun qoida qo'shing
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {rules.map((r) => {
            const Icon = TRIGGER_ICONS[r.trigger_type] || Clock;
            return (
              <div key={r.id} className="card p-4 group">
                <div className="flex items-start gap-3">
                  <div
                    className={
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                      (r.is_active
                        ? "bg-blue-500/15 text-blue-500"
                        : "bg-text-muted/15 text-text-muted")
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[14px] font-semibold text-text-primary truncate">
                        {r.name}
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.is_active}
                          onChange={() => toggleActive(r)}
                          className="h-4 w-4"
                        />
                        <span className="text-[11px] font-medium text-text-secondary">
                          Faol
                        </span>
                      </label>
                    </div>
                    <div className="mt-1 text-[12px] text-text-secondary">
                      {TRIGGER_LABELS[r.trigger_type]}
                      {triggerSummary(r)} → {AUDIENCE_LABELS[r.audience]}
                    </div>
                    <div className="mt-2 line-clamp-2 text-[12.5px] text-text-primary">
                      {r.title || "—"}
                    </div>
                    <div className="line-clamp-1 text-[11.5px] text-text-muted">
                      {r.body}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[10.5px] text-text-muted">
                      {r.send_push && (
                        <span className="inline-flex items-center gap-1">
                          🔔 Push
                        </span>
                      )}
                      {r.send_sms && (
                        <span className="inline-flex items-center gap-1">
                          💬 SMS
                        </span>
                      )}
                      <span>· Keyingi: {fmtDateTime(r.next_run_at)}</span>
                    </div>
                    {r.last_run_at && (
                      <div className="text-[10.5px] text-text-muted">
                        Oxirgi: {fmtDateTime(r.last_run_at)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => runNow(r)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg-input px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-bg-hover"
                    title="Darrov ishga tushirish"
                  >
                    <Play className="h-3 w-3" /> Hozir yuborish
                  </button>
                  <button
                    onClick={() => setEditing(r)}
                    className="icon-btn h-7 w-7"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <RuleEditor
          rule={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function triggerSummary(r: AdminNotifRule): string {
  const p = r.trigger_params || {};
  if (r.trigger_type === "premium_expiry") {
    return ` (${p.days_before ?? 3} kun oldin)`;
  }
  const h = String(p.hour ?? 9).padStart(2, "0");
  const m = String(p.minute ?? 0).padStart(2, "0");
  if (r.trigger_type === "daily") return ` (${h}:${m})`;
  if (r.trigger_type === "weekly") {
    const wd = WEEKDAYS[Number(p.weekday ?? 0)] || "Du";
    return ` (${wd}, ${h}:${m})`;
  }
  if (r.trigger_type === "monthly") {
    return ` (${p.day ?? 1}-kuni ${h}:${m})`;
  }
  if (r.trigger_type === "one_off") {
    return ` (${p.run_at || "—"})`;
  }
  return "";
}

function RuleEditor({
  rule,
  onClose,
  onSaved,
}: {
  rule: AdminNotifRule;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(rule);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tp = (draft.trigger_params || {}) as Record<string, unknown>;
  const ap = (draft.audience_params || {}) as Record<string, unknown>;

  const setTp = (patch: Record<string, unknown>) =>
    setDraft((d) => ({ ...d, trigger_params: { ...d.trigger_params, ...patch } }));
  const setAp = (patch: Record<string, unknown>) =>
    setDraft((d) => ({ ...d, audience_params: { ...d.audience_params, ...patch } }));

  const save = async () => {
    setError(null);
    if (!draft.name.trim() || !draft.title.trim() || !draft.body.trim()) {
      setError("Nom, sarlavha va matn majburiy");
      return;
    }
    setBusy(true);
    try {
      if (draft.id === 0) {
        await notifRulesApi.create(draft);
      } else {
        await notifRulesApi.update(draft.id, draft);
      }
      onSaved();
    } catch (e) {
      setError((e as { message?: string }).message || "Xato");
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
        className="bg-bg w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {draft.id === 0 ? "Yangi qoida" : "Qoidani tahrirlash"}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[12px] font-medium text-text-secondary mb-1.5">
              Nom (admin uchun yorliq)
            </div>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Premium tugashidan 3 kun oldin eslatma"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[12px] font-medium text-text-secondary mb-1.5">
                Trigger
              </div>
              <select
                value={draft.trigger_type}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    trigger_type: e.target.value as NotifTriggerType,
                  })
                }
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none"
              >
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[12px] font-medium text-text-secondary mb-1.5">
                Auditoriya
              </div>
              <select
                value={draft.audience}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    audience: e.target.value as NotifAudience,
                  })
                }
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none"
              >
                {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trigger params */}
          <div className="rounded-lg border border-line bg-bg-input/40 p-3">
            <div className="text-[11.5px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Trigger sozlamalari
            </div>
            {draft.trigger_type === "premium_expiry" && (
              <label className="flex items-center gap-3 text-[13px] text-text-secondary">
                Premium tugashidan
                <input
                  type="number"
                  value={Number(tp.days_before ?? 3)}
                  onChange={(e) => setTp({ days_before: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-center"
                />
                kun oldin
              </label>
            )}
            {draft.trigger_type === "daily" && (
              <TimePicker
                hour={Number(tp.hour ?? 9)}
                minute={Number(tp.minute ?? 0)}
                onChange={(h, m) => setTp({ hour: h, minute: m })}
              />
            )}
            {draft.trigger_type === "weekly" && (
              <div className="space-y-3">
                <div>
                  <div className="text-[12px] text-text-secondary mb-1">
                    Haftaning kuni
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((w, i) => (
                      <button
                        key={i}
                        onClick={() => setTp({ weekday: i })}
                        className={
                          "rounded-lg border px-2.5 py-1 text-[11.5px] font-medium " +
                          (Number(tp.weekday ?? 0) === i
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-line bg-bg-input text-text-secondary")
                        }
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <TimePicker
                  hour={Number(tp.hour ?? 9)}
                  minute={Number(tp.minute ?? 0)}
                  onChange={(h, m) => setTp({ hour: h, minute: m })}
                />
              </div>
            )}
            {draft.trigger_type === "monthly" && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[13px] text-text-secondary">
                  Oyning
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={Number(tp.day ?? 1)}
                    onChange={(e) => setTp({ day: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-center"
                  />
                  -kuni
                </label>
                <TimePicker
                  hour={Number(tp.hour ?? 9)}
                  minute={Number(tp.minute ?? 0)}
                  onChange={(h, m) => setTp({ hour: h, minute: m })}
                />
              </div>
            )}
            {draft.trigger_type === "one_off" && (
              <label className="flex items-center gap-3 text-[13px] text-text-secondary">
                Vaqti:
                <input
                  type="datetime-local"
                  value={String(tp.run_at || "").slice(0, 16)}
                  onChange={(e) => setTp({ run_at: e.target.value })}
                  className="rounded-lg border border-line bg-bg px-2 py-1"
                />
              </label>
            )}
          </div>

          {/* Audience params */}
          {draft.audience === "premium_expiring" && (
            <div className="rounded-lg border border-line bg-bg-input/40 p-3">
              <label className="flex items-center gap-3 text-[13px] text-text-secondary">
                Tugashga
                <input
                  type="number"
                  value={Number(ap.days ?? 7)}
                  onChange={(e) => setAp({ days: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-center"
                />
                kun qolgan parentlar
              </label>
            </div>
          )}

          {/* Title + body (multilingual) */}
          <MultilangInput
            label="Sarlavha"
            value={{
              uz: draft.title,
              uz_cyrl: (draft as { title_uz_cyrl?: string }).title_uz_cyrl || "",
              ru: draft.title_ru || "",
              en: draft.title_en || "",
            }}
            onChange={(v: LangValue) =>
              setDraft({
                ...draft,
                title: v.uz,
                title_ru: v.ru,
                title_en: v.en,
              })
            }
            placeholder="Hurmatli {name}, premium muddati tugayapti!"
          />
          <div className="text-[10.5px] text-text-muted -mt-2">
            O'zgaruvchilar: <code>{"{name}"}</code>, <code>{"{phone}"}</code>,{" "}
            <code>{"{days_left}"}</code>
          </div>
          <MultilangInput
            label="Matn"
            value={{
              uz: draft.body,
              uz_cyrl: (draft as { body_uz_cyrl?: string }).body_uz_cyrl || "",
              ru: draft.body_ru || "",
              en: draft.body_en || "",
            }}
            onChange={(v: LangValue) =>
              setDraft({
                ...draft,
                body: v.uz,
                body_ru: v.ru,
                body_en: v.en,
              })
            }
            placeholder="Premium {days_left} kun ichida tugaydi. Hozir uzaytirib qo'ying!"
            multiline
            rows={4}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[12px] font-medium text-text-secondary mb-1.5">
                Kategoriya
              </div>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none"
              >
                <option value="system">Tizim</option>
                <option value="premium">Premium</option>
                <option value="tip">Maslahat</option>
                <option value="order">Buyurtma</option>
                <option value="deal">Aksiya</option>
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-[12.5px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.send_push}
                  onChange={(e) =>
                    setDraft({ ...draft, send_push: e.target.checked })
                  }
                />
                Push
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.send_sms}
                  onChange={(e) =>
                    setDraft({ ...draft, send_sms: e.target.checked })
                  }
                />
                SMS
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) =>
                    setDraft({ ...draft, is_active: e.target.checked })
                  }
                />
                Faol
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[12.5px] text-red-500">
              {error}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            {draft.id !== 0 && (
              <>
                {draft.id && (
                  <>
                    {draft.is_active ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-status-resolved" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-text-muted" />
                    )}
                    {draft.is_active ? "Faol" : "Nofaol"}
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-[12.5px]">
              Bekor
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="btn-primary text-[12.5px] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />{" "}
              {busy ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimePicker({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-[13px] text-text-secondary">
      Vaqti:
      <input
        type="number"
        min={0}
        max={23}
        value={hour}
        onChange={(e) => onChange(Number(e.target.value), minute)}
        className="w-16 rounded-lg border border-line bg-bg px-2 py-1 text-center"
      />
      :
      <input
        type="number"
        min={0}
        max={59}
        value={minute}
        onChange={(e) => onChange(hour, Number(e.target.value))}
        className="w-16 rounded-lg border border-line bg-bg px-2 py-1 text-center"
      />
    </label>
  );
}
