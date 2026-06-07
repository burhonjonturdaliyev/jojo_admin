import { useState } from "react";
import { Save, Globe, Lock, Bell, CreditCard, Building2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { cn } from "../lib/utils";
import { useT } from "../lib/i18n";

export function SettingsPage() {
  const { t } = useT();
  const [tab, setTab] = useState("general");
  const tabs = [
    { id: "general", label: t("settings.tab.general"), icon: Building2 },
    { id: "security", label: t("settings.tab.security"), icon: Lock },
    { id: "notifications", label: t("settings.tab.notifications"), icon: Bell },
    { id: "billing", label: t("settings.tab.billing"), icon: CreditCard },
    { id: "locale", label: t("settings.tab.locale"), icon: Globe },
  ];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.settings")}
        subtitle={t("settings.subtitle")}
        actions={
          <button className="btn-primary text-[12.5px]">
            <Save className="h-4 w-4" /> {t("common.save")}
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
                {t("settings.companyInfo")}
              </h3>
              <p className="mt-1 text-[12.5px] text-text-secondary">
                {t("settings.companyInfoSub")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("settings.companyName")} value="Call Center LLC" />
              <Field label={t("settings.taxNumber")} value="123456789" />
              <Field label={t("userDetail.email")} value="admin@callcenter.uz" />
              <Field label={t("settings.phone")} value="+998 71 123 45 67" />
              <Field label={t("settings.address")} value="Toshkent shahar, Yunusobod tumani" full />
              <Field label={t("settings.website")} value="https://callcenter.uz" />
              <Field label={t("settings.workingHours")} value="09:00 - 18:00" />
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="text-[15px] font-semibold text-text-primary">
                {t("settings.branding")}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                    {t("settings.primaryColor")}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg border border-line bg-brand" />
                    <input className="input" defaultValue="#3B82F6" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                    {t("settings.logo")}
                  </label>
                  <button className="btn-secondary w-full justify-start">
                    {t("settings.chooseFile")}
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
