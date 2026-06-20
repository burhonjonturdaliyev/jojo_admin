import { useEffect, useState } from "react";
import {
  Crown,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Tag,
  FileText,
  CircleDollarSign,
  CalendarRange,
  Hash,
  ToggleRight,
  Sparkles,
  Star,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import {
  plansApi,
  unwrapList,
  type AdminPlan,
  type PlanDurationType,
} from "../lib/resources";

export function PremiumPage() {
  const { t } = useT();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminPlan | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const raw = await plansApi.list();
      setPlans(unwrapList(raw));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const save = async (p: AdminPlan) => {
    if (p.id) {
      await plansApi.update(p.id, p);
    } else {
      await plansApi.create(p);
    }
    setEditing(null);
    void reload();
  };

  const remove = async (id: number) => {
    if (!confirm(t("premium.confirmDelete"))) return;
    await plansApi.remove(id);
    void reload();
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.premium")}
        subtitle={t("premium.plansSubtitle")}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() =>
              setEditing({
                id: 0,
                name: "",
                name_ru: "",
                name_en: "",
                description: "",
                description_ru: "",
                description_en: "",
                price: 0,
                currency: "UZS",
                duration_value: 1,
                duration_type: "months",
                is_trial: false,
                trial_days: 0,
                is_active: true,
                is_featured: false,
                order: 0,
              })
            }
          >
            <Plus className="h-4 w-4" /> {t("premium.newPlan")}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-3 gap-4">
          {loading && (
            <div className="col-span-3 text-center text-text-muted py-12">
              {t("common.loading")}
            </div>
          )}
          {!loading && plans.length === 0 && (
            <div className="col-span-3 text-center text-text-muted py-12">
              <Crown className="mx-auto mb-2 h-8 w-8 opacity-40" /> {t("premium.plansEmpty")}
            </div>
          )}
          {plans.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <button
                    className="icon-btn h-8 w-8"
                    onClick={() => setEditing(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="icon-btn h-8 w-8 hover:bg-status-blocked/15 hover:text-status-blocked"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 flex items-center gap-1.5 text-[16px] font-semibold text-text-primary">
                {p.name}
                {p.is_featured && (
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                )}
              </h3>
              <p className="mt-1 text-[12.5px] text-text-secondary line-clamp-2">
                {p.description || "—"}
              </p>
              {p.is_trial ? (
                <div className="mt-4 flex items-baseline gap-1">
                  <Sparkles className="h-4 w-4 text-emerald-500 self-center" />
                  <span className="text-[20px] font-bold text-emerald-500">
                    Trial
                  </span>
                  <span className="text-[12.5px] text-text-muted">
                    · {p.trial_days ?? 0} {t("premium.period.days").toLowerCase()}
                  </span>
                </div>
              ) : (
                <>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-[24px] font-bold text-text-primary">
                      {(p.price ?? 0).toLocaleString("uz-UZ").replace(/,/g, " ")}
                    </span>
                    <span className="text-[12.5px] text-text-muted">
                      {p.currency || t("premium.priceCurrency")}
                    </span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-text-muted">
                    {p.duration_value ?? 0}{" "}
                    {t(`premium.period.${p.duration_type || "months"}`).toLowerCase()}
                  </div>
                </>
              )}
              <span
                className={
                  "mt-3 inline-block rounded-full px-2.5 py-1 text-[10.5px] font-medium " +
                  (p.is_active
                    ? "bg-status-resolved/15 text-status-resolved"
                    : "bg-text-muted/15 text-text-muted")
                }
              >
                {p.is_active ? t("users.filter.active") : t("common.inactive")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <PlanEditor
          plan={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

type LangCode = "uz" | "ru" | "en";

function PlanEditor({
  plan,
  onClose,
  onSave,
}: {
  plan: AdminPlan;
  onClose: () => void;
  onSave: (p: AdminPlan) => void;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState<AdminPlan>(plan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<LangCode>("uz");

  const formatPrice = (n: number) =>
    (n || 0).toLocaleString("uz-UZ").replace(/,/g, " ");

  const presets: Array<{ value: number; type: PlanDurationType; label: string }> = [
    { value: 7, type: "days", label: "7 " + t("premium.period.days").toLowerCase() },
    { value: 1, type: "months", label: "1 " + t("premium.period.months").toLowerCase() },
    { value: 3, type: "months", label: "3 " + t("premium.period.months").toLowerCase() },
    { value: 6, type: "months", label: "6 " + t("premium.period.months").toLowerCase() },
    { value: 1, type: "years", label: "1 " + t("premium.period.years").toLowerCase() },
  ];

  const handleSave = async () => {
    setError(null);
    if (!(draft.name || "").trim()) {
      setError(t("premium.editor.nameRequired"));
      return;
    }
    if ((draft.price ?? 0) < 0) {
      setError(t("premium.editor.priceNeg"));
      return;
    }
    if (!draft.is_trial && (draft.duration_value ?? 0) < 1) {
      setError(t("premium.editor.durationMin"));
      return;
    }
    if (draft.is_trial && (draft.trial_days ?? 0) < 1) {
      setError(t("premium.editor.trialDaysMin"));
      return;
    }
    setBusy(true);
    try {
      onSave(draft);
    } finally {
      setBusy(false);
    }
  };

  // Number input helper: 0/undefined → empty placeholder, foydalanuvchi
  // raqamni butunlay o'chira oladi. Bo'sh string saqlashda 0 deb qabul qilamiz
  // (validatsiya o'zi pastroq qiymatlarni ushlaydi).
  const numVal = (n: number | undefined | null): string =>
    n === undefined || n === null || n === 0 ? "" : String(n);
  const parseNum = (s: string): number => (s.trim() === "" ? 0 : Number(s) || 0);

  // Multilang field getter/setter
  const nameKey = activeLang === "uz" ? "name" : `name_${activeLang}` as keyof AdminPlan;
  const descKey =
    activeLang === "uz" ? "description" : (`description_${activeLang}` as keyof AdminPlan);
  const nameValue = (draft[nameKey] as string | undefined) || "";
  const descValue = (draft[descKey] as string | undefined) || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin rounded-2xl bg-bg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16.5px] font-bold text-text-primary">
                {plan.id ? t("premium.editPlan") : t("premium.newPlanTitle")}
              </h3>
              <div className="text-[11.5px] text-text-muted">
                {t("premium.editor.subtitle")}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Multilang tab tanlash */}
          <div className="flex items-center gap-1 rounded-lg border border-line bg-bg-input p-1">
            {(["uz", "ru", "en"] as LangCode[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setActiveLang(l)}
                className={
                  "flex-1 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors " +
                  (activeLang === l
                    ? "bg-primary/15 text-primary"
                    : "text-text-secondary hover:text-text-primary")
                }
              >
                {t(`premium.field.langTab.${l}`)}
              </button>
            ))}
          </div>
          <div className="text-[10.5px] text-text-muted -mt-2">
            {t("premium.field.multilangHint")}
          </div>

          {/* Nomi (active langga qarab) */}
          <Field
            icon={<Tag className="h-3.5 w-3.5" />}
            label={t("premium.field.name")}
            required={activeLang === "uz"}
          >
            <input
              value={nameValue}
              onChange={(e) =>
                setDraft({ ...draft, [nameKey]: e.target.value } as AdminPlan)
              }
              placeholder={t("premium.field.namePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[13.5px] font-medium text-text-primary outline-none focus:border-primary"
            />
          </Field>

          {/* Tavsif (active langga qarab) */}
          <Field
            icon={<FileText className="h-3.5 w-3.5" />}
            label={t("premium.field.description")}
          >
            <textarea
              value={descValue}
              onChange={(e) =>
                setDraft({ ...draft, [descKey]: e.target.value } as AdminPlan)
              }
              placeholder={t("premium.field.descPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary resize-none"
            />
          </Field>

          {/* Trial toggle */}
          <label className="flex items-center justify-between gap-2 rounded-lg border border-line bg-bg-input px-3 py-2.5 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-medium text-text-primary">
                  {t("premium.field.isTrial")}
                </div>
                <div className="text-[11px] text-text-muted">
                  {t("premium.field.isTrialHint")}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.is_trial ?? false}
              onChange={(e) =>
                setDraft({ ...draft, is_trial: e.target.checked })
              }
              className="h-4 w-4"
            />
          </label>

          {draft.is_trial ? (
            <Field
              icon={<CalendarRange className="h-3.5 w-3.5" />}
              label={t("premium.field.trialDays")}
              required
            >
              <input
                type="number"
                min={1}
                value={numVal(draft.trial_days)}
                onChange={(e) =>
                  setDraft({ ...draft, trial_days: parseNum(e.target.value) })
                }
                placeholder="7"
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[14px] font-semibold text-text-primary outline-none focus:border-primary"
              />
            </Field>
          ) : (
            <>
              {/* Narx + Valyuta */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field
                    icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                    label={t("premium.field.price")}
                    hint={
                      draft.price
                        ? `${formatPrice(draft.price)} ${draft.currency || "UZS"}`
                        : "0"
                    }
                    required
                  >
                    <input
                      type="number"
                      min={0}
                      value={numVal(draft.price)}
                      onChange={(e) =>
                        setDraft({ ...draft, price: parseNum(e.target.value) })
                      }
                      placeholder="50000"
                      className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[14px] font-semibold text-text-primary outline-none focus:border-primary"
                    />
                  </Field>
                </div>
                <Field label={t("premium.field.currency")}>
                  <select
                    value={draft.currency || "UZS"}
                    onChange={(e) =>
                      setDraft({ ...draft, currency: e.target.value })
                    }
                    className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-2.5 text-[13.5px] outline-none focus:border-primary"
                  >
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                    <option value="RUB">RUB</option>
                    <option value="EUR">EUR</option>
                  </select>
                </Field>
              </div>

              {/* Davomiyligi + Birlik */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field
                    icon={<CalendarRange className="h-3.5 w-3.5" />}
                    label={t("premium.field.durationValue")}
                    required
                  >
                    <input
                      type="number"
                      min={1}
                      value={numVal(draft.duration_value)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          duration_value: parseNum(e.target.value),
                        })
                      }
                      placeholder="1"
                      className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[14px] font-semibold text-text-primary outline-none focus:border-primary"
                    />
                  </Field>
                </div>
                <Field label={t("premium.field.durationType")}>
                  <select
                    value={draft.duration_type || "months"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        duration_type: e.target.value as PlanDurationType,
                      })
                    }
                    className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-2.5 text-[13.5px] outline-none focus:border-primary"
                  >
                    <option value="days">{t("premium.period.days")}</option>
                    <option value="months">{t("premium.period.months")}</option>
                    <option value="years">{t("premium.period.years")}</option>
                  </select>
                </Field>
              </div>

              {/* Tezkor presetlar */}
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => {
                  const active =
                    draft.duration_value === p.value && draft.duration_type === p.type;
                  return (
                    <button
                      key={`${p.value}-${p.type}`}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          duration_value: p.value,
                          duration_type: p.type,
                        })
                      }
                      className={
                        "rounded-md border px-2.5 py-1 text-[11.5px] font-medium transition-colors " +
                        (active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-line bg-bg-input text-text-secondary hover:text-text-primary")
                      }
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Tartib */}
          <Field
            icon={<Hash className="h-3.5 w-3.5" />}
            label={t("premium.field.order")}
            hint={t("premium.field.orderHint")}
          >
            <input
              type="number"
              min={0}
              value={numVal(draft.order)}
              onChange={(e) =>
                setDraft({ ...draft, order: parseNum(e.target.value) })
              }
              placeholder="0"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </Field>

          {/* Featured */}
          <label className="flex items-center justify-between gap-2 rounded-lg border border-line bg-bg-input px-3 py-2.5 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-500">
                <Star className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-medium text-text-primary">
                  {t("premium.field.isFeatured")}
                </div>
                <div className="text-[11px] text-text-muted">
                  {t("premium.field.isFeaturedHint")}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.is_featured ?? false}
              onChange={(e) =>
                setDraft({ ...draft, is_featured: e.target.checked })
              }
              className="h-4 w-4"
            />
          </label>

          {/* Faollik */}
          <label className="flex items-center justify-between gap-2 rounded-lg border border-line bg-bg-input px-3 py-2.5 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500">
                <ToggleRight className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-medium text-text-primary">
                  {t("premium.field.isActive")}
                </div>
                <div className="text-[11px] text-text-muted">
                  {t("premium.field.isActiveHint")}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.is_active ?? true}
              onChange={(e) =>
                setDraft({ ...draft, is_active: e.target.checked })
              }
              className="h-4 w-4"
            />
          </label>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
              {error}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="btn-secondary text-[12.5px]"
            onClick={onClose}
            disabled={busy}
          >
            {t("premium.cancel")}
          </button>
          <button
            className="btn-primary text-[12.5px] disabled:opacity-50"
            onClick={handleSave}
            disabled={busy}
          >
            <Save className="h-3.5 w-3.5" />
            {busy ? t("premium.saving") : t("premium.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  hint,
  required,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon && <span className="text-text-muted">{icon}</span>}
        <label className="text-[12px] font-semibold text-text-secondary">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      </div>
      {children}
      {hint && (
        <div className="mt-1 text-[10.5px] text-text-muted">{hint}</div>
      )}
    </div>
  );
}
