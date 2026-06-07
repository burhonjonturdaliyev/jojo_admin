import { useEffect, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import { ticketsApi, type AdminTicket } from "../lib/resources";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-status-progress/15 text-status-progress",
  open: "bg-status-progress/15 text-status-progress",
  in_progress: "bg-blue-500/15 text-blue-500",
  resolved: "bg-status-resolved/15 text-status-resolved",
  closed: "bg-text-muted/15 text-text-muted",
};

export function RequestsPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await ticketsApi.list({
        status: statusFilter || undefined,
        page_size: 100,
      });
      setItems(r.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [statusFilter]);

  const setStatus = async (id: number, status: string) => {
    await ticketsApi.updateStatus(id, status);
    void reload();
  };

  const filtered = items.filter(
    (it) =>
      !search.trim() ||
      it.subject.toLowerCase().includes(search.toLowerCase()) ||
      it.user?.phone?.includes(search) ||
      it.user?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.requests")}
        subtitle={`${items.length} ta murojaat`}
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mavzu yoki foydalanuvchi..."
                className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </div>
            {[
              { v: null, label: "Hammasi" },
              { v: "new", label: "Yangi" },
              { v: "in_progress", label: "Jarayonda" },
              { v: "resolved", label: "Hal qilindi" },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setStatusFilter(f.v)}
                className={
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                  (statusFilter === f.v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-bg-input text-text-secondary")
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {loading && (
            <div className="card p-8 text-center text-text-muted">
              Yuklanmoqda...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="card p-12 text-center text-text-muted">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Murojaatlar yo'q
            </div>
          )}
          {filtered.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex items-start gap-3">
                <Avatar
                  name={t.user?.name || t.user?.phone || "User"}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-text-primary">
                        {t.subject}
                      </div>
                      <div className="mt-0.5 text-[12px] text-text-secondary">
                        {t.user?.name || "—"} · {t.user?.phone || "—"}
                      </div>
                    </div>
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[11px] font-medium " +
                        (STATUS_COLORS[t.status] ||
                          "bg-text-muted/15 text-text-muted")
                      }
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] text-text-muted">
                      {new Date(t.created_at).toLocaleString("uz-UZ")}
                    </span>
                    <div className="ml-auto flex gap-1.5">
                      <select
                        value={t.status}
                        onChange={(e) => setStatus(t.id, e.target.value)}
                        className="rounded-lg border border-line bg-bg-input px-2 py-1 text-[11.5px] text-text-primary outline-none"
                      >
                        <option value="new">new</option>
                        <option value="in_progress">in_progress</option>
                        <option value="resolved">resolved</option>
                        <option value="closed">closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
