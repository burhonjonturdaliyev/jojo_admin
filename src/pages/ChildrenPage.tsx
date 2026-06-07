import { Plus, Search, Filter, Baby } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";

const children = [
  {
    name: "Asilbek Karimov",
    parent: "Abdulla Karimov",
    age: 8,
    gender: "Erkak",
    device: "iPhone 13",
    status: "ulangan",
  },
  {
    name: "Madina Usmonova",
    parent: "Nilufar Usmonova",
    age: 5,
    gender: "Ayol",
    device: "Samsung A52",
    status: "ulanmagan",
  },
  {
    name: "Bobur Yusupov",
    parent: "Islom Yusupov",
    age: 10,
    gender: "Erkak",
    device: "Xiaomi Mi 11",
    status: "ulangan",
  },
  {
    name: "Sevinch Mirzayeva",
    parent: "Ma'ruf Mirzayev",
    age: 7,
    gender: "Ayol",
    device: "iPhone 12",
    status: "ulangan",
  },
  {
    name: "Diyor Tursunov",
    parent: "Malika Tursunova",
    age: 6,
    gender: "Erkak",
    device: "Samsung A52",
    status: "ulangan",
  },
  {
    name: "Lola Haydarova",
    parent: "Doniyor Haydarov",
    age: 9,
    gender: "Ayol",
    device: "Honor X8",
    status: "ulanmagan",
  },
];

export function ChildrenPage() {
  const { t } = useT();
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.children")}
        subtitle={t("children.subtitle")}
        actions={
          <>
            <button className="btn-secondary text-[12.5px]">
              <Filter className="h-4 w-4" /> {t("common.filter")}
            </button>
            <button className="btn-primary text-[12.5px]">
              <Plus className="h-4 w-4" /> {t("children.newChild")}
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              placeholder={t("children.searchPlaceholder")}
              className="input pl-9"
            />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-input text-[12px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("children.tbl.child")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("children.tbl.parent")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("children.tbl.age")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("children.tbl.gender")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("children.tbl.device")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {children.map((c, i) => (
                <tr
                  key={c.name}
                  className={`hover:bg-bg-hover/50 ${i ? "border-t border-line" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} size={32} />
                      <span className="font-medium text-text-primary">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.parent}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {c.age} {t("children.yearsOld")}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {c.gender === "Erkak"
                      ? t("children.gender.male")
                      : t("children.gender.female")}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.device}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        c.status === "ulangan"
                          ? "bg-status-resolved/15 text-status-resolved"
                          : "bg-status-blocked/15 text-status-blocked"
                      }`}
                    >
                      {c.status === "ulangan"
                        ? t("children.connected")
                        : t("children.notConnected")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: t("children.stat.total"), value: "8,325", icon: Baby, color: "#3B82F6" },
            { label: t("children.stat.connected"), value: "7,892", icon: Baby, color: "#10B981" },
            { label: t("children.stat.notConnected"), value: "433", icon: Baby, color: "#EF4444" },
          ].map((s) => (
            <div key={s.label} className="card flex items-center gap-3 p-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${s.color}22`, color: s.color }}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[12px] text-text-secondary">{s.label}</div>
                <div className="text-[20px] font-bold text-text-primary">
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
