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
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import { plansApi, unwrapList, type AdminPlan } from "../lib/resources";

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
                description: "",
                price_uzs: 0,
                duration_days: 30,
                is_active: true,
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
              <h3 className="mt-3 text-[16px] font-semibold text-text-primary">
                {p.name}
              </h3>
              <p className="mt-1 text-[12.5px] text-text-secondary line-clamp-2">
                {p.description || "—"}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[24px] font-bold text-text-primary">
                  {(p.price_uzs ?? 0).toLocaleString("uz-UZ").replace(/,/g, " ")}
                </span>
                <span className="text-[12.5px] text-text-muted">{t("premium.priceCurrency")}</span>
              </div>
              <div className="mt-1 text-[11.5px] text-text-muted">
                {t("premium.duration", { n: p.duration_days ?? 0 })}
              </div>
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

function PlanEditor({
  plan,
  onClose,
  onSave,
}: {
  plan: AdminPlan;
  onClose: () => void;
  onSave: (p: AdminPlan) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (n: number) =>
    (n || 0).toLocaleString("uz-UZ").replace(/,/g, " ");

  const presetDurations = [
    { d: 7, label: "1 hafta" },
    { d: 30, label: "1 oy" },
    { d: 90, label: "3 oy" },
    { d: 180, label: "6 oy" },
    { d: 365, label: "1 yil" },
  ];

  const handleSave = async () => {
    setError(null);
    if (!draft.name.trim()) {
      setError("Tarif nomini kiriting");
      return;
    }
    if ((draft.price_uzs ?? 0) < 0) {
      setError("Narx manfiy bo'lishi mumkin emas");
      return;
    }
    if ((draft.duration_days ?? 0) < 1) {
      setError("Davomiyligi 1 kundan kam bo'lmasligi kerak");
      return;
    }
    setBusy(true);
    try {
      onSave(draft);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-bg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16.5px] font-bold text-text-primary">
                {plan.id ? "Tarifni tahrirlash" : "Yangi Premium tarif"}
              </h3>
              <div className="text-[11.5px] text-text-muted">
                Foydalanuvchilar shu tariflardan birini tanlaydi
              </div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nomi */}
          <Field
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Tarif nomi"
            hint="Foydalanuvchiga ko'rsatiladigan asosiy nom"
            required
          >
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Masalan: Premium Pro"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[13.5px] font-medium text-text-primary outline-none focus:border-primary"
            />
          </Field>

          {/* Tavsif */}
          <Field
            icon={<FileText className="h-3.5 w-3.5" />}
            label="Qisqacha tavsif"
            hint="Tarif ichidagi imkoniyatlar haqida bir-ikki gap"
          >
            <textarea
              value={draft.description || ""}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Hudud bloklash, ilova nazorati, cheksiz farzandlar..."
              rows={3}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary resize-none"
            />
          </Field>

          {/* Narx + Davomiyligi */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={<CircleDollarSign className="h-3.5 w-3.5" />}
              label="Narxi (so'm)"
              hint={
                draft.price_uzs
                  ? `${formatPrice(draft.price_uzs)} so'm`
                  : "Bepul tarif uchun 0"
              }
              required
            >
              <input
                type="number"
                min={0}
                value={draft.price_uzs ?? 0}
                onChange={(e) =>
                  setDraft({ ...draft, price_uzs: Number(e.target.value) })
                }
                placeholder="50000"
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[14px] font-semibold text-text-primary outline-none focus:border-primary"
              />
            </Field>

            <Field
              icon={<CalendarRange className="h-3.5 w-3.5" />}
              label="Davomiyligi (kun)"
              hint={`Bir martalik to'lov ${draft.duration_days ?? 30} kunga`}
              required
            >
              <input
                type="number"
                min={1}
                value={draft.duration_days ?? 30}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    duration_days: Number(e.target.value),
                  })
                }
                placeholder="30"
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[14px] font-semibold text-text-primary outline-none focus:border-primary"
              />
            </Field>
          </div>

          {/* Tezkor muddat presetlari */}
          <div className="flex flex-wrap gap-1.5">
            {presetDurations.map((p) => (
              <button
                key={p.d}
                type="button"
                onClick={() => setDraft({ ...draft, duration_days: p.d })}
                className={
                  "rounded-md border px-2.5 py-1 text-[11.5px] font-medium transition-colors " +
                  (draft.duration_days === p.d
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-bg-input text-text-secondary hover:text-text-primary")
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Tartib */}
          <Field
            icon={<Hash className="h-3.5 w-3.5" />}
            label="Tartib raqami"
            hint="Kichik raqam ro'yxat tepasida ko'rinadi (0 — birinchi)"
          >
            <input
              type="number"
              min={0}
              value={draft.order ?? 0}
              onChange={(e) =>
                setDraft({ ...draft, order: Number(e.target.value) })
              }
              placeholder="0"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </Field>

          {/* Faollik */}
          <label className="flex items-center justify-between gap-2 rounded-lg border border-line bg-bg-input px-3 py-2.5 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500">
                <ToggleRight className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-medium text-text-primary">
                  Tarif faol
                </div>
                <div className="text-[11px] text-text-muted">
                  Foydalanuvchilarga ko'rsatilsinmi
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
            Bekor
          </button>
          <button
            className="btn-primary text-[12.5px] disabled:opacity-50"
            onClick={handleSave}
            disabled={busy}
          >
            <Save className="h-3.5 w-3.5" />
            {busy ? "Saqlanmoqda..." : "Saqlash"}
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
