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
  Eye,
  Smartphone,
  CreditCard,
  Phone as PhoneIcon,
  Calendar,
  Globe,
  Gift,
  Send,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import {
  subscriptionGiveApi,
  usersApi,
  type AdminUserRow,
  type AdminUserFull,
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
  const [viewing, setViewing] = useState<AdminUserRow | null>(null);

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
                <th className="px-4 py-3">Til</th>
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
                  <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
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
                    {(() => {
                      const raw = (u.language || "").toLowerCase();
                      let code = "";
                      let flag = "";
                      let name = "";
                      let label = "";
                      if (raw.startsWith("uz")) {
                        flag = "🇺🇿";
                        if (raw.includes("cyr")) {
                          code = "uz_cyrl";
                          name = "Ўзбек кирилл";
                          label = "UZ-Cyr";
                        } else {
                          code = "uz_latn";
                          name = "O'zbek lotin";
                          label = "UZ";
                        }
                      } else if (raw.startsWith("ru")) {
                        code = "ru";
                        flag = "🇷🇺";
                        name = "Русский";
                        label = "RU";
                      } else if (raw.startsWith("en")) {
                        code = "en";
                        flag = "🇬🇧";
                        name = "English";
                        label = "EN";
                      }
                      return code ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md bg-bg-input px-2 py-0.5 text-[11.5px] font-medium text-text-secondary"
                          title={name}
                        >
                          <span>{flag}</span>
                          <span>{label}</span>
                        </span>
                      ) : (
                        <span className="text-[12px] text-text-muted">—</span>
                      );
                    })()}
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
                        onClick={() => setViewing(u)}
                        className="icon-btn h-7 w-7"
                        title="Foydalanuvchi ma'lumotlari"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
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
      {viewing && (
        <ParentInfoModal
          userId={viewing.id}
          onClose={() => setViewing(null)}
          onGivePremium={() => {
            setGivingPremium(viewing);
            setViewing(null);
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

function ParentInfoModal({
  userId,
  onClose,
  onGivePremium,
}: {
  userId: number;
  onClose: () => void;
  onGivePremium: () => void;
}) {
  const [data, setData] = useState<AdminUserFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    usersApi
      .full(userId)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e) => {
        if (!cancelled)
          setError((e as { message?: string }).message || "Xato");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return (
        d.toLocaleDateString("uz-UZ", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return iso;
    }
  };

  const langName = (code?: string) => {
    const c = (code || "").toLowerCase();
    if (c.includes("cyr")) return "Ўзбек кирилл";
    if (c.startsWith("uz")) return "O'zbek lotin";
    if (c.startsWith("ru")) return "Русский";
    if (c.startsWith("en")) return "English";
    return "—";
  };

  const u = data?.user;
  const name =
    u?.full_name?.trim() ||
    [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
    u?.username ||
    u?.phone ||
    `#${userId}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-bg h-full overflow-y-auto scrollbar-thin shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={name} size={36} />
            <div>
              <div className="text-[15px] font-semibold text-text-primary">
                {name}
              </div>
              <div className="text-[11.5px] text-text-muted">
                Foydalanuvchi · #{userId}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="p-8 text-center text-text-muted text-[13px]">
            Yuklanmoqda...
          </div>
        )}
        {error && (
          <div className="m-5 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
            {error}
          </div>
        )}

        {data && u && (
          <div className="space-y-4 p-5">
            <div className="card p-4">
              <div className="text-[12px] font-semibold text-text-secondary mb-3">
                Profil
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <InfoRow icon={<PhoneIcon className="h-3.5 w-3.5" />} label="Telefon" value={u.phone || "—"} mono />
                <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="Til" value={langName(u.language)} />
                <InfoRow icon={<UsersIcon className="h-3.5 w-3.5" />} label="Jinsi" value={u.gender === "male" ? "Erkak" : u.gender === "female" ? "Ayol" : "—"} />
                <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Qo'shilgan" value={fmtDate(u.date_joined)} />
                <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Oxirgi faollik" value={fmtDate(u.last_login)} />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-500" /> Premium statusi
                </div>
                <button
                  onClick={onGivePremium}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11.5px] font-medium text-amber-600 hover:bg-amber-500/25"
                >
                  <Gift className="h-3 w-3" />
                  {u.premium_active ? "Uzaytirish" : "Premium berish"}
                </button>
              </div>
              {u.premium_active ? (
                <div className="space-y-1 text-[12.5px]">
                  <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <Sparkles className="h-3.5 w-3.5" /> Aktiv premium
                  </div>
                  <div className="text-text-secondary">
                    Tugaydi: <span className="font-medium text-text-primary">{fmtDate(u.premium_expires_at)}</span>
                  </div>
                  {u.premium_days_left != null && (
                    <div className="text-text-secondary">
                      Qolgan kun: <span className="font-medium text-text-primary">{u.premium_days_left}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[12.5px] text-text-muted">Premium faol emas</div>
              )}
            </div>

            <div className="card p-4">
              <div className="text-[12px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                <Baby className="h-3.5 w-3.5" /> Farzandlar ({data.children.length})
              </div>
              {data.children.length === 0 ? (
                <div className="text-[12px] text-text-muted italic">Farzandlar yo'q</div>
              ) : (
                <div className="space-y-2">
                  {data.children.map((c) => (
                    <Link
                      key={c.id}
                      to={`/children?parent=${userId}`}
                      className="flex items-center gap-3 rounded-lg bg-bg-input px-3 py-2 hover:bg-bg-hover"
                    >
                      <Avatar name={c.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-text-primary truncate">{c.name}</div>
                        <div className="text-[11px] text-text-muted">
                          {c.age != null ? `${c.age} yosh` : "—"}
                          {c.gender === "male" ? " · Erkak" : c.gender === "female" ? " · Ayol" : ""}
                          {c.status === "active" ? " · Faol" : ""}
                        </div>
                      </div>
                      {c.phone && (
                        <div className="text-[11px] text-text-muted font-mono">{c.phone}</div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="text-[12px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Qurilmalar ({data.devices.length})
              </div>
              {data.devices.length === 0 ? (
                <div className="text-[12px] text-text-muted italic">Qurilmalar yo'q</div>
              ) : (
                <div className="space-y-2">
                  {data.devices.map((d) => (
                    <div key={d.id} className="rounded-lg bg-bg-input px-3 py-2 text-[12px]">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-text-primary">
                          {(d.brand || d.model)
                            ? `${d.brand ?? ""} ${d.model ?? ""}`.trim()
                            : d.type === "ios"
                              ? "iPhone"
                              : "Android"}
                        </div>
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                            (d.is_active
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-text-muted/15 text-text-muted")
                          }
                        >
                          {d.is_active ? "Faol" : "Nofaol"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-text-muted">
                        {d.os_version && (
                          <span>
                            {d.type === "ios" ? "iOS" : "Android"} {d.os_version}
                          </span>
                        )}
                        {d.app_version && (
                          <span className="text-blue-500 font-medium">Jojo v{d.app_version}</span>
                        )}
                        {d.last_login_at && <span>· Login: {fmtDate(d.last_login_at)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="text-[12px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> To'lovlar ({data.payments.length})
              </div>
              {data.payments.length === 0 ? (
                <div className="text-[12px] text-text-muted italic">To'lovlar yo'q</div>
              ) : (
                <div className="space-y-1.5">
                  {data.payments.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-bg-input px-3 py-2 text-[12px]">
                      <div>
                        <div className="font-medium text-text-primary">
                          {p.amount.toLocaleString("uz-UZ")} {p.currency}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {p.plan_name || "—"} · {fmtDate(p.created_at)}
                        </div>
                      </div>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                          (p.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-500"
                            : p.status === "pending"
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-red-500/15 text-red-500")
                        }
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1 text-[10.5px] text-text-muted">
        {icon}
        {label}
      </div>
      <div className={"text-text-primary truncate" + (mono ? " font-mono" : "")}>{value}</div>
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

type PremiumMode = "auto" | "offer";

function GivePremiumModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUserRow;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [mode, setMode] = useState<PremiumMode>("auto");
  const [days, setDays] = useState<number>(30);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(true);
  const [notifTitle, setNotifTitle] = useState<string>("");
  const [notifMessage, setNotifMessage] = useState<string>("");

  // Offer rejimi uchun
  const [discount, setDiscount] = useState<number>(30);
  const [originalPrice, setOriginalPrice] = useState<number>(50000);
  const [offerHours, setOfferHours] = useState<number>(72);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAlreadyPremium = user.premium_active === true;

  const finalPrice = Math.max(
    0,
    Math.round(originalPrice * (1 - Math.min(99, Math.max(0, discount)) / 100)),
  );

  // Default notification matnlarini rejimga qarab yangilash
  useEffect(() => {
    if (mode === "auto") {
      if (!notifTitle) setNotifTitle("Premium aktivlashdi");
      if (!notifMessage)
        setNotifMessage(`Sizga ${days} kunlik premium obuna berildi.`);
    } else {
      if (!notifTitle) setNotifTitle("Premium taklif");
      if (!notifMessage)
        setNotifMessage(
          `Sizga ${days} kunlik premium ${discount ? discount + "% chegirma bilan " : ""}taklif qilinmoqda.`,
        );
    }
    // intentional: faqat mode/days/discount o'zgarsa default'larni
    // qaytadan generatsiya qilish kerak emas — user yozgan matn ustun.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const validate = (): string | null => {
    if (!days || days < 1) return "Kun soni 1 dan kam bo'lmasligi kerak";
    if (days > 3650) return "10 yildan ko'p bera olmaysiz";
    if (mode === "offer") {
      if (originalPrice < 0) return "Asl narx manfiy bo'la olmaydi";
      if (offerHours < 1) return "Taklif amal qilish vaqti 1 soatdan kam bo'la olmaydi";
    }
    return null;
  };

  const submit = async () => {
    if (busy) return;
    setError(null);
    setSuccess(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    try {
      if (mode === "auto") {
        await subscriptionGiveApi.giveWithNotification({
          user_id: user.id,
          days,
          title: notifEnabled ? notifTitle.trim() : undefined,
          message: notifEnabled ? notifMessage.trim() : undefined,
          send_notification: notifEnabled,
        });
        setSuccess(`${days} kunlik premium berildi.`);
      } else {
        await subscriptionGiveApi.sendOffer({
          user_id: user.id,
          days,
          discount_percent: discount,
          original_price: originalPrice,
          final_price: finalPrice,
          currency: "UZS",
          title: notifTitle.trim() || "Premium taklif",
          message: notifMessage.trim(),
          expires_in_hours: offerHours,
        });
        setSuccess("Taklif yuborildi. Foydalanuvchi qabul qilganda premium aktivlanadi.");
      }
      setTimeout(() => {
        void onDone();
      }, 1300);
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
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin rounded-2xl bg-bg p-5"
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

        {/* Rejim tanlash */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("auto")}
            className={
              "rounded-xl border p-3 text-left transition " +
              (mode === "auto"
                ? "border-amber-500 bg-amber-500/10"
                : "border-line bg-bg-input hover:border-amber-500/40")
            }
          >
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-primary">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Avtomatik premium
            </div>
            <div className="mt-1 text-[10.5px] text-text-muted leading-tight">
              Darhol aktivlanadi. Push xabar yuboriladi.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode("offer")}
            className={
              "rounded-xl border p-3 text-left transition " +
              (mode === "offer"
                ? "border-amber-500 bg-amber-500/10"
                : "border-line bg-bg-input hover:border-amber-500/40")
            }
          >
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-primary">
              <Send className="h-3.5 w-3.5 text-amber-600" /> Taklif (chegirma)
            </div>
            <div className="mt-1 text-[10.5px] text-text-muted leading-tight">
              Taklif yuboramiz, qabul qilsa aktivlashadi.
            </div>
          </button>
        </div>

        {isAlreadyPremium && mode === "auto" && (
          <div className="mb-3 rounded-lg bg-blue-500/10 px-3 py-2 text-[11.5px] text-blue-500">
            Bu foydalanuvchida allaqachon aktiv premium bor. Yangi muddat tugashidan keyin qo'shiladi.
          </div>
        )}

        <div className="mb-2 text-[12px] font-medium text-text-secondary">Muddat</div>
        <div className="mb-2 flex flex-wrap gap-1.5">
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
        <input
          type="number"
          min={1}
          max={3650}
          value={days}
          onChange={(e) => setDays(Number(e.target.value) || 0)}
          placeholder="Kun soni"
          className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] outline-none focus:border-primary"
        />

        {/* Offer rejimi maydonlari */}
        {mode === "offer" && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-3">
            <div className="text-[11.5px] font-semibold text-amber-600 flex items-center gap-1">
              <Gift className="h-3 w-3" /> Chegirma sozlamalari
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-[10.5px] text-text-secondary mb-1">Asl narx (UZS)</div>
                <input
                  type="number"
                  min={0}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary"
                />
              </div>
              <div>
                <div className="text-[10.5px] text-text-secondary mb-1">Chegirma %</div>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
                  className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary"
                />
              </div>
              <div>
                <div className="text-[10.5px] text-text-secondary mb-1">Yakuniy</div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[12.5px] font-semibold text-amber-600">
                  {finalPrice.toLocaleString("uz-UZ")}
                </div>
              </div>
            </div>
            <div>
              <div className="text-[10.5px] text-text-secondary mb-1">Taklif amal qilish vaqti (soat)</div>
              <input
                type="number"
                min={1}
                max={720}
                value={offerHours}
                onChange={(e) => setOfferHours(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary"
              />
              <div className="mt-0.5 text-[10px] text-text-muted">
                Bu vaqt davomida foydalanuvchi qabul qilmasa, taklif bekor bo'ladi.
              </div>
            </div>
          </div>
        )}

        {/* Notification matni */}
        <div className="mt-4 rounded-xl border border-line bg-bg-input/30 p-3 space-y-2">
          <label className="flex items-center gap-2 text-[12px] font-medium text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={mode === "offer" ? true : notifEnabled}
              disabled={mode === "offer"}
              onChange={(e) => setNotifEnabled(e.target.checked)}
            />
            <Send className="h-3 w-3" />
            {mode === "offer"
              ? "Notification matni (majburiy — taklif xabarini foydalanuvchi shu yerda ko'radi)"
              : "Notification yuborish"}
          </label>
          {(notifEnabled || mode === "offer") && (
            <>
              <input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Sarlavha"
                className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary"
              />
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Xabar matni"
                rows={2}
                className="w-full rounded-lg border border-line bg-bg-input px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary resize-none"
              />
            </>
          )}
        </div>

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
          <button onClick={onClose} className="btn-secondary text-[12.5px]" disabled={busy}>
            Bekor
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {mode === "auto" ? <Crown className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
            {busy
              ? mode === "auto"
                ? "Berilmoqda..."
                : "Yuborilmoqda..."
              : mode === "auto"
                ? "Premium berish"
                : "Taklif yuborish"}
          </button>
        </div>
      </div>
    </div>
  );
}
