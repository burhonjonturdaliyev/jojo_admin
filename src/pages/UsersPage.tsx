import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Ban,
  CheckCircle2,
  Crown,
  Users as UsersIcon,
  X,
  Pencil,
  Trash2,
  Save,
  Baby,
} from "lucide-react";
import { Link } from "react-router-dom";
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
  const [editing, setEditing] = useState<AdminUserRow | null>(null);

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

  const displayName = (u: AdminUserRow): string => {
    if (u.full_name?.trim()) return u.full_name.trim();
    const fl = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    if (fl) return fl;
    return u.username || u.phone || `#${u.id}`;
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.phone?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const toggleActive = async (id: number) => {
    await usersApi.toggleActive(id);
    void reload();
  };

  const remove = async (u: AdminUserRow) => {
    const name = displayName(u);
    if (!confirm(t("users.confirmDelete", { name }))) return;
    try {
      await usersApi.remove(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
    }
  };

  const totalActive = users.filter((u) => u.is_active).length;
  const totalPremium = users.filter((u) => u.premium_active).length;

  const fmtExpiry = (iso?: string | null): string => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.users")}
        subtitle={`${users.length} ta foydalanuvchi · ${totalActive} faol · ${totalPremium} premium`}
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
                placeholder={t("users.search.placeholder")}
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
                {k === "all" ? t("users.filter.all") : k === "active" ? t("users.filter.active") : t("users.filter.blocked")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card mt-4 overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">{t("users.col.parent")}</th>
                <th className="px-4 py-3">{t("users.col.children")}</th>
                <th className="px-4 py-3">{t("users.col.phone")}</th>
                <th className="px-4 py-3">{t("users.col.device")}</th>
                <th className="px-4 py-3">{t("users.col.lastActivity")}</th>
                <th className="px-4 py-3">{t("users.col.status")}</th>
                <th className="px-4 py-3">{t("users.col.joined")}</th>
                <th className="px-4 py-3 text-right">{t("users.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                    <UsersIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    {t("users.empty.parents")}
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
                      <Avatar name={displayName(u)} size={32} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium text-text-primary">
                          <span className="truncate">{displayName(u)}</span>
                          {u.premium_active ? (
                            <span
                              title={
                                u.premium_expires_at
                                  ? `Premium · tugaydi: ${fmtExpiry(u.premium_expires_at)}`
                                  : "Premium · muddatsiz"
                              }
                              className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600"
                            >
                              <Crown className="h-3 w-3" /> Premium
                            </span>
                          ) : null}
                        </div>
                        {u.premium_active && (
                          <div className="text-[10.5px] text-amber-600/90 leading-tight">
                            {u.premium_expires_at
                              ? u.premium_days_left != null
                                ? `${u.premium_days_left} kun qoldi · ${fmtExpiry(u.premium_expires_at)}`
                                : fmtExpiry(u.premium_expires_at)
                              : "Muddatsiz"}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.children && u.children.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.children.map((c) => (
                          <Link
                            key={c.id}
                            to={`/children?parent=${u.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-500 hover:bg-blue-500/20"
                          >
                            <Baby className="h-3 w-3" />
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11.5px] text-text-muted italic">Yo'q</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">
                    {u.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.device_count != null && u.device_count > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[12px] text-text-secondary">
                            {(u.last_device?.brand || u.last_device?.model)
                              ? `${u.last_device?.brand ?? ""} ${u.last_device?.model ?? ""}`.trim()
                              : (u.last_device?.type === "ios" ? "iPhone" : "Android")}
                          </span>
                          {u.device_count > 1 && (
                            <span className="text-[10.5px] text-text-muted">×{u.device_count}</span>
                          )}
                        </div>
                        {u.last_device?.os_version && (
                          <span className="text-[10.5px] text-text-muted">
                            {u.last_device.type === "ios" ? "iOS" : "Android"} {u.last_device.os_version}
                          </span>
                        )}
                        {u.last_device?.app_version && (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500 w-fit"
                            title="Ilova versiyasi"
                          >
                            Jojo v{u.last_device.app_version}
                          </span>
                        )}
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
                      {u.is_active ? t("users.filter.active") : t("users.filter.blocked")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-[12px]">
                    {(() => {
                      const d = new Date(u.date_joined);
                      return (
                        <div className="flex flex-col leading-tight">
                          <span>
                            {d.toLocaleDateString("uz-UZ", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10.5px] text-text-muted">
                            {d.toLocaleTimeString("uz-UZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setGivingPremium(u)}
                        className={
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium " +
                          (u.premium_active
                            ? "border border-amber-500/40 bg-amber-500/5 text-amber-600 hover:bg-amber-500/15"
                            : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25")
                        }
                        title={
                          u.premium_active
                            ? "Premium muddatini uzaytirish"
                            : "Premium obuna berish"
                        }
                      >
                        <Crown className="h-3.5 w-3.5" />
                        {u.premium_active ? "Uzaytirish" : "Premium"}
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
                            <Ban className="h-3.5 w-3.5" /> {t("users.action.block")}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t("users.action.activate")}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditing(u)}
                        className="icon-btn h-7 w-7"
                        title={t("users.action.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(u)}
                        className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                        title={t("users.action.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
      {editing && (
        <UserEditor
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === saved.id ? { ...u, ...saved } : u)),
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function UserEditor({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUserRow;
  onClose: () => void;
  onSaved: (u: AdminUserRow) => void;
}) {
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [username, setUsername] = useState(user.username || "");
  const [age, setAge] = useState<string>(user.age != null ? String(user.age) : "");
  const [gender, setGender] = useState(user.gender || "");
  const [language, setLanguage] = useState(user.language || "uz");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await usersApi.update(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        username: username.trim(),
        age: age.trim() === "" ? null : Number(age),
        gender: gender.trim(),
        language: language.trim(),
      });
      onSaved(r);
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            Foydalanuvchini tahrirlash
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">Ism</div>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">Familiya</div>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">Telefon</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">Username</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">Yosh</div>
              <input
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">Jinsi</div>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              >
                <option value="">—</option>
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
              </select>
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">Til</div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              >
                <option value="uz">UZ</option>
                <option value="ru">RU</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            Bekor
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
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

  const isAlreadyPremium = user.premium_active === true;

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
