import { useEffect, useState } from "react";
import { Crown, Plus, Pencil, Trash2 } from "lucide-react";
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
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await plansApi.remove(id);
    void reload();
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.premium")}
        subtitle="Premium obuna planlari"
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
            <Plus className="h-4 w-4" /> Yangi plan
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-3 gap-4">
          {loading && (
            <div className="col-span-3 text-center text-text-muted py-12">
              Yuklanmoqda...
            </div>
          )}
          {!loading && plans.length === 0 && (
            <div className="col-span-3 text-center text-text-muted py-12">
              <Crown className="mx-auto mb-2 h-8 w-8 opacity-40" /> Planlar yo'q
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
                <span className="text-[12.5px] text-text-muted">so'm</span>
              </div>
              <div className="mt-1 text-[11.5px] text-text-muted">
                {p.duration_days} kun
              </div>
              <span
                className={
                  "mt-3 inline-block rounded-full px-2.5 py-1 text-[10.5px] font-medium " +
                  (p.is_active
                    ? "bg-status-resolved/15 text-status-resolved"
                    : "bg-text-muted/15 text-text-muted")
                }
              >
                {p.is_active ? "Faol" : "Nofaol"}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg p-5">
        <h3 className="text-[16px] font-semibold text-text-primary mb-4">
          {plan.id ? "Plan tahrirlash" : "Yangi plan"}
        </h3>
        <div className="space-y-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nom"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <textarea
            value={draft.description || ""}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="Tavsif"
            rows={3}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={draft.price_uzs ?? 0}
              onChange={(e) =>
                setDraft({ ...draft, price_uzs: Number(e.target.value) })
              }
              placeholder="Narx (so'm)"
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
            <input
              type="number"
              value={draft.duration_days ?? 30}
              onChange={(e) =>
                setDraft({ ...draft, duration_days: Number(e.target.value) })
              }
              placeholder="Davomiyligi (kun)"
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={draft.is_active ?? true}
              onChange={(e) =>
                setDraft({ ...draft, is_active: e.target.checked })
              }
            />
            Faol
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            Bekor qilish
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => onSave(draft)}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
