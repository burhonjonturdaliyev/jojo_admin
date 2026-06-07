import { Plus, Send, Users, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { LocalizedField } from "../components/LocalizedField";
import { TranslateAllButton } from "../components/TranslateAllButton";
import { useT } from "../lib/i18n";
import { emptyLocalized } from "../types/locale";

const smsHistory = [
  { text: "Hurmatli mijoz, Premium obunangiz 3 kundan keyin tugaydi.", target: "Premium foydalanuvchilar", recipients: 3682, sentAt: "31.05.2024 11:20", delivered: 3640 },
  { text: "JoJo: Tasdiqlash kodi 4821. Hech kimga bermang.", target: "Yangi ro'yxatdan o'tganlar", recipients: 412, sentAt: "31.05.2024 09:15", delivered: 410 },
  { text: "Yangi chegirma! Premium obunaga 30% chegirma faqat bugun.", target: "Barcha foydalanuvchilar", recipients: 12456, sentAt: "30.05.2024 16:40", delivered: 12031 },
  { text: "Hisobingizga 50 000 so'm qaytarildi. Rahmat!", target: "To'lov qaytarilganlar", recipients: 87, sentAt: "29.05.2024 14:00", delivered: 87 },
];

const SMS_LIMIT = 160;

export function SmsPage() {
  const { t, lang } = useT();
  const [message, setMessage] = useState(emptyLocalized());
  const charCount = message[lang].length;
  const smsCount = Math.max(1, Math.ceil(charCount / SMS_LIMIT));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.sms")}
        subtitle={t("sms.subtitle")}
        actions={
          <button className="btn-primary text-[12.5px]">
            <Plus className="h-4 w-4" /> {t("sms.new")}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-2 gap-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-text-primary">
                {t("sms.quickSend")}
              </h3>
              <TranslateAllButton
                from={lang}
                fields={[{ value: message, onChange: setMessage }]}
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  {t("common.audience")}
                </label>
                <select className="input">
                  <option>{t("common.allUsers")}</option>
                  <option>{t("common.premiumUsers")}</option>
                  <option>{t("common.newUsers")}</option>
                  <option>{t("common.unconnectedChildren")}</option>
                  <option>{t("sms.toOne")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  {t("sms.phoneOptional")}
                </label>
                <input className="input" placeholder={t("sms.phonePlaceholder")} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-[12px] font-medium text-text-secondary">
                    {t("common.message")}
                  </label>
                  <span className="text-[11px] text-text-muted">
                    {t("sms.charCounter", { count: charCount, limit: SMS_LIMIT, sms: smsCount })}
                  </span>
                </div>
                <LocalizedField
                  as="textarea"
                  rows={5}
                  value={message}
                  onChange={setMessage}
                  placeholder={t("sms.bodyPlaceholder")}
                />
              </div>
              <button className="btn-primary w-full">
                <Send className="h-4 w-4" /> {t("common.send")}
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 text-[15px] font-semibold text-text-primary">
              {t("sms.recent")}
            </h3>
            <div className="space-y-3">
              {smsHistory.map((s) => (
                <div key={s.text} className="rounded-lg border border-line bg-bg-input p-3">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-text-primary">
                        {s.text}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-text-secondary">
                        <Users className="h-3 w-3" />
                        {s.target} · {s.recipients.toLocaleString("ru-RU")} ta
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-text-muted">{s.sentAt}</span>
                        <span className="text-status-resolved">
                          {t("notifications.deliveredLabel")}
                          {((s.delivered / s.recipients) * 100).toFixed(1)}%
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
