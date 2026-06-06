import { Search, Ban, UserCheck } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";

const blocked = [
  { name: "Sultonbek Q.", phone: "+998 94 444 55 66", reason: "Qoidalarga zid xatti-harakat", blockedBy: "Jamshid K.", date: "31.05.2024", duration: "Doimiy" },
  { name: "Fotima A.", phone: "+998 91 111 22 33", reason: "To'lov muammosi", blockedBy: "Sevinch A.", date: "30.05.2024", duration: "30 kun" },
  { name: "Jamshid U.", phone: "+998 93 222 33 44", reason: "Spam yuborish", blockedBy: "Azizbek T.", date: "28.05.2024", duration: "Doimiy" },
  { name: "Diyor X.", phone: "+998 90 333 44 55", reason: "Shubhali faollik", blockedBy: "Madina N.", date: "27.05.2024", duration: "7 kun" },
  { name: "Saida M.", phone: "+998 91 444 55 66", reason: "Bir nechta hisob", blockedBy: "Jamshid K.", date: "26.05.2024", duration: "Doimiy" },
];

export function BlockedPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Bloklanganlar"
        subtitle="Bloklangan foydalanuvchilar ro'yxati"
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "Jami bloklanganlar", value: "245", icon: Ban, color: "#EF4444" },
            { label: "Doimiy blok", value: "162", icon: Ban, color: "#F59E0B" },
            { label: "Vaqtinchalik", value: "83", icon: UserCheck, color: "#3B82F6" },
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
              <input placeholder="Foydalanuvchi yoki sabab bo'yicha qidirish..." className="input pl-9" />
            </div>
          </div>
          <table className="w-full text-[13px]">
            <thead className="bg-bg-input text-[12px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Foydalanuvchi</th>
                <th className="px-4 py-3 text-left font-semibold">Telefon</th>
                <th className="px-4 py-3 text-left font-semibold">Sabab</th>
                <th className="px-4 py-3 text-left font-semibold">Kim tomonidan</th>
                <th className="px-4 py-3 text-left font-semibold">Sana</th>
                <th className="px-4 py-3 text-left font-semibold">Muddat</th>
                <th className="px-4 py-3 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {blocked.map((b, i) => (
                <tr key={b.name} className={i ? "border-t border-line" : ""}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={b.name} size={28} />
                      <span className="font-medium text-text-primary">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{b.phone}</td>
                  <td className="px-4 py-3 text-text-primary">{b.reason}</td>
                  <td className="px-4 py-3 text-text-secondary">{b.blockedBy}</td>
                  <td className="px-4 py-3 text-text-secondary">{b.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        b.duration === "Doimiy"
                          ? "bg-status-blocked/15 text-status-blocked"
                          : "bg-status-progress/15 text-status-progress"
                      }`}
                    >
                      {b.duration}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg-card px-2.5 py-1 text-[11.5px] font-medium text-status-resolved hover:bg-bg-hover">
                      <UserCheck className="h-3.5 w-3.5" /> Blokdan ozod
                    </button>
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
