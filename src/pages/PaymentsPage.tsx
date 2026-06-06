import { Search, Download, Calendar, ArrowUp } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";

const payments = [
  { id: "TXN-024531", user: "Zarina Abdurahmonova", plan: "Premium 6 oy", amount: 780000, method: "Click", date: "31.05.2024 14:23", status: "muvaffaqiyatli" },
  { id: "TXN-024530", user: "Abdulla Karimov", plan: "Premium 1 oy", amount: 150000, method: "Payme", date: "31.05.2024 12:45", status: "muvaffaqiyatli" },
  { id: "TXN-024529", user: "Sardorbek M.", plan: "Premium 6 oy", amount: 780000, method: "Uzcard", date: "31.05.2024 10:15", status: "muvaffaqiyatli" },
  { id: "TXN-024528", user: "Nilufar Usmonova", plan: "Premium 1 yil", amount: 1500000, method: "Humo", date: "31.05.2024 09:08", status: "kutilmoqda" },
  { id: "TXN-024527", user: "Islom Yusupov", plan: "Premium 1 oy", amount: 150000, method: "Click", date: "30.05.2024 22:51", status: "muvaffaqiyatli" },
  { id: "TXN-024526", user: "Behzod Rahimov", plan: "Premium 6 oy", amount: 780000, method: "Payme", date: "30.05.2024 18:33", status: "rad_etilgan" },
  { id: "TXN-024525", user: "Ma'ruf Mirzayev", plan: "Premium 1 oy", amount: 150000, method: "Uzcard", date: "30.05.2024 16:12", status: "muvaffaqiyatli" },
];

const statusMap = {
  muvaffaqiyatli: { label: "Muvaffaqiyatli", cls: "bg-status-resolved/15 text-status-resolved" },
  kutilmoqda: { label: "Kutilmoqda", cls: "bg-status-progress/15 text-status-progress" },
  rad_etilgan: { label: "Rad etilgan", cls: "bg-status-blocked/15 text-status-blocked" },
};

export function PaymentsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="To'lovlar tarixi"
        subtitle="Barcha tranzaksiyalar ro'yxati"
        actions={
          <>
            <button className="btn-secondary text-[12.5px]">
              <Calendar className="h-4 w-4" /> 01.05.2024 - 31.05.2024
            </button>
            <button className="btn-secondary text-[12.5px]">
              <Download className="h-4 w-4" /> Eksport
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: "Jami daromad", value: "120,450,000", suffix: "so'm", trend: "+15.3%" },
            { label: "Muvaffaqiyatli", value: "8,432", trend: "+12.1%" },
            { label: "Kutilmoqda", value: "23", trend: "+4.2%" },
            { label: "Rad etilgan", value: "127", trend: "-1.8%" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="text-[12px] text-text-secondary">{s.label}</div>
              <div className="mt-1 text-[22px] font-bold text-text-primary">
                {s.value} <span className="text-[12px] font-normal text-text-muted">{s.suffix}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11.5px] text-status-resolved">
                <ArrowUp className="h-3 w-3" /> {s.trend}
              </div>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line p-4">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                placeholder="TXN ID yoki foydalanuvchi bo'yicha qidirish..."
                className="input pl-9"
              />
            </div>
          </div>

          <table className="w-full text-[13px]">
            <thead className="bg-bg-input text-[12px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Foydalanuvchi</th>
                <th className="px-4 py-3 text-left font-semibold">Tarif</th>
                <th className="px-4 py-3 text-left font-semibold">Summa</th>
                <th className="px-4 py-3 text-left font-semibold">Usul</th>
                <th className="px-4 py-3 text-left font-semibold">Sana</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id} className={i ? "border-t border-line" : ""}>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">
                    #{p.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.user} size={28} />
                      <span className="font-medium text-text-primary">{p.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.plan}</td>
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {p.amount.toLocaleString("ru-RU")} so'm
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.method}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusMap[p.status as keyof typeof statusMap].cls}`}
                    >
                      {statusMap[p.status as keyof typeof statusMap].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
