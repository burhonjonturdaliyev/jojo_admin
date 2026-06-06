import { Crown, Check, Plus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

const plans = [
  {
    name: "1 oy",
    price: "150,000",
    users: 1247,
    revenue: "187,050,000",
    features: ["Cheksiz qo'ng'iroqlar", "Premium dasturlar", "24/7 yordam"],
    highlight: false,
  },
  {
    name: "6 oy",
    price: "780,000",
    users: 1842,
    revenue: "1,436,760,000",
    features: ["Cheksiz qo'ng'iroqlar", "Premium dasturlar", "Tezkor yordam", "Kashalbet 50,000 so'm"],
    highlight: true,
  },
  {
    name: "1 yil",
    price: "1,500,000",
    users: 593,
    revenue: "889,500,000",
    features: ["Hammasi", "VIP qo'llab-quvvatlash", "Bepul yangilanishlar", "Kashalbet 200,000 so'm"],
    highlight: false,
  },
];

export function PremiumPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Premium obunalar"
        subtitle="Premium tariflar va obunachilar"
        actions={
          <button className="btn-primary text-[12.5px]">
            <Plus className="h-4 w-4" /> Yangi tarif
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative card p-6 ${
                p.highlight
                  ? "border-brand bg-gradient-to-br from-brand-soft to-transparent"
                  : ""
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white">
                  Eng mashhur
                </span>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown
                      className="h-5 w-5"
                      style={{ color: p.highlight ? "#3B82F6" : "#8B5CF6" }}
                    />
                    <h3 className="text-[16px] font-bold text-text-primary">
                      {p.name}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[28px] font-bold text-text-primary">
                      {p.price}
                    </span>
                    <span className="text-[12px] text-text-muted">so'm</span>
                  </div>
                </div>
              </div>

              <ul className="mt-5 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <Check className="h-4 w-4 text-status-resolved" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5 border-t border-line pt-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-[18px] font-bold text-text-primary">
                      {p.users.toLocaleString("ru-RU")}
                    </div>
                    <div className="text-[11px] text-text-muted">Obunachilar</div>
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-text-primary">
                      {p.revenue}
                    </div>
                    <div className="text-[11px] text-text-muted">Daromad (so'm)</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 card p-5">
          <h3 className="mb-4 text-[15px] font-semibold text-text-primary">
            So'nggi obunalar
          </h3>
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-bg-input text-[12px] text-text-muted">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Foydalanuvchi</th>
                  <th className="px-4 py-2.5 text-left font-medium">Tarif</th>
                  <th className="px-4 py-2.5 text-left font-medium">Boshlandi</th>
                  <th className="px-4 py-2.5 text-left font-medium">Tugaydi</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { user: "Zarina Abdurahmonova", plan: "6 oy", start: "15.05.2024", end: "15.11.2024", active: true },
                  { user: "Abdulla Karimov", plan: "1 oy", start: "31.05.2024", end: "30.06.2024", active: true },
                  { user: "Nilufar Usmonova", plan: "1 yil", start: "10.05.2024", end: "10.05.2025", active: true },
                  { user: "Sardorbek M.", plan: "6 oy", start: "01.05.2024", end: "01.11.2024", active: true },
                  { user: "Shahnoza B.", plan: "1 oy", start: "20.04.2024", end: "20.05.2024", active: false },
                ].map((r, i) => (
                  <tr key={r.user} className={i ? "border-t border-line" : ""}>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {r.user}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{r.plan}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.start}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.end}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          r.active
                            ? "bg-status-resolved/15 text-status-resolved"
                            : "bg-text-muted/15 text-text-muted"
                        }`}
                      >
                        {r.active ? "Faol" : "Tugagan"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
