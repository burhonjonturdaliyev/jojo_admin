import { useEffect, useMemo, useRef, useState } from "react";
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
  X,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { UserCard } from "../components/UserCard";
import { UserDetailPanel } from "../components/UserDetailPanel";
import { statusColumns, users as initialUsers } from "../data/users";
import type { User, UserStatus } from "../types";
import { cn } from "../lib/utils";
import { useT } from "../lib/i18n";

export function UsersPage() {
  const { t } = useT();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedId, setSelectedId] = useState<string | null>("USR-00012345");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<UserStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [addingInCol, setAddingInCol] = useState<UserStatus | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const newNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingInCol) newNameRef.current?.focus();
  }, [addingInCol]);

  const openAddForm = (status: UserStatus) => {
    setAddingInCol(status);
    setNewName("");
    setNewPhone("");
  };

  const closeAddForm = () => {
    setAddingInCol(null);
    setNewName("");
    setNewPhone("");
  };

  const handleCreateUser = (status: UserStatus) => {
    const name = newName.trim();
    const phone = newPhone.trim();
    if (!name) return;

    const today = new Date()
      .toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".");

    const newUser: User = {
      id: `USR-${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
      name,
      phone: phone || "—",
      email: "",
      address: "",
      gender: "Erkak",
      birthDate: "—",
      avatar: name,
      status,
      childStatus: "ulanmagan",
      premiumStatus: "sotib_olmagan",
      registeredAt: today,
      lastActivity: "hozir",
      cardTimestamp: "hozir",
      commentsCount: 0,
    };

    setUsers((prev) => [newUser, ...prev]);
    setSelectedId(newUser.id);
    setToast(t("users.toastCreated", { status: t(`userStatus.${status}`) }));
    setTimeout(() => setToast(null), 2400);
    closeAddForm();
  };

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
      `${user.name} → ${t(`userStatus.${status}`)}`,
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
              {t("nav.users")}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-text-secondary">
              {t("users.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="btn-secondary text-[12.5px]">
              <Calendar className="h-4 w-4" />
              01.05.2024 - 31.05.2024
            </button>
            <button className="btn-secondary text-[12.5px]">
              <Download className="h-4 w-4" />
              {t("common.export")}
            </button>
            <button className="btn-secondary text-[12.5px]">
              <Filter className="h-4 w-4" />
              {t("common.filter")}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button className="btn-primary text-[12.5px]">
              <Plus className="h-4 w-4" />
              {t("users.newUser")}
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto scrollbar-thin px-7 py-5">
         <div className="min-w-[1500px]">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            <StatCard
              label={t("users.stat.total")}
              value="12,456"
              delta="12.5%"
              icon={UsersIcon}
              iconColor="#3B82F6"
              iconBg="rgba(59,130,246,0.15)"
            />
            <StatCard
              label={t("users.stat.connected")}
              value="8,325"
              delta="10.2%"
              icon={UserCheck}
              iconColor="#10B981"
              iconBg="rgba(16,185,129,0.15)"
            />
            <StatCard
              label={t("users.stat.premium")}
              value="3,682"
              delta="8.4%"
              icon={Crown}
              iconColor="#8B5CF6"
              iconBg="rgba(139,92,246,0.15)"
            />
            <StatCard
              label={t("users.stat.revenue")}
              value="120,450,000"
              delta="15.3%"
              icon={Wallet}
              iconColor="#F59E0B"
              iconBg="rgba(245,158,11,0.15)"
            />
            <StatCard
              label={t("users.stat.blocked")}
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
                        {t(`userStatus.${col.status}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-text-secondary">
                        {(
                          col.count -
                          (initialCountByStatus.get(col.status) ?? 0) +
                          colUsers.length
                        ).toLocaleString("ru-RU")}
                      </span>
                      <button
                        type="button"
                        title={t("users.addCard")}
                        aria-label={t("users.addCard")}
                        onClick={() =>
                          addingInCol === col.status
                            ? closeAddForm()
                            : openAddForm(col.status)
                        }
                        className={cn(
                          "group/add flex h-6 w-6 items-center justify-center rounded-md border shadow-sm transition-all duration-150 active:scale-95",
                          addingInCol === col.status
                            ? "border-brand/60 bg-brand-soft text-brand"
                            : "border-line bg-bg-card text-text-secondary hover:border-brand/50 hover:bg-brand-soft hover:text-brand hover:shadow-md hover:shadow-brand/20",
                        )}
                      >
                        <Plus
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-150",
                            addingInCol === col.status
                              ? "rotate-45"
                              : "group-hover/add:rotate-90",
                          )}
                          strokeWidth={2.4}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {addingInCol === col.status && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCreateUser(col.status);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") closeAddForm();
                        }}
                        className="rounded-xl border border-brand/40 bg-bg-card p-2.5 shadow-md shadow-brand/10"
                      >
                        <input
                          ref={newNameRef}
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder={t("users.fullName")}
                          className="w-full rounded-md border border-line bg-bg-input px-2.5 py-1.5 text-[12.5px] text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
                        />
                        <input
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder={t("users.phonePlaceholder")}
                          inputMode="tel"
                          className="mt-1.5 w-full rounded-md border border-line bg-bg-input px-2.5 py-1.5 text-[12.5px] text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
                        />
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="submit"
                            disabled={!newName.trim()}
                            className="flex-1 rounded-md bg-brand px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t("common.add")}
                          </button>
                          <button
                            type="button"
                            onClick={closeAddForm}
                            aria-label={t("common.cancel")}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </form>
                    )}

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
                        {t("users.dropHere")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
            <span className="text-text-secondary">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
