import { useState } from "react";
import {
  X,
  Phone,
  Edit3,
  Bell,
  Ban,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import type { User } from "../types";
import { Avatar } from "./Avatar";
import { cn } from "../lib/utils";
import { statusLabels, statusBadgeClass } from "../data/users";

interface Props {
  user: User;
  onClose: () => void;
}

type Tab = "umumiy" | "bolalar" | "tolovlar" | "faollik";

export function UserDetailPanel({ user, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("umumiy");
  const [note, setNote] = useState("");

  const tabs: { id: Tab; label: string }[] = [
    { id: "umumiy", label: "Umumiy ma'lumot" },
    { id: "bolalar", label: `Bolalar (${user.children?.length ?? 0})` },
    { id: "tolovlar", label: "To'lovlar tarixi" },
    { id: "faollik", label: "Faollik tarixi" },
  ];

  return (
    <aside className="flex h-full w-[440px] shrink-0 flex-col border-l border-line bg-bg-panel">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div className="flex items-start gap-3.5">
          <Avatar name={user.avatar} size={52} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-semibold text-text-primary leading-tight">
                {user.name}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  statusBadgeClass[user.status],
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {statusLabels[user.status]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-secondary">
              <Phone className="h-3.5 w-3.5" />
              {user.phone}
            </div>
            <div className="mt-0.5 text-[11.5px] text-text-muted">
              Ro'yxatdan o'tgan sana: {user.registeredAt}
            </div>
            <div className="mt-0.5 text-[11.5px] text-text-muted">ID: #{user.id}</div>
          </div>
        </div>
        <button onClick={onClose} className="icon-btn">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-5 border-b border-line px-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative py-3 text-[13px] font-medium transition-colors",
              tab === t.id
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand rounded-t" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === "umumiy" && <UmumiyTab user={user} note={note} setNote={setNote} />}
        {tab === "bolalar" && <BolalarTab user={user} />}
        {tab === "tolovlar" && <TolovlarTab user={user} />}
        {tab === "faollik" && <FaollikTab user={user} />}
      </div>

      <div className="border-t border-line p-4">
        <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-text-muted">
          Amallar
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-[12.5px] font-medium text-brand transition-colors hover:bg-brand/20">
            <Edit3 className="h-4 w-4" /> Statusni o'zgartirish
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-status-progress/15 px-3 py-2 text-[12.5px] font-medium text-status-progress transition-colors hover:bg-status-progress/25">
            <Bell className="h-4 w-4" /> Ogohlantirish yuborish
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-status-blocked/15 px-3 py-2 text-[12.5px] font-medium text-status-blocked transition-colors hover:bg-status-blocked/25">
            <Ban className="h-4 w-4" /> Foydalanuvchini bloklash
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-bg-card px-3 py-2 text-[12.5px] font-medium text-text-primary transition-colors hover:bg-bg-hover">
            <PhoneCall className="h-4 w-4" /> Qo'ng'iroq qilish
          </button>
        </div>
      </div>
    </aside>
  );
}

function UmumiyTab({
  user,
  note,
  setNote,
}: {
  user: User;
  note: string;
  setNote: (v: string) => void;
}) {
  return (
    <div className="space-y-4 p-5">
      <div className="grid grid-cols-2 gap-3">
        <InfoCard title="Asosiy ma'lumotlar">
          <Row label="Ism familiya" value={user.name} />
          <Row label="Telefon raqami" value={user.phone} />
          <Row label="Email" value={user.email} />
          <Row label="Manzil" value={user.address} />
          <Row label="Jinsi" value={user.gender} />
          <Row label="Tug'ilgan sana" value={user.birthDate} />
          <Row label="Ro'yxatdan o'tgan sana" value={user.registeredAt} />
          <Row label="Oxirgi faollik" value={user.lastActivity} />
        </InfoCard>

        <InfoCard title="Hisob holati">
          <Row
            label="Bolani ulangan"
            value={
              <span className="flex items-center gap-1 text-status-resolved">
                <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                {user.childStatus === "ulangan" ? "Ha" : "Yo'q"}
              </span>
            }
          />
          <Row
            label="Premium holati"
            value={
              user.premiumStatus === "sotib_olgan"
                ? "Sotib olgan"
                : user.premiumStatus === "faol"
                  ? "Faol"
                  : "Sotib olmagan"
            }
          />
          <Row
            label="Premium obunasi tugashi"
            value={user.premiumExpiry ?? "-"}
          />
          {user.currentOperator && (
            <Row
              label="Joriy operator"
              value={
                <span className="flex items-center gap-1.5">
                  <Avatar name={user.currentOperator.name} size={18} />
                  {user.currentOperator.name}
                </span>
              }
            />
          )}
          {user.startedAt && <Row label="Boshlangan vaqt" value={user.startedAt} />}
          <Row label="Ro'yxatdan o'tgan sana" value={user.registeredAt} />
          <Row
            label="Joriy status"
            value={
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  statusBadgeClass[user.status],
                )}
              >
                {statusLabels[user.status]}
              </span>
            }
          />
        </InfoCard>
      </div>

      <div className="card p-4">
        <div className="mb-2 text-[12.5px] font-semibold text-text-primary">
          Operator izohi
        </div>
        {user.operatorNote && (
          <div className="mb-3 whitespace-pre-line rounded-lg border border-line bg-bg-input p-3 text-[12.5px] text-text-secondary">
            {user.operatorNote}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Izoh qo'shish..."
            className="input"
          />
          <button className="btn-primary px-4 whitespace-nowrap">Saqlash</button>
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[12.5px] font-semibold text-text-primary">
            Izohlar tarixi
          </div>
          <button className="text-[12px] text-text-secondary hover:text-text-primary">
            Barchasi ›
          </button>
        </div>
        <div className="space-y-3">
          {user.comments?.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.operatorAvatar} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-text-primary">
                      {c.operatorName}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10.5px] font-medium",
                        statusBadgeClass[c.status],
                      )}
                    >
                      {statusLabels[c.status]}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] text-text-muted">
                    {c.date}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-text-secondary">
                  {c.text}
                </p>
              </div>
            </div>
          ))}
          {!user.comments?.length && (
            <p className="text-[12.5px] text-text-muted">Izohlar mavjud emas</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BolalarTab({ user }: { user: User }) {
  return (
    <div className="p-5 space-y-3">
      {user.children?.length ? (
        user.children.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={c.name} size={40} />
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-text-primary">
                  {c.name}
                </div>
                <div className="text-[12px] text-text-secondary">
                  {c.age} yosh · {c.gender}
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[11px] font-medium",
                  c.connected
                    ? "bg-status-resolved/15 text-status-resolved"
                    : "bg-status-blocked/15 text-status-blocked",
                )}
              >
                {c.connected ? "Ulangan" : "Ulanmagan"}
              </span>
            </div>
            <div className="mt-3 border-t border-line pt-3 text-[12px] text-text-secondary">
              Qurilma: <span className="text-text-primary">{c.device}</span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-[13px] text-text-muted">Bolalar qo'shilmagan</p>
      )}
    </div>
  );
}

