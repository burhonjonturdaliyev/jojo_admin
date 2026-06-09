import { useState } from "react";
import {
  Gamepad2,
  Video,
  BookOpen,
  Music,
  Sparkles,
  Plus,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";

type Tab = "games" | "videos" | "books" | "audio";

const TABS: Array<{ key: Tab; label: string; icon: typeof Gamepad2; color: string }> = [
  { key: "games", label: "O'yinlar", icon: Gamepad2, color: "#F59E0B" },
  { key: "videos", label: "Videolar", icon: Video, color: "#EF4444" },
  { key: "books", label: "Kitoblar", icon: BookOpen, color: "#3B82F6" },
  { key: "audio", label: "Audio", icon: Music, color: "#8B5CF6" },
];

export function KidsContentPage() {
  const [tab, setTab] = useState<Tab>("games");

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Kids kontent"
        subtitle="Bolalar uchun o'yinlar, videolar, kitoblar va audio"
        actions={
          <button className="btn-primary text-[12.5px]">
            <Plus className="h-4 w-4" /> Yangi kontent
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {/* Tabs */}
        <div className="card p-2 inline-flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const selected = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium transition-all " +
                  (selected
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-bg-hover")
                }
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Placeholder content area */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlaceholderCard key={i} tab={tab} index={i} />
          ))}
        </div>

        {/* Coming-soon banner */}
        <div className="mt-6 card p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-500/20">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15">
              <Sparkles className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-text-primary mb-1">
                Yaqinda ishga tushadi
              </h3>
              <p className="text-[13px] text-text-secondary mb-3">
                Kids ilovasidagi o'yinlar, videolar, kitoblar va audio kontent
                bilan to'liq integratsiya. Hozir kontent qo'shish uchun
                backend tomondan endpoint kerak — keyingi sprint'da qo'shiladi.
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  GameCategory + GameItem CRUD
                </li>
                <li className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Bola yoshiga qarab filtrlash
                </li>
                <li className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  YouTube video va audio fayl yuklash
                </li>
                <li className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Statistika: eng ko'p ochilgan kontent
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderCard({ tab, index }: { tab: Tab; index: number }) {
  const t = TABS.find((x) => x.key === tab)!;
  const Icon = t.icon;
  return (
    <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div
        className="h-32 rounded-xl mb-3 flex items-center justify-center"
        style={{ backgroundColor: t.color + "15" }}
      >
        <Icon className="h-12 w-12 opacity-30" style={{ color: t.color }} />
      </div>
      <div className="text-[13px] font-semibold text-text-primary mb-1">
        {t.label} #{index + 1}
      </div>
      <div className="text-[11px] text-text-secondary">
        Demo kontent — keyingi versiyada haqiqiy data
      </div>
    </div>
  );
}
