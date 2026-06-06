import { Plus, Phone, Clock, Star, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";

const operators = [
  { name: "Jamshid Karimov", phone: "+998 90 111 22 33", role: "Senior", status: "online", calls: 142, resolved: 138, rating: 4.9, avgTime: "4:32" },
  { name: "Sevinch Abdullayeva", phone: "+998 91 222 33 44", role: "Senior", status: "online", calls: 128, resolved: 122, rating: 4.8, avgTime: "5:12" },
  { name: "Azizbek Toirov", phone: "+998 93 333 44 55", role: "Operator", status: "busy", calls: 96, resolved: 89, rating: 4.7, avgTime: "6:01" },
  { name: "Madina Nazarova", phone: "+998 94 444 55 66", role: "Operator", status: "online", calls: 84, resolved: 80, rating: 4.9, avgTime: "5:48" },
  { name: "Bobur Rahimov", phone: "+998 90 555 66 77", role: "Junior", status: "offline", calls: 62, resolved: 56, rating: 4.5, avgTime: "7:20" },
  { name: "Lola Yuldasheva", phone: "+998 91 666 77 88", role: "Operator", status: "online", calls: 78, resolved: 72, rating: 4.6, avgTime: "6:15" },
];

const statusCls = {
  online: { dot: "bg-status-resolved", label: "Onlayn", cls: "bg-status-resolved/15 text-status-resolved" },
  busy: { dot: "bg-status-progress", label: "Band", cls: "bg-status-progress/15 text-status-progress" },
  offline: { dot: "bg-text-muted", label: "Oflayn", cls: "bg-text-muted/15 text-text-muted" },
};

export function OperatorsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Operatorlar"
        subtitle="Call center jamoasi va statistika"
        actions={
          <button className="btn-primary text-[12.5px]">
            <Plus className="h-4 w-4" /> Yangi operator
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: "Jami operatorlar", value: "24", icon: Phone, color: "#3B82F6" },
            { label: "Onlayn", value: "18", icon: CheckCircle2, color: "#10B981" },
            { label: "O'rt. javob vaqti", value: "5:42", icon: Clock, color: "#F59E0B" },
            { label: "O'rt. reyting", value: "4.8", icon: Star, color: "#8B5CF6" },
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

        <div className="grid grid-cols-3 gap-4">
          {operators.map((op) => {
            const st = statusCls[op.status as keyof typeof statusCls];
            return (
              <div key={op.name} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar name={op.name} size={48} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg-card ${st.dot}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[14px] font-semibold text-text-primary">
                      {op.name}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-text-secondary">
                      {op.phone}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-full bg-bg-input px-2 py-0.5 text-[10.5px] font-medium text-text-secondary">
                        {op.role}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
                  <div>
                    <div className="text-[14px] font-bold text-text-primary">
                      {op.calls}
                    </div>
                    <div className="text-[10px] text-text-muted">Qo'ng'iroq</div>
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-status-resolved">
                      {op.resolved}
                    </div>
                    <div className="text-[10px] text-text-muted">Hal qildi</div>
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-text-primary">
                      {op.avgTime}
                    </div>
                    <div className="text-[10px] text-text-muted">O'rt. vaqt</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-0.5 text-[14px] font-bold text-status-progress">
                      <Star className="h-3 w-3 fill-current" /> {op.rating}
                    </div>
                    <div className="text-[10px] text-text-muted">Reyting</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
