import { MessageSquare, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";

const requests = [
  { id: "REQ-1042", user: "Zarina Abdurahmonova", subject: "Bolani ulashda muammo", priority: "yuqori", status: "ochiq", date: "31.05.2024 11:05" },
  { id: "REQ-1041", user: "Abdulla Karimov", subject: "Premium uzaytirish", priority: "o'rta", status: "ochiq", date: "31.05.2024 09:45" },
  { id: "REQ-1040", user: "Sardorbek M.", subject: "Hisobni o'chirish", priority: "past", status: "yopilgan", date: "30.05.2024 16:20" },
  { id: "REQ-1039", user: "Nilufar Usmonova", subject: "Sozlamalar haqida savol", priority: "past", status: "ochiq", date: "30.05.2024 14:11" },
  { id: "REQ-1038", user: "Doniyor Haydarov", subject: "To'lov qaytarib berish", priority: "yuqori", status: "kutilmoqda", date: "30.05.2024 10:33" },
];

const priorityCls = {
  yuqori: "bg-status-blocked/15 text-status-blocked",
  "o'rta": "bg-status-progress/15 text-status-progress",
  past: "bg-text-secondary/15 text-text-secondary",
};

const statusCls = {
  ochiq: "bg-status-waiting/15 text-status-waiting",
  kutilmoqda: "bg-status-progress/15 text-status-progress",
  yopilgan: "bg-status-resolved/15 text-status-resolved",
};

export function RequestsPage() {
  const { t } = useT();
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.requests")}
        subtitle={t("requests.subtitle")}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: t("requests.stat.total"), value: "1,247", icon: MessageSquare, color: "#3B82F6" },
            { label: t("requests.stat.open"), value: "84", icon: AlertCircle, color: "#F59E0B" },
            { label: t("requests.stat.pending"), value: "23", icon: Clock, color: "#3B82F6" },
            { label: t("requests.stat.closed"), value: "1,140", icon: CheckCircle2, color: "#10B981" },
          ].map((s) => (
            <div key={s.label} className="card flex items-center gap-3 p-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${s.color}22`, color: s.color }}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[12px] text-text-secondary">{s.label}</div>
                <div className="text-[20px] font-bold text-text-primary">
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line p-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input placeholder={t("requests.searchPlaceholder")} className="input pl-9" />
            </div>
          </div>
          <table className="w-full text-[13px]">
            <thead className="bg-bg-input text-[12px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("requests.tbl.id")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("requests.tbl.user")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("requests.tbl.subject")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("requests.tbl.priority")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("common.status")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.id} className={`hover:bg-bg-hover/30 ${i ? "border-t border-line" : ""}`}>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">#{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.user} size={28} />
                      <span className="font-medium text-text-primary">{r.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-primary">{r.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${priorityCls[r.priority as keyof typeof priorityCls]}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCls[r.status as keyof typeof statusCls]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
