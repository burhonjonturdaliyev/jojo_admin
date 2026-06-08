import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  Users as UsersIcon,
  X,
  Eye,
  EyeOff,
  Edit3,
  Star,
  Lock,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { LocalizedField } from "../components/LocalizedField";
import { TranslateAllButton } from "../components/TranslateAllButton";
import { useT } from "../lib/i18n";
import { cn } from "../lib/utils";
import { initialRoles } from "../data/roles";
import {
  ALL_EDIT,
  ALL_NONE,
  ALL_VIEW,
  countByLevel,
  MENU_SECTIONS,
  type AccessLevel,
  type MenuKey,
  type Permissions,
  type Role,
} from "../types/role";
import {
  emptyLocalized,
  pickLocalized,
  toLocalized,
  type Localized,
} from "../types/locale";

const ROLE_COLORS = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
  "#EC4899",
  "#0EA5E9",
  "#14B8A6",
  "#6B7280",
];

const emptyRole = (): Role => ({
  id: `role-${Math.random().toString(36).slice(2, 8)}`,
  name: emptyLocalized(),
  description: emptyLocalized(),
  color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)],
  permissions: { ...ALL_VIEW },
  assignedCount: 0,
  createdAt: new Date()
    .toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "."),
  updatedAt: new Date()
    .toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "."),
});

