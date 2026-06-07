import { useState } from "react";
import { Plus, Send, Users, Bell } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { LocalizedField } from "../components/LocalizedField";
import { TranslateAllButton } from "../components/TranslateAllButton";
import { useT } from "../lib/i18n";
import { emptyLocalized } from "../types/locale";

const notifications = [
  { title: "Premium chegirma 30%", target: "Barcha foydalanuvchilar", recipients: 12456, sentAt: "31.05.2024 10:00", delivered: 12102 },
  { title: "Yangi funksiya: oilaviy hisob", target: "Premium foydalanuvchilar", recipients: 3682, sentAt: "30.05.2024 14:30", delivered: 3621 },
  { title: "Texnik ishlar 22:00 - 23:00", target: "Barcha foydalanuvchilar", recipients: 12456, sentAt: "29.05.2024 18:00", delivered: 12388 },
  { title: "Bola ulashga taklif", target: "Bola ulanmaganlar", recipients: 4131, sentAt: "28.05.2024 09:00", delivered: 4082 },
];

export function NotificationsPage() {
  const { t, lang } = useT();
  const [title, setTitle] = useState(emptyLocalized());
  const [body, setBody] = useState(emptyLocalized());

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.notifications")}
        subtitle={t("notifications.subtitle")}
        actions={
          <button className="btn-primary text-[12.5px]">
            <Plus className="h-4 w-4" /> {t("notifications.new")}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-2 gap-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-text-primary">
                {t("notifications.quickSend")}
              </h3>
              <TranslateAllButton
                from={lang}
                fields={[
                  { value: title, onChange: setTitle },
                  { value: body, onChange: setBody },
                ]}
              />
            </div>
            <div className="space-y-3">
              <LocalizedField
                label={t("common.title")}
                value={title}
                onChange={setTitle}
                placeholder={t("notifications.titlePlaceholder")}
              />
              <LocalizedField
                as="textarea"
                rows={4}
                label={t("common.message")}
                value={body}
                onChange={setBody}
                placeholder={t("notifications.bodyPlaceholder")}
              />
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  {t("common.audience")}
                </label>
                <select className="input">
                  <option>{t("common.allUsers")}</option>
                  <option>{t("common.premiumUsers")}</option>
                  <option>{t("common.newUsers")}</option>
                  <option>{t("common.unconnectedChildren")}</option>
                </select>
              </div>
              <button className="btn-primary w-full">
                <Send className="h-4 w-4" /> {t("common.send")}
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 text-[15px] font-semibold text-text-primary">
              {t("notifications.recent")}
            </h3>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.title} className="rounded-lg border border-line bg-bg-input p-3">
                  <div className="flex items-start gap-2">
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-text-primary">
                        {n.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-text-secondary">
                        <Users className="h-3 w-3" />
                        {n.target} · {n.recipients.toLocaleString("ru-RU")} ta
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-text-muted">{n.sentAt}</span>
                        <span className="text-status-resolved">
                          {t("notifications.deliveredLabel")}
                          {((n.delivered / n.recipients) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