function TolovlarTab({ user }: { user: User }) {
  return (
    <div className="p-5 space-y-2">
      {user.payments?.length ? (
        user.payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-line bg-bg-card p-3"
          >
            <div>
              <div className="text-[13px] font-medium text-text-primary">
                {p.type}
              </div>
              <div className="text-[11.5px] text-text-muted">{p.date}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold text-text-primary">
                {p.amount.toLocaleString("ru-RU")} so'm
              </div>
              <div className="text-[11px] text-status-resolved">
                {p.status === "muvaffaqiyatli" ? "Muvaffaqiyatli" : p.status}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-[13px] text-text-muted">To'lovlar mavjud emas</p>
      )}
    </div>
  );
}

function FaollikTab({ user }: { user: User }) {
  return (
    <div className="p-5 space-y-2">
      {user.activity?.length ? (
        user.activity.map((a) => (
          <div key={a.id} className="rounded-lg border border-line bg-bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-medium text-text-primary">
                {a.description}
              </div>
              <div className="text-[11.5px] text-text-muted">{a.date}</div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-[13px] text-text-muted">Faollik tarixi bo'sh</p>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg-card p-3.5">
      <div className="mb-2.5 text-[12px] font-semibold text-text-primary">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[11.5px]">
      <span className="text-text-muted whitespace-nowrap">{label}</span>
      <span className="text-right font-medium text-text-primary">{value}</span>
    </div>
  );
}