export function RolesPage() {
  const { t, lang } = useT();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Role | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter((r) => {
      const haystacks = [
        pickLocalized(r.name, "uz"),
        pickLocalized(r.name, "ru"),
        pickLocalized(r.name, "en"),
        pickLocalized(r.description, "uz"),
        pickLocalized(r.description, "ru"),
        pickLocalized(r.description, "en"),
      ];
      return haystacks.some((s) => s.toLowerCase().includes(q));
    });
  }, [roles, search]);

  const totalAssigned = roles.reduce((s, r) => s + r.assignedCount, 0);
  const systemCount = roles.filter((r) => r.isSystem).length;

  const save = (role: Role) => {
    setRoles((prev) => {
      const exists = prev.some((r) => r.id === role.id);
      const updated = {
        ...role,
        updatedAt: new Date()
          .toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "."),
      };
      return exists
        ? prev.map((r) => (r.id === role.id ? updated : r))
        : [updated, ...prev];
    });
    setEditing(null);
  };

  const remove = (role: Role) => {
    if (role.isSystem) return;
    if (!window.confirm(t("roles.confirmDelete"))) return;
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.roles")}
        subtitle={t("roles.subtitle")}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyRole())}
          >
            <Plus className="h-4 w-4" /> {t("roles.new")}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: t("roles.stat.total"),
              value: roles.length.toLocaleString("ru-RU"),
              icon: Shield,
              color: "#3B82F6",
            },
            {
              label: t("roles.stat.assigned"),
              value: totalAssigned.toLocaleString("ru-RU"),
              icon: UsersIcon,
              color: "#10B981",
            },
            {
              label: t("roles.stat.system"),
              value: systemCount.toLocaleString("ru-RU"),
              icon: ShieldCheck,
              color: "#8B5CF6",
            },
            {
              label: t("roles.stat.custom"),
              value: (roles.length - systemCount).toLocaleString("ru-RU"),
              icon: Star,
              color: "#F59E0B",
            },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-[12px] text-text-secondary">{s.label}</div>
                  <div className="mt-1 text-[22px] font-bold leading-none text-text-primary">
                    {s.value}
                  </div>
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${s.color}26`, color: s.color }}
                >
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line p-4">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                placeholder={t("roles.searchPlaceholder")}
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-bg-input text-[12px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("roles.tbl.role")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("roles.tbl.permissions")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("roles.tbl.assigned")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    {t("roles.tbl.updated")}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {t("roles.tbl.action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const counts = countByLevel(r.permissions);
                  const name = pickLocalized(r.name, lang) || r.id;
                  const desc = pickLocalized(r.description, lang);
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "hover:bg-bg-hover/40",
                        i ? "border-t border-line" : "",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              background: `${r.color}26`,
                              color: r.color,
                            }}
                          >
                            <Shield className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-text-primary">
                                {name}
                              </span>
                              {r.isSystem && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                                  <Lock className="h-2.5 w-2.5" />
                                  {t("roles.system")}
                                </span>
                              )}
                              {r.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-status-progress/15 px-2 py-0.5 text-[10px] font-semibold text-status-progress">
                                  <Star
                                    className="h-2.5 w-2.5"
                                    fill="currentColor"
                                  />
                                  {t("roles.default")}
                                </span>
                              )}
                            </div>
                            {desc && (
                              <div className="mt-0.5 line-clamp-2 max-w-md text-[12px] text-text-secondary">
                                {desc}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PermPill
                            label={t("roles.summary.editable", {
                              n: counts.edit,
                            })}
                            count={counts.edit}
                            tone="success"
                            icon={Edit3}
                          />
                          <PermPill
                            label={t("roles.summary.viewable", {
                              n: counts.view,
                            })}
                            count={counts.view}
                            tone="brand"
                            icon={Eye}
                          />
                          <PermPill
                            label={t("roles.summary.hidden", {
                              n: counts.none,
                            })}
                            count={counts.none}
                            tone="muted"
                            icon={EyeOff}
                          />
                        </div>
                        <PermStrip permissions={r.permissions} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-bg-input px-2 py-1 text-[12px] font-medium text-text-primary">
                          <UsersIcon className="h-3.5 w-3.5 text-text-muted" />
                          {r.assignedCount}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {r.updatedAt}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="icon-btn h-8 w-8"
                            onClick={() => setEditing(r)}
                            title={t("common.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className={cn(
                              "icon-btn h-8 w-8",
                              r.isSystem
                                ? "cursor-not-allowed opacity-40"
                                : "hover:bg-status-blocked/15 hover:text-status-blocked",
                            )}
                            onClick={() => remove(r)}
                            disabled={r.isSystem}
                            title={
                              r.isSystem
                                ? t("roles.cannotDelete")
                                : t("common.delete")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-[13px] text-text-muted"
                    >
                      {t("roles.notFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <RoleFormDrawer
          role={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

const PILL_TONES = {
  brand: "bg-brand-soft text-brand",
  success: "bg-status-resolved/15 text-status-resolved",
  muted: "bg-bg-input text-text-muted",
} as const;

function PermPill({
  label,
  count,
  tone,
  icon: Icon,
}: {
  label: string;
  count: number;
  tone: keyof typeof PILL_TONES;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (count === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-bg-input/60 px-1.5 py-0.5 text-[11px] font-medium text-text-muted/60">
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        PILL_TONES[tone],
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function PermStrip({ permissions }: { permissions: Permissions }) {
  const counts = countByLevel(permissions);
  const editPct = (counts.edit / counts.total) * 100;
  const viewPct = (counts.view / counts.total) * 100;
  const nonePct = (counts.none / counts.total) * 100;
  return (
    <div className="mt-2 flex h-1.5 max-w-xs overflow-hidden rounded-full bg-bg-input">
      <div
        className="h-full bg-status-resolved"
        style={{ width: `${editPct}%` }}
      />
      <div className="h-full bg-brand" style={{ width: `${viewPct}%` }} />
      <div className="h-full bg-line" style={{ width: `${nonePct}%` }} />
    </div>
  );
}

interface DrawerProps {
  role: Role;
  onClose: () => void;
  onSave: (r: Role) => void;
}

interface DraftRole {
  id: string;
  name: Localized<string>;
  description: Localized<string>;
  color: string;
  permissions: Permissions;
  isSystem?: boolean;
  isDefault?: boolean;
  assignedCount: number;
  createdAt: string;
  updatedAt: string;
}

function normalizeDraft(role: Role): DraftRole {
  return {
    ...role,
    name: toLocalized(role.name),
    description: toLocalized(role.description),
  };
}

function RoleFormDrawer({ role, onClose, onSave }: DrawerProps) {
  const { t, lang } = useT();
  const [draft, setDraft] = useState<DraftRole>(() => normalizeDraft(role));

  const set = <K extends keyof DraftRole>(key: K, value: DraftRole[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setAccess = (menu: MenuKey, level: AccessLevel) =>
    set("permissions", { ...draft.permissions, [menu]: level });

  const setBulk = (level: AccessLevel) => {
    if (level === "edit") set("permissions", { ...ALL_EDIT });
    else if (level === "view") set("permissions", { ...ALL_VIEW });
    else set("permissions", { ...ALL_NONE });
  };

  const counts = countByLevel(draft.permissions);
  const valid =
    draft.name.uz.trim() ||
    draft.name.ru.trim() ||
    draft.name.en.trim();

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-3xl flex-col border-l border-line bg-bg-panel shadow-panel">
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${draft.color}26`, color: draft.color }}
            >
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-text-primary">
                {role.id && (draft.name.uz || draft.name.ru || draft.name.en)
                  ? t("roles.edit.title")
                  : t("roles.new")}
              </h2>
              <p className="mt-0.5 text-[12.5px] text-text-secondary">
                {t("roles.edit.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TranslateAllButton
              from={lang}
              fields={[
                { value: draft.name, onChange: (v) => set("name", v) },
                {
                  value: draft.description,
                  onChange: (v) => set("description", v),
                },
              ]}
            />
            <button className="icon-btn" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          <LocalizedField
            label={t("roles.field.name")}
            value={draft.name}
            onChange={(v) => set("name", v)}
            placeholder={t("roles.field.namePh")}
            autoFocus={!role.isSystem}
          />

          <LocalizedField
            as="textarea"
            rows={4}
            label={t("roles.field.description")}
            value={draft.description}
            onChange={(v) => set("description", v)}
            placeholder={t("roles.field.descriptionPh")}
          />

          <div>
            <label className="mb-2 block text-[12px] font-medium text-text-secondary">
              {t("roles.field.color")}
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-transform active:scale-95",
                    draft.color === c
                      ? "border-text-primary shadow-md"
                      : "border-transparent hover:border-line",
                  )}
                  style={{ background: c }}
                  aria-label={c}
                >
                  {draft.color === c && (
                    <span className="text-[10px] font-bold text-white">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div className="rounded-xl border border-line bg-bg-input/40">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <h3 className="text-[14px] font-semibold text-text-primary">
                  {t("roles.permMatrix")}
                </h3>
                <p className="mt-0.5 text-[12px] text-text-secondary">
                  {t("roles.permMatrixSub")}
                </p>
              </div>
              <SummaryBadges counts={counts} />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-line bg-bg-card px-4 py-2.5">
              <span className="text-[11.5px] font-medium text-text-secondary">
                {t("roles.bulk.label")}
              </span>
              <BulkButton
                tone="success"
                icon={Edit3}
                label={t("roles.bulk.allEdit")}
                onClick={() => setBulk("edit")}
              />
              <BulkButton
                tone="brand"
                icon={Eye}
                label={t("roles.bulk.allView")}
                onClick={() => setBulk("view")}
              />
              <BulkButton
                tone="muted"
                icon={EyeOff}
                label={t("roles.bulk.allNone")}
                onClick={() => setBulk("none")}
              />
            </div>

            <div className="divide-y divide-line">
              {MENU_SECTIONS.map((section) => (
                <div key={section.key} className="px-4 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-muted">
                      {t(`roles.section.${section.key}`)}
                    </span>
                    <span className="text-[10px] text-text-muted/60">
                      ({section.menus.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {section.menus.map((menu) => (
                      <PermRow
                        key={menu}
                        menu={menu}
                        level={draft.permissions[menu]}
                        onChange={(l) => setAccess(menu, l)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line bg-bg-panel px-6 py-4">
          <div className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
            <span className="font-semibold text-text-primary">
              {counts.edit + counts.view}/{counts.total}
            </span>
            <span>
              {t("roles.tbl.permissions").toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-[12.5px]" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button
              className="btn-primary text-[12.5px] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!valid}
              onClick={() => onSave(draft as Role)}
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBadges({
  counts,
}: {
  counts: { edit: number; view: number; none: number; total: number };
}) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-md bg-status-resolved/15 px-2 py-0.5 text-[11px] font-semibold text-status-resolved">
        <Edit3 className="h-3 w-3" />
        {t("roles.summary.editable", { n: counts.edit })}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
        <Eye className="h-3 w-3" />
        {t("roles.summary.viewable", { n: counts.view })}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-bg-input px-2 py-0.5 text-[11px] font-semibold text-text-muted">
        <EyeOff className="h-3 w-3" />
        {t("roles.summary.hidden", { n: counts.none })}
      </span>
    </div>
  );
}

function BulkButton({
  tone,
  icon: Icon,
  label,
  onClick,
}: {
  tone: "brand" | "success" | "muted";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  const classes =
    tone === "brand"
      ? "border-brand/40 bg-brand-soft text-brand hover:bg-brand/20"
      : tone === "success"
        ? "border-status-resolved/40 bg-status-resolved/15 text-status-resolved hover:bg-status-resolved/20"
        : "border-line bg-bg-input text-text-secondary hover:bg-bg-hover";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11.5px] font-semibold transition-colors active:scale-95",
        classes,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function PermRow({
  menu,
  level,
  onChange,
}: {
  menu: MenuKey;
  level: AccessLevel;
  onChange: (l: AccessLevel) => void;
}) {
  const { t } = useT();
  const label = t(`nav.${menu}`);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-transparent bg-bg-card px-3 py-2 transition-colors hover:border-line">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            level === "edit"
              ? "bg-status-resolved"
              : level === "view"
                ? "bg-brand"
                : "bg-line",
          )}
        />
        <span className="truncate text-[13px] font-medium text-text-primary">
          {label}
        </span>
      </div>
      <AccessSegmented level={level} onChange={onChange} />
    </div>
  );
}

function AccessSegmented({
  level,
  onChange,
}: {
  level: AccessLevel;
  onChange: (l: AccessLevel) => void;
}) {
  const { t } = useT();
  const options: {
    key: AccessLevel;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tip: string;
    activeClass: string;
  }[] = [
    {
      key: "none",
      label: t("roles.access.noneShort"),
      icon: EyeOff,
      tip: t("roles.access.tip.none"),
      activeClass: "bg-bg-hover text-text-primary",
    },
    {
      key: "view",
      label: t("roles.access.viewShort"),
      icon: Eye,
      tip: t("roles.access.tip.view"),
      activeClass: "bg-brand text-white shadow-sm",
    },
    {
      key: "edit",
      label: t("roles.access.editShort"),
      icon: Edit3,
      tip: t("roles.access.tip.edit"),
      activeClass: "bg-status-resolved text-white shadow-sm",
    },
  ];

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-line bg-bg-input p-0.5">
      {options.map((o) => {
        const isActive = o.key === level;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            title={o.tip}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold transition-all",
              isActive
                ? o.activeClass
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
            )}
          >
            <o.icon className="h-3 w-3" />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
