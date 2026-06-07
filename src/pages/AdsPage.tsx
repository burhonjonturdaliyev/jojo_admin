import { Plus, Image as ImageIcon, MoreVertical } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";

const ads = [
  { title: "Yozgi chegirma 2024", status: "faol", impressions: 124500, clicks: 8420, ctr: "6.8%", endDate: "30.06.2024", color: "#3B82F6" },
  { title: "Premium 6 oy aksiya", status: "faol", impressions: 98200, clicks: 7240, ctr: "7.4%", endDate: "15.06.2024", color: "#8B5CF6" },
  { title: "Bola ulashga taklif", status: "pauza", impressions: 45100, clicks: 3120, ctr: "6.9%", endDate: "10.06.2024", color: "#F59E0B" },
  { title: "Yangi yil aksiyasi 2025", status: "tugagan", impressions: 234100, clicks: 18420, ctr: "7.9%", endDate: "01.01.2025", color: "#10B981" },
];

const statusCls = {
  faol: "bg-status-resolved/15 text-status-resolved",
  pauza: "bg-status-progress/15 text-status-progress",
  tugagan: "bg-text-muted/15 text-text-muted",
};

export function AdsPage() {
  const { t } = useT();
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.ads")}
        subtitle={t("ads.subtitle")}
        actions={
          <button className="btn-primary text-[12.5px]">
            <Plus className="h-4 w-4" /> {t("ads.new")}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-2 gap-4">
          {ads.map((ad) => (
            <div key={ad.title} className="card overflow-hidden">
              <div
                className="flex h-32 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${ad.color}, ${ad.color}88)`,
                }}
              >
                <ImageIcon className="h-10 w-10 text-white/40" strokeWidth={1.5} />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-primary">
                      {ad.title}
                    </h3>
                    <div className="mt-1 text-[11.5px] text-text-secondary">
                      {t("ads.endDate")}: {ad.endDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCls[ad.status as keyof typeof statusCls]}`}
                    >
                      {t(`ads.status.${ad.status}`)}
                    </span>
                    <button className="icon-btn h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                  <div>
                    <div className="text-[13px] font-bold text-text-primary">
                      {(ad.impressions / 1000).toFixed(1)}K
                    </div>
                    <div className="text-[10.5px] text-text-muted">{t("ads.impressions")}</div>
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text-primary">
                      {(ad.clicks / 1000).toFixed(1)}K
                    </div>
                    <div className="text-[10.5px] text-text-muted">{t("ads.clicks")}</div>
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-status-resolved">
                      {ad.ctr}
                    </div>
                    <div className="text-[10.5px] text-text-muted">CTR</div>
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
