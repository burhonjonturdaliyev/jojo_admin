import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Ban,
  CheckCircle2,
  Users as UsersIcon,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import { usersApi, type AdminUserRow } from "../lib/resources";

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
                <th className="px-4 py-3">Foydalanuvchi</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Til</th>
                <th className="px-4 py-3">Holati</th>
                <th className="px-4 py-3">Qo'shilgan</th>
                <th className="px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    <UsersIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Foydalanuvchilar topilmadi
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
                  <td className="px-4 py-3 text-text-secondary">{u.language || "—"}</td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
