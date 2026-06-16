import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import { paymentsApi, unwrapList, type AdminPayment } from "../lib/resources";

const STATUS_COLORS: Record<string, string> = {
  succeeded: "bg-status-resolved/15 text-status-resolved",
  pending: "bg-status-progress/15 text-status-progress",
  failed: "bg-status-blocked/15 text-status-blocked",
  cancelled: "bg-text-muted/15 text-text-muted",
};

export function PaymentsPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    paymentsApi
      .list({ status: filter || undefined })
      .then((raw) => setItems(unwrapList(raw)))
      .catch((e) => console.error("payments load", e))
      .finally(() => setLoading(false));
  }, [filter]);

  const totalAmount = items.reduce((s, p) => s + (p.amount_uzs ?? 0), 0);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.payments")}
        subtitle={t("payments.subtitle", {
          count: items.length,
          total: totalAmount.toLocaleString("uz-UZ").replace(/,/g, " "),
        })}
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card p-4">
          <div className="flex gap-2">
            {[
              { v: null, label: t("payments.filter.all") },
              { v: "succeeded", label: t("payments.filter.succeeded") },
              { v: "pending", label: t("payments.filter.pending") },
              { v: "failed", label: t("payments.filter.failed") },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f.v)}
                className={
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium " +
                  (filter === f.v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line bg-bg-input text-text-secondary")
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card mt-4 overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">{t("payments.col.user")}</th>
                <th className="px-4 py-3">{t("payments.col.plan")}</th>
                <th className="px-4 py-3">{t("payments.col.amount")}</th>
                <th className="px-4 py-3">{t("payments.col.status")}</th>
                <th className="px-4 py-3">{t("payments.col.method")}</th>
                <th className="px-4 py-3">{t("payments.col.date")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <Wallet className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    {t("payments.empty")}
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p.id} className="border-b border-line/50 hover:bg-bg-hover">
                  <td className="px-4 py-3 font-mono text-[11.5px] text-text-muted">
                    #{p.id}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.user?.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.plan?.name || "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {(p.amount_uzs ?? 0).toLocaleString("uz-UZ").replace(/,/g, " ")} {t("common.sum")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-[11px] font-medium " +
                        (STATUS_COLORS[p.status] ||
                          "bg-text-muted/15 text-text-muted")
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.payment_method || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(p.created_at).toLocaleDateString("uz-UZ")}
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
