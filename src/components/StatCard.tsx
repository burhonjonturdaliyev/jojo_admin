import type { LucideIcon } from "lucide-react";
import { ArrowUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  positive?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  iconColor,
  iconBg,
  positive = true,
}: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[12.5px] font-medium text-text-secondary">{label}</div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-text-primary">
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
        <span
          className={`flex items-center gap-0.5 font-semibold ${
            positive ? "text-status-resolved" : "text-status-blocked"
          }`}
        >
          <ArrowUp className="h-3 w-3" strokeWidth={2.6} />
          {delta}
        </span>
        <span className="text-text-muted">bu oyda</span>
      </div>
    </div>
  );
}
