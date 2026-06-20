import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useT } from "../lib/i18n";
import {
  notifRulesApi,
  type AdminNotifRule,
  type NotifTriggerType,
  type NotifAudience,
} from "../lib/resources";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

const getTriggerLabels = (t: TFn): Record<NotifTriggerType, string> => ({
  premium_expiry: t("notifRules.trigger.premiumExpiry"),
  daily: t("notifRules.trigger.daily"),
  weekly: t("notifRules.trigger.weekly"),
  monthly: t("notifRules.trigger.monthly"),
  one_off: t("notifRules.trigger.oneOff"),
});

const TRIGGER_ICONS: Record<NotifTriggerType, typeof Clock> = {
  premium_expiry: AlarmClock,
  daily: CalendarDays,
  weekly: CalendarRange,
  monthly: CalendarClock,
  one_off: CalendarCheck,
};

const getAudienceLabels = (t: TFn): Record<NotifAudience, string> => ({
  all_parents: t("notifRules.audience.allParents"),
  premium_active: t("notifRules.audience.premiumActive"),
  premium_expiring: t("notifRules.audience.premiumExpiring"),
  free_users: t("notifRules.audience.freeUsers"),
  no_active_child: t("notifRules.audience.noActiveChild"),
});

const getWeekdays = (t: TFn): string[] => [
  t("notifRules.weekday.mon"),
  t("notifRules.weekday.tue"),
  t("notifRules.weekday.wed"),
  t("notifRules.weekday.thu"),
  t("notifRules.weekday.fri"),
  t("notifRules.weekday.sat"),
  t("notifRules.weekday.sun"),
];

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
  const { t } = useT();
  const [rules, setRules] = useState<AdminNotifRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminNotifRule | null>(null);

  const triggerLabels = useMemo(() => getTriggerLabels(t), [t]);
  const audienceLabels = useMemo(() => getAudienceLabels(t), [t]);
  const weekdays = useMemo(() => getWeekdays(t), [t]);

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
    if (!confirm(t("notifRules.confirmDelete", { name: rule.name }))) return;
    try {
      await notifRulesApi.remove(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
    }
  };

  const runNow = async (rule: AdminNotifRule) => {
    if (!confirm(t("notifRules.confirmRunNow", { name: rule.name }))) return;
    try {
      const r = await notifRulesApi.runNow(rule.id);
      const base = t("notifRules.runNowResult", {
        recipients: r.recipients_count,
        push: r.push_sent,
        sms: r.sms_sent,
      });
      alert(base + (r.success ? "" : t("notifRules.runNowError", { detail: r.detail })));
      reload();
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
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
      alert((e as { message?: string }).message || t("common.error"));
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
        title={t("notifRules.pageTitle")}
        subtitle={t("notifRules.pageSubtitle", { count: rules.length })}
        actions={
          <button
            onClick={() => setEditing(emptyRule())}
            className="btn-primary text-[12.5px]"
          >
            <Plus className="h-4 w-4" /> {t("notifRules.newRule")}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {loading && (
          <div className="card p-12 text-center text-text-muted">
            {t("common.loading")}
          </div>
        )}
        {!loading && rules.length === 0 && (
          <div className="card p-12 text-center text-text-muted">
            <AlarmClock className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <div className="text-[14px] mb-1">{t("notifRules.empty")}</div>
            <div className="text-[12px]">
              {t("notifRules.emptyHint")}
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
                          {t("notifRules.active")}
                        </span>
                      </label>
                    </div>
                    <div className="mt-1 text-[12px] text-text-secondary">
                      {triggerLabels[r.trigger_type]}
                      {triggerSummary(r, t, weekdays)} → {audienceLabels[r.audience]}
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
                      <span>{t("notifRules.nextRun", { time: fmtDateTime(r.next_run_at) })}</span>
                    </div>
                    {r.last_run_at && (
                      <div className="text-[10.5px] text-text-muted">
                        {t("notifRules.lastRun", { time: fmtDateTime(r.last_run_at) })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => runNow(r)}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg-input px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-bg-hover"
                    title={t("notifRules.runNowTitle")}
                  >
                    <Play className="h-3 w-3" /> {t("notifRules.runNowBtn")}
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

function triggerSummary(r: AdminNotifRule, t: TFn, weekdays: string[]): string {
  const p = r.trigger_params || {};
  if (r.trigger_type === "premium_expiry") {
    return t("notifRules.summary.daysBefore", { days: Number(p.days_before ?? 3) });
  }
  const h = String(p.hour ?? 9).padStart(2, "0");
  const m = String(p.minute ?? 0).padStart(2, "0");
  const time = `${h}:${m}`;
  if (r.trigger_type === "daily") return t("notifRules.summary.time", { time });
  if (r.trigger_type === "weekly") {
    const wd = weekdays[Number(p.weekday ?? 0)] || t("notifRules.weekday.monShort");
    return t("notifRules.summary.weekly", { weekday: wd, time });
  }
  if (r.trigger_type === "monthly") {
    return t("notifRules.summary.monthly", { day: Number(p.day ?? 1), time });
  }
  if (r.trigger_type === "one_off") {
    return t("notifRules.summary.oneOff", { when: String(p.run_at || "—") });
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
  const { t } = useT();
  const triggerLabels = useMemo(() => getTriggerLabels(t), [t]);
  const audienceLabels = useMemo(() => getAudienceLabels(t), [t]);
  const weekdays = useMemo(() => getWeekdays(t), [t]);

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
      setError(t("notifRules.requiredErr"));
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
        className="bg-bg w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {draft.id === 0 ? t("notifRules.createTitle") : t("notifRules.editTitle")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[12px] font-medium text-text-secondary mb-1.5">
              {t("notifRules.fieldName")}
            </div>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t("notifRules.namePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[12px] font-medium text-text-secondary mb-1.5">
                {t("notifRules.fieldTrigger")}
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
                {Object.entries(triggerLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[12px] font-medium text-text-secondary mb-1.5">
                {t("notifRules.fieldAudience")}
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
                {Object.entries(audienceLabels).map(([k, v]) => (
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
              {t("notifRules.triggerSettings")}
            </div>
            {draft.trigger_type === "premium_expiry" && (
              <label className="flex items-center gap-3 text-[13px] text-text-secondary">
                {t("notifRules.premiumBeforeLabel")}
                <input
                  type="number"
                  value={Number(tp.days_before ?? 3)}
                  onChange={(e) => setTp({ days_before: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-center"
                />
                {t("notifRules.daysBeforeSuffix")}
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
                    {t("notifRules.dayOfWeek")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {weekdays.map((w, i) => (
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
                  {t("notifRules.monthDayPrefix")}
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={Number(tp.day ?? 1)}
                    onChange={(e) => setTp({ day: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-center"
                  />
                  {t("notifRules.monthDaySuffix")}
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
                {t("notifRules.dateTimeLabel")}
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
                {t("notifRules.audienceExpiringPrefix")}
                <input
                  type="number"
                  value={Number(ap.days ?? 7)}
                  onChange={(e) => setAp({ days: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-center"
                />
                {t("notifRules.audienceExpiringSuffix")}
              </label>
            </div>
          )}

          {/* Title + body (multilingual) */}
          <MultilangInput
            label={t("notifRules.titleField")}
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
            placeholder={t("notifRules.titlePlaceholder")}
          />
          <div className="text-[10.5px] text-text-muted -mt-2">
            {t("notifRules.variablesHint")} <code>{"{name}"}</code>, <code>{"{phone}"}</code>,{" "}
            <code>{"{days_left}"}</code>
          </div>
          <MultilangInput
            label={t("notifRules.bodyField")}
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
            placeholder={t("notifRules.bodyPlaceholder")}
            multiline
            rows={4}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[12px] font-medium text-text-secondary mb-1.5">
                {t("notifRules.category")}
              </div>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none"
              >
                <option value="system">{t("notifRules.category.system")}</option>
                <option value="premium">{t("notifRules.category.premium")}</option>
                <option value="tip">{t("notifRules.category.tip")}</option>
                <option value="order">{t("notifRules.category.order")}</option>
                <option value="deal">{t("notifRules.category.deal")}</option>
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
                {t("notifRules.active")}
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
                    {draft.is_active ? t("notifRules.active") : t("notifRules.inactive")}
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-[12.5px]">
              {t("notifRules.cancel")}
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="btn-primary text-[12.5px] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />{" "}
              {busy ? t("common.saving") : t("common.save")}
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
  const { t } = useT();
  return (
    <label className="flex items-center gap-3 text-[13px] text-text-secondary">
      {t("notifRules.timeLabel")}
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
