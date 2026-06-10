import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Ban,
  CheckCircle2,
  Crown,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import {
  subscriptionGiveApi,
  usersApi,
  type AdminUserRow,
} from "../lib/resources";

/**
 * Foydalanuvchilar (parents) ro'yxati. Backend `/admin/users/` dan
 * pagination + filter bilan o'qiydi. Suspend / activate orqali
 * `is_active`ni o'zgartirish mumkin.
 */
export function UsersPage() {
  const { t } = useT();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "blocked">(
    "all",
  );
  const [givingPremium, setGivingPremium] = useState<AdminUserRow | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await usersApi.list({
        q: search || undefined,
        is_active:
          activeFilter === "all" ? undefined : activeFilter === "active",
        role: "parent",
        page_size: 100,
      });
      setUsers(r.results);
    } catch (e) {
      console.error("users load", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [activeFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.phone?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const toggleActive = async (id: number) => {
    await usersApi.toggleActive(id);
    void reload();
  };

  const totalActive = users.filter((u) => u.is_active).length;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.users")}
        subtitle={`${users.length} ta foydalanuvchi (${totalActive} faol)`}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {/* Filter + search */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Telefon yoki ism bo'yicha qidirish..."
                className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>
            {(["all", "active", "blocked"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setActiveFilter(k)}
                className={
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                  (activeFilter === k
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-bg-input text-text-secondary hover:text-text-primary")
                }
              >
                {k === "all" ? "Hammasi" : k === "active" ? "Faol" : "Bloklangan"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card mt-4 overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Ota-ona</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Qurilma</th>
                <th className="px-4 py-3">Oxirgi faollik</th>
                <th className="px-4 py-3">Holati</th>
                <th className="px-4 py-3">Qo'shilgan</th>
                <th className="px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    <UsersIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Ota-onalar topilmadi
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-line/50 hover:bg-bg-hover"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.first_name || u.phone || u.username} size={32} />
                      <div>
                        <div className="font-medium text-text-primary">
                          {u.first_name || u.username || "—"}
                        </div>
                        <div className="text-[11px] text-text-muted">#{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">
                    {u.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.device_count != null && u.device_count > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[12px] text-text-secondary">
                          {u.last_device?.type === "ios" ? "iPhone" : "Android"}
                        </span>
                        <span className="text-[10.5px] text-text-muted">
                          ×{u.device_count}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-[12px]">
                    {u.last_login
                      ? new Date(u.last_login).toLocaleString("uz-UZ", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[11px] font-medium " +
                        (u.is_active
                          ? "bg-status-resolved/15 text-status-resolved"
                          : "bg-status-blocked/15 text-status-blocked")
                      }
                    >
                      {u.is_active ? "Faol" : "Bloklangan"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(u.date_joined).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setGivingPremium(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-[11.5px] font-medium text-amber-600 hover:bg-amber-500/25"
                        title="Premium obuna berish"
                      >
                        <Crown className="h-3.5 w-3.5" /> Premium
                      </button>
                      <button
                        onClick={() => toggleActive(u.id)}
                        className={
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium " +
                          (u.is_active
                            ? "bg-status-blocked/15 text-status-blocked hover:bg-status-blocked/25"
                            : "bg-status-resolved/15 text-status-resolved hover:bg-status-resolved/25")
                        }
                      >
                        {u.is_active ? (
                          <>
                            <Ban className="h-3.5 w-3.5" /> Bloklash
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Faollashtirish
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {givingPremium && (
        <GivePremiumModal
          user={givingPremium}
          onClose={() => setGivingPremium(null)}
          onDone={async () => {
            setGivingPremium(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

const DAY_PRESETS = [
  { days: 7, label: "7 kun" },
  { days: 30, label: "1 oy" },
  { days: 90, label: "3 oy" },
  { days: 180, label: "6 oy" },
  { days: 365, label: "1 yil" },
];

function GivePremiumModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUserRow;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [days, setDays] = useState<number>(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAlreadyPremium = user.is_premium === true;

  const give = async () => {
    if (busy) return;
    setError(null);
    setSuccess(null);
    if (!days || days < 1) {
      setError("Kun soni 1 dan kam bo'lmasligi kerak");
      return;
    }
    if (days > 3650) {
      setError("10 yildan ko'p bera olmaysiz");
      return;
    }
    setBusy(true);
    try {
      const r = await subscriptionGiveApi.give({ user_id: user.id, days });
      setSuccess(r.detail || `${days} kunlik premium berildi.`);
      // 1.2s ko'rsatib, modal'ni yopamiz
      setTimeout(() => {
        void onDone();
      }, 1200);
    } catch (e) {
      setError((e as { message?: string }).message || "Xato yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.phone ||
    "Foydalanuvchi";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-bg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15.5px] font-semibold text-text-primary">
                Premium berish
              </h3>
              <div className="text-[12px] text-text-secondary">
                {displayName} · {user.phone}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isAlreadyPremium && (
          <div className="mb-3 rounded-lg bg-blue-500/10 px-3 py-2 text-[11.5px] text-blue-500">
            Bu foydalanuvchida allaqachon aktiv premium bor. Yangi muddat
            tugashidan keyin qo'shiladi (uzaytirish).
          </div>
        )}

        <div className="mb-2 text-[12px] font-medium text-text-secondary">
          Muddat
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {DAY_PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={
                "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                (days === p.days
                  ? "border-amber-500 bg-amber-500/10 text-amber-600"
                  : "border-line bg-bg-input text-text-secondary hover:text-text-primary")
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mb-2 text-[11.5px] text-text-muted">
          Yoki o'zingiz kiriting (kun):
        </div>
        <input
          type="number"
          min={1}
          max={3650}
          value={days}
          onChange={(e) => setDays(Number(e.target.value) || 0)}
          className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] outline-none focus:border-primary"
        />

        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600">
            ✓ {success}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-secondary text-[12.5px]"
            disabled={busy}
          >
            Bekor
          </button>
          <button
            onClick={give}
            disabled={busy}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            <Crown className="h-3.5 w-3.5" />
            {busy ? "Berilmoqda..." : "Premium berish"}
          </button>
        </div>
      </div>
    </div>
  );
}
