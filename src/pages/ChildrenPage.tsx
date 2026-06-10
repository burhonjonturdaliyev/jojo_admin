import { useEffect, useState } from "react";
import { Baby, CircleUser, User as UserIcon } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import { childrenApi, type AdminChild } from "../lib/resources";

export function ChildrenPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    childrenApi
      .list({ page_size: 100 })
      .then((r) => setItems(r.results))
      .catch((e) => console.error("children load", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.children")}
        subtitle={`${items.length} ta bola tizimda`}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Bola</th>
                <th className="px-4 py-3">Ota-ona</th>
                <th className="px-4 py-3">Yosh</th>
                <th className="px-4 py-3">Jins</th>
                <th className="px-4 py-3">Til</th>
                <th className="px-4 py-3">Holati</th>
                <th className="px-4 py-3">Ulangan</th>
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
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <Baby className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Bolalar topilmadi
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="border-b border-line/50 hover:bg-bg-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
                        <CircleUser className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">
                          {c.first_name || c.username || "—"}
                        </div>
                        <div className="text-[11px] text-text-muted">#{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.parent ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/15 text-blue-500">
                          <UserIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="leading-tight">
                          <div className="text-[12.5px] font-medium text-text-primary">
                            {c.parent.full_name || c.parent.first_name || "—"}
                          </div>
                          <div className="text-[11px] text-text-muted font-mono">
                            {c.parent.phone}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11.5px] text-text-muted italic">
                        — bog'lanmagan —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.age ?? "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.gender || "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.language || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-status-resolved/15 px-2.5 py-1 text-[11px] font-medium text-status-resolved">
                      {c.child_status || (c.is_active ? "active" : "inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(c.date_joined).toLocaleDateString("uz-UZ")}
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
