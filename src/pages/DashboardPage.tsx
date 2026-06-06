import {
  Users,
  Crown,
  PhoneCall,
  Wallet,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";

const recent = [
  { name: "Zarina Abdurahmonova", action: "Premium sotib oldi", time: "5 min" },
  { name: "Abdulla Karimov", action: "Ro'yxatdan o'tdi", time: "12 min" },
  { name: "Sardorbek M.", action: "So'rov yuborildi", time: "28 min" },
  { name: "Nilufar Usmonova", action: "Bola qo'shildi", time: "45 min" },
  { name: "Behzod Rahimov", action: "Operator bilan suhbat", time: "1 soat" },
];

const operators = [
  { name: "Jamshid Karimov", calls: 142, resolved: 138, rating: 4.9 },
  { name: "Sevinch A.", calls: 128, resolved: 122, rating: 4.8 },
  { name: "Azizbek T.", calls: 96, resolved: 89, rating: 4.7 },
  { name: "Madina N.", calls: 84, resolved: 80, rating: 4.9 },
];

export function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Asosiy panel"
        subtitle="Umumiy statistika va so'nggi faollik"
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
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Jami foydalanuvchilar"
            value="12,456"
            delta="12.5%"
            icon={Users}
            iconColor="#3B82F6"
            iconBg="rgba(59,130,246,0.15)"
          />
          <StatCard
            label="Premium obunalar"
            value="3,682"
            delta="8.4%"
            icon={Crown}
            iconColor="#8B5CF6"
            iconBg="rgba(139,92,246,0.15)"
          />
          <StatCard
            label="Faol qo'ng'iroqlar"
            value="98"
            delta="3.1%"
            icon={PhoneCall}
            iconColor="#F59E0B"
            iconBg="rgba(245,158,11,0.15)"
          />
          <StatCard
            label="Oylik daromad"
            value="120,450,000"
            delta="15.3%"
            icon={Wallet}
            iconColor="#10B981"
            iconBg="rgba(16,185,129,0.15)"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="card col-span-2 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  Foydalanuvchilar oqimi
                </h3>
                <p className="text-[12px] text-text-secondary">
                  So'nggi 30 kunlik faollik
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-line bg-bg-input p-1 text-[12px]">
                <button className="rounded-md bg-bg-hover px-2 py-1 text-text-primary">
                  Kun
                </button>
                <button className="px-2 py-1 text-text-secondary">Hafta</button>
                <button className="px-2 py-1 text-text-secondary">Oy</button>
              </div>
            </div>
            <ChartMock />
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-[15px] font-semibold text-text-primary">
              So'nggi faoliyat
            </h3>
            <div className="space-y-3">
              {recent.map((r) => (
                <div key={r.name + r.time} className="flex items-center gap-3">
                  <Avatar name={r.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-text-primary">
                      {r.name}
                    </div>
                    <div className="truncate text-[11.5px] text-text-secondary">
                      {r.action}
                    </div>
                  </div>
                  <div className="shrink-0 text-[11px] text-text-muted">
                    {r.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="card p-5">
            <h3 className="mb-1 text-[15px] font-semibold text-text-primary">
              Status taqsimoti
            </h3>
            <p className="mb-4 text-[12px] text-text-secondary">
              Foydalanuvchilar status bo'yicha
            </p>
            <div className="space-y-3">
              {[
                { label: "Hal qilingan", value: 4256, pct: 56, color: "#10B981" },
                { label: "Yopilgan", value: 2310, pct: 30, color: "#6B7280" },
                { label: "Jarayonda", value: 98, pct: 6, color: "#F59E0B" },
                { label: "Kutilmoqda", value: 67, pct: 4, color: "#3B82F6" },
                { label: "Bloklangan", value: 245, pct: 4, color: "#EF4444" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="text-text-secondary">{s.label}</span>
                    <span className="font-medium text-text-primary">
                      {s.value.toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg-input">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card col-span-2 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-text-primary">
                Eng yaxshi operatorlar
              </h3>
              <button className="text-[12px] text-brand hover:underline">
                Hammasini ko'rish ›
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-[12.5px]">
                <thead className="bg-bg-input text-text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Operator</th>
                    <th className="px-3 py-2 text-left font-medium">Qo'ng'iroqlar</th>
                    <th className="px-3 py-2 text-left font-medium">Hal qilingan</th>
                    <th className="px-3 py-2 text-left font-medium">Reyting</th>
                    <th className="px-3 py-2 text-left font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((op, i) => (
                    <tr key={op.name} className={i ? "border-t border-line" : ""}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={op.name} size={28} />
                          <span className="font-medium text-text-primary">
                            {op.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {op.calls}
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">
                        {op.resolved}
                      </td>
                      <td className="px-3 py-2.5 text-text-primary font-medium">
                        ⭐ {op.rating}
                      </td>
                      <td className="px-3 py-2.5">
                        {i % 2 === 0 ? (
                          <span className="flex items-center gap-1 text-status-resolved">
                            <ArrowUp className="h-3 w-3" /> 12%
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-status-blocked">
                            <ArrowDown className="h-3 w-3" /> 3%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartMock() {
  const bars = [40, 65, 55, 80, 60, 90, 75, 95, 70, 85, 65, 78, 88, 72, 92, 80];
  return (
    <div className="flex h-48 items-end gap-2">
      {bars.map((h, i) => (
        <div key={i} className="flex flex-1 flex-col gap-1">
          <div
            className="rounded-md bg-gradient-to-t from-brand to-blue-400 opacity-90"
            style={{ height: `${h}%` }}
          />
        </div>
      ))}
    </div>
  );
}
