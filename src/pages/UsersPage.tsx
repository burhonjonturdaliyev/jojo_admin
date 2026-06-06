import { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  Filter,
  Plus,
  Users as UsersIcon,
  UserCheck,
  Crown,
  Wallet,
  Ban,
  ChevronDown,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { UserCard } from "../components/UserCard";
import { UserDetailPanel } from "../components/UserDetailPanel";
import { statusColumns, users as initialUsers, statusLabels } from "../data/users";
import type { User, UserStatus } from "../types";
import { cn } from "../lib/utils";

export function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedId, setSelectedId] = useState<string | null>("USR-00012345");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<UserStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId],
  );

  const usersByStatus = useMemo(() => {
    const map = new Map<UserStatus, User[]>();
    statusColumns.forEach((c) => map.set(c.status, []));
    users.forEach((u) => {
      const arr = map.get(u.status);
      if (arr) arr.push(u);
    });
    return map;
  }, [users]);

  const initialCountByStatus = useMemo(() => {
    const map = new Map<UserStatus, number>();
    statusColumns.forEach((c) => map.set(c.status, 0));
    initialUsers.forEach((u) => {
      map.set(u.status, (map.get(u.status) ?? 0) + 1);
    });
    return map;
  }, []);

  const handleDrop = (status: UserStatus) => {
    if (!draggedId) return;
    const user = users.find((u) => u.id === draggedId);
    if (!user || user.status === status) {
      setDraggedId(null);
      setDragOverCol(null);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === draggedId ? { ...u, status } : u)),
    );
    setToast(
      `${user.name} → ${statusLabels[status]}`,
    );
    setTimeout(() => setToast(null), 2400);
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex h-full">
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-bg-panel px-7 py-4">
          <div>
            <h1 className="text-[20px] font-bold leading-tight text-text-primary">
              Foydalanuvchilar
            </h1>
            <p className="mt-0.5 text-[12.5px] text-text-secondary">
              Barcha foydalanuvchilar haqida ma'lumot va boshqaruv
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="btn-secondary text-[12.5px]">
              <Calendar className="h-4 w-4" />
              01.05.2024 - 31.05.2024
            </button>
            <button className="btn-secondary text-[12.5px]">
              <Download className="h-4 w-4" />
              Eksport
            </button>
            <button className="btn-secondary text-[12.5px]">
              <Filter className="h-4 w-4" />
              Filtrlar
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button className="btn-primary text-[12.5px]">
              <Plus className="h-4 w-4" />
              Yangi foydalanuvchi
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            <StatCard
              label="Jami foydalanuvchilar"
              value="12,456"
              delta="12.5%"
              icon={UsersIcon}
              iconColor="#3B82F6"
              iconBg="rgba(59,130,246,0.15)"
            />
            <StatCard
              label="Bolani ulangan"
              value="8,325"
              delta="10.2%"
              icon={UserCheck}
              iconColor="#10B981"
              iconBg="rgba(16,185,129,0.15)"
            />
            <StatCard
              label="Premium foydalanuvchilar"
              value="3,682"
              delta="8.4%"
              icon={Crown}
              iconColor="#8B5CF6"
              iconBg="rgba(139,92,246,0.15)"
            />
            <StatCard
              label="Premium daromad"
              value="120,450,000"
              delta="15.3%"
              icon={Wallet}
              iconColor="#F59E0B"
              iconBg="rgba(245,158,11,0.15)"
            />
            <StatCard
              label="Bloklangan foydalanuvchilar"
              value="245"
              delta="3.1%"
              icon={Ban}
              iconColor="#EF4444"
              iconBg="rgba(239,68,68,0.15)"
            />
          </div>

          {/* Kanban */}
          <div className="mt-5 grid grid-cols-6 gap-3">
            {statusColumns.map((col) => {
              const colUsers = usersByStatus.get(col.status) ?? [];
              const isDragOver = dragOverCol === col.status;
              const isAnotherDragging =
                draggedId !== null &&
                users.find((u) => u.id === draggedId)?.status !== col.status;

              return (
                <div
                  key={col.status}
                  className={cn(
                    "flex flex-col rounded-xl p-1.5 transition-all",
                    isDragOver
                      ? "bg-brand-soft ring-2 ring-brand/40"
                      : isAnotherDragging
                        ? "ring-2 ring-dashed ring-line/80"
                        : "ring-2 ring-transparent",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverCol !== col.status) setDragOverCol(col.status);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverCol((c) => (c === col.status ? null : c));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(col.status);
                  }}
                >
                  <div className="mb-2.5 flex items-center justify-between px-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.color}`} />
                      <span className="text-[12.5px] font-semibold text-text-primary">
                        {col.label}
                      </span>
                    </div>
                    <span className="text-[12px] font-medium text-text-secondary">
                      {(
                        col.count -
                        (initialCountByStatus.get(col.status) ?? 0) +
                        colUsers.length
                      ).toLocaleString("ru-RU")}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {colUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        selected={user.id === selectedId}
                        dragging={user.id === draggedId}
                        onClick={() => setSelectedId(user.id)}
                        onDragStart={(e) => {
                          setDraggedId(user.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", user.id);
                        }}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverCol(null);
                        }}
                      />
                    ))}

                    {isDragOver && (
                      <div className="rounded-xl border-2 border-dashed border-brand bg-brand-soft py-6 text-center text-[12px] font-medium text-brand">
                        Bu yerga tashlang
                      </div>
                    )}

                    <button className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2 text-[12px] font-medium text-text-muted transition-colors hover:border-line/80 hover:bg-bg-card/50 hover:text-text-secondary">
                      <Plus className="h-3.5 w-3.5" />
                      Karta qo'shish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedId(null)}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-xl border border-line bg-bg-panel px-4 py-3 text-[13px] font-medium text-text-primary shadow-panel">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-status-resolved" />
            Status o'zgartirildi: <span className="text-text-secondary">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
