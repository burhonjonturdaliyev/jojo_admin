import { useState } from "react";
import { Save, Globe, Lock, Bell, CreditCard, Building2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { cn } from "../lib/utils";

const tabs = [
  { id: "general", label: "Umumiy", icon: Building2 },
  { id: "security", label: "Xavfsizlik", icon: Lock },
  { id: "notifications", label: "Bildirishnomalar", icon: Bell },
  { id: "billing", label: "To'lov tizimlari", icon: CreditCard },
  { id: "locale", label: "Til va mintaqa", icon: Globe },
];

export function SettingsPage() {
  const [tab, setTab] = useState("general");

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Sozlamalar"
        subtitle="Tizim sozlamalari va konfiguratsiya"
        actions={
          <button className="btn-primary text-[12.5px]">
            <Save className="h-4 w-4" /> Saqlash
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-[240px_1fr] gap-5">
          <nav className="card p-2 h-fit">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                  tab === t.id
                    ? "bg-brand-soft text-brand"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="card p-6 space-y-5">
            <div>
              <h3 className="text-[16px] font-semibold text-text-primary">
                Kompaniya ma'lumotlari
              </h3>
              <p className="mt-1 text-[12.5px] text-text-secondary">
                Asosiy kompaniya ma'lumotlari va kontaktlar
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Kompaniya nomi" value="Call Center LLC" />
              <Field label="Soliq raqami" value="123456789" />
              <Field label="Email" value="admin@callcenter.uz" />
              <Field label="Telefon" value="+998 71 123 45 67" />
              <Field label="Manzil" value="Toshkent shahar, Yunusobod tumani" full />
              <Field label="Veb-sayt" value="https://callcenter.uz" />
              <Field label="Ish vaqti" value="09:00 - 18:00" />
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="text-[15px] font-semibold text-text-primary">
                Brendlash
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                    Asosiy rang
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg border border-line bg-brand" />
                    <input className="input" defaultValue="#3B82F6" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                    Logotip
                  </label>
                  <button className="btn-secondary w-full justify-start">
                    Faylni tanlash...
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
        {label}
      </label>
      <input className="input" defaultValue={value} />
    </div>
  );
}
