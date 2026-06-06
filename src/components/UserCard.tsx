import { MessageSquare, Phone } from "lucide-react";
import type { User } from "../types";
import { Avatar } from "./Avatar";
import { cn } from "../lib/utils";

interface UserCardProps {
  user: User;
  selected?: boolean;
  dragging?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

export function UserCard({
  user,
  selected,
  dragging,
  onClick,
  onDragStart,
  onDragEnd,
}: UserCardProps) {
  const childOk = user.childStatus === "ulangan";

  let premiumText = "";
  let premiumColor = "text-text-secondary";
  if (user.premiumStatus === "sotib_olgan") {
    premiumText = "Sotib olgan";
    premiumColor = "text-text-secondary";
  } else if (user.premiumStatus === "sotib_olmagan") {
    premiumText = "Sotib olmagan";
    premiumColor = "text-text-secondary";
  } else if (user.premiumStatus === "faol") {
    premiumText = "Faol";
    premiumColor = "text-status-resolved";
  }

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group block w-full cursor-grab select-none rounded-xl border bg-bg-card p-3 text-left transition-all hover:border-line/80 hover:shadow-card active:cursor-grabbing",
        selected ? "border-brand ring-2 ring-brand/30" : "border-line",
        dragging && "opacity-40 rotate-2 scale-95",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={user.avatar} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate text-[13px] font-semibold text-text-primary">
              {user.name}
            </div>
            {user.status === "jarayonda" && (
              <Phone className="h-3.5 w-3.5 shrink-0 text-status-progress" />
            )}
          </div>
          <div className="mt-0.5 truncate text-[11.5px] text-text-secondary">
            {user.phone}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div
          className={cn(
            "text-[11.5px] font-medium",
            childOk ? "text-status-resolved" : "text-status-blocked",
          )}
        >
          {childOk ? "Bolani ulangan" : "Bolani ulanmagan"}
        </div>
        <div className="text-[11.5px]">
          <span className="text-text-secondary">Premium: </span>
          <span className={cn("font-medium", premiumColor)}>{premiumText}</span>
        </div>

        {user.status === "jarayonda" && user.currentOperator && (
          <>
            <div className="text-[11.5px]">
              <span className="text-text-secondary">Operator: </span>
              <span className="text-text-primary">{user.currentOperator.name}</span>
            </div>
            <div className="text-[11.5px]">
              <span className="text-text-secondary">Boshlangan: </span>
              <span className="text-text-primary">{user.startedAt?.split(" ")[1]}</span>
            </div>
          </>
        )}

        {user.status === "kutilmoqda" && (
          <div className="text-[11.5px]">
            <span className="text-text-secondary">Kutilmoqda: </span>
            <span className="text-text-primary">{user.waitingTime}</span>
          </div>
        )}

        {user.status === "hal_qilingan" && (
          <div className="text-[11.5px]">
            <span className="text-text-secondary">Hal qilingan: </span>
            <span className="text-text-primary">{user.resolvedAt}</span>
          </div>
        )}

        {user.status === "yopilgan" && (
          <div className="text-[11.5px]">
            <span className="text-text-secondary">Yopilgan: </span>
            <span className="text-text-primary">{user.closedAt}</span>
          </div>
        )}

        {user.status === "bloklangan" && (
          <>
            <div className="text-[11.5px]">
              <span className="text-text-secondary">Bloklangan: </span>
              <span className="text-text-primary">{user.blockedAt}</span>
            </div>
            <div className="text-[11.5px]">
              <span className="text-text-secondary">Sabab: </span>
              <span className="text-text-primary">{user.blockedReason}</span>
            </div>
          </>
        )}

        {user.status === "yangi" && (
          <div className="text-[11.5px]">
            <span className="text-text-secondary">Ro'yxatdan o'tgan: </span>
            <span className="text-text-primary">{user.registeredAt}</span>
          </div>
        )}

        {user.premiumStatus === "faol" && user.premiumDaysLeft && user.status !== "kutilmoqda" && (
          <div className="text-[11.5px]">
            <span className="text-text-secondary">Premium tugash: </span>
            <span className="text-text-primary">{user.premiumDaysLeft} kun</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[11px] text-text-muted">
        <span>{user.cardTimestamp}</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {user.commentsCount}
        </span>
      </div>
    </div>
  );
}
