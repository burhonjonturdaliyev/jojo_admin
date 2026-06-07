import { useEffect, useState } from "react";
import { Ban, UserCheck, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import { usersApi, type AdminUserRow } from "../lib/resources";

export function BlockedPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const r = await usersApi.list({ is_active: false, page_size: 100 });
      setItems(r.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const unblock = async (id: number) => {
    await usersApi.toggleActive(id);
    void reload();
  };

  const filtered = items.filter(
    (u) =>
      !search.trim() ||
      [u.phone, u.first_name, u.username]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.blocked")}
        subtitle={`${items.length} ta bloklangan foydalanuvchi`}
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="card mt-4 overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Foydalanuvchi</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Bloklangan sana</th>
                <th className="px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-text-muted">
                    <Ban className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Bloklangan foydalanuvchi yo'q
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-line/50 hover:bg-bg-hover">
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
                  <td className="px-4 py-3 font-mono text-text-secondary">
                    {u.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(u.date_joined).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => unblock(u.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-status-resolved/15 px-2.5 py-1.5 text-[11.5px] font-medium text-status-resolved hover:bg-status-resolved/25"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Blokdan chiqarish
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
