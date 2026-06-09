import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  X,
  Save,
  Search,
  Users as UsersIcon,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import { adminRolesApi, type AdminRole } from "../lib/resources";

// Permission kalitlari ↔ sidebar navigation. Backend bilan bir xil.
const PERMISSION_GROUPS: { key: string; label: string; items: { k: string; l: string }[] }[] = [
  {
    key: "users",
    label: "Foydalanuvchilar",
    items: [
      { k: "users", l: "Ota-onalar" },
      { k: "children", l: "Bolalar" },
      { k: "leads", l: "Murojaatlar" },
      { k: "premium", l: "Premium" },
      { k: "payments", l: "To'lovlar" },
      { k: "requests", l: "So'rovlar" },
      { k: "blocked", l: "Bloklangan" },
    ],
  },
  {
    key: "content",
    label: "Kontent",
    items: [
      { k: "advice", l: "Maslahatlar" },
      { k: "kids_content", l: "Kids kontent" },
      { k: "products", l: "Mahsulotlar" },
      { k: "categories", l: "Kategoriyalar" },
      { k: "banners", l: "Bannerlar" },
      { k: "orders", l: "Buyurtmalar" },
    ],
  },
  {
    key: "communication",
    label: "Aloqa",
    items: [
      { k: "notifications", l: "Bildirishnomalar" },
      { k: "notification_rules", l: "Avtomatik bildirishnomalar" },
      { k: "sms", l: "SMS xabarlar" },
      { k: "ads", l: "Reklamalar" },
    ],
  },
  {
    key: "admin",
    label: "Administratsiya",
    items: [
      { k: "dashboard", l: "Boshqaruv paneli" },
      { k: "operators", l: "Xodimlar" },
      { k: "roles", l: "Rollar" },
      { k: "settings", l: "Sozlamalar" },
    ],
  },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.k));

interface DraftRole {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

export function RolesPage() {
  const { t } = useT();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DraftRole | null>(null);

  const reload = () => {
    setLoading(true);
    adminRolesApi
      .list()
      .then((r) => setRoles(r.results || []))
      .catch((e) => console.error("roles load", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [roles, search]);

  const totalAssigned = roles.reduce((s, r) => s + r.users_count, 0);

  const startCreate = () =>
    setEditing({ id: 0, name: "", description: "", permissions: [] });
  const startEdit = (r: AdminRole) =>
    setEditing({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
    });

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      alert("Rol nomini kiriting");
      return;
    }
    try {
      if (editing.id === 0) {
        await adminRolesApi.create({
          name: editing.name,
          description: editing.description,
          permissions: editing.permissions,
        });
      } else {
        await adminRolesApi.update(editing.id, {
          name: editing.name,
          description: editing.description,
          permissions: editing.permissions,
        });
      }
      setEditing(null);
      reload();
    } catch (e) {
      alert((e as { message?: string }).message || "Saqlashda xato");
    }
  };

  const remove = async (r: AdminRole) => {
    if (r.is_system) return;
    if (!window.confirm(`"${r.name}" rolini o'chirasizmi?`)) return;
    try {
      await adminRolesApi.remove(r.id);
      reload();
    } catch (e) {
      alert((e as { message?: string }).message || "O'chirishda xato");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.roles")}
        subtitle={`${roles.length} rol · ${totalAssigned} xodim`}
        actions={
          <button
            onClick={startCreate}
            className="btn-primary text-[12.5px]"
          >
            <Plus className="h-4 w-4" /> Yangi rol
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
        </div>

        {loading && (
          <div className="card p-12 text-center text-text-muted">
            Yuklanmoqda...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="card p-12 text-center text-text-muted">
            <Shield className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <div className="text-[14px]">Rol topilmadi</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="card p-4 group">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
                  {r.is_system ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <Shield className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[14px] font-semibold text-text-primary truncate">
                      {r.name}
                      {r.is_system && (
                        <span className="ml-2 text-[10px] font-medium text-text-muted rounded bg-bg-input px-1.5 py-0.5">
                          Tizim
                        </span>
                      )}
                    </div>
                  </div>
                  {r.description && (
                    <div className="mt-1 text-[12.5px] text-text-secondary line-clamp-2">
                      {r.description}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      {r.users_count} xodim
                    </span>
                    <span>·</span>
                    <span>{r.permissions.length} ruxsat</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(r)}
                  className="icon-btn h-7 w-7"
                  title="Tahrirlash"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {!r.is_system && (
                  <button
                    onClick={() => remove(r)}
                    className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                    title="O'chirish"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <RoleEditor
          draft={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function RoleEditor({
  draft,
  onChange,
  onClose,
  onSave,
}: {
  draft: DraftRole;
  onChange: (d: DraftRole) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const togglePerm = (key: string) => {
    const has = draft.permissions.includes(key);
    onChange({
      ...draft,
      permissions: has
        ? draft.permissions.filter((k) => k !== key)
        : [...draft.permissions, key],
    });
  };

  const toggleGroup = (items: { k: string }[]) => {
    const keys = items.map((i) => i.k);
    const allHave = keys.every((k) => draft.permissions.includes(k));
    if (allHave) {
      onChange({
        ...draft,
        permissions: draft.permissions.filter((p) => !keys.includes(p)),
      });
    } else {
      const merged = Array.from(new Set([...draft.permissions, ...keys]));
      onChange({ ...draft, permissions: merged });
    }
  };

  const selectAll = () =>
    onChange({ ...draft, permissions: [...ALL_PERMISSION_KEYS] });
  const clearAll = () => onChange({ ...draft, permissions: [] });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {draft.id === 0 ? "Yangi rol" : "Rolni tahrirlash"}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <div className="text-[12px] font-medium text-text-secondary mb-1.5">
              Nomi
            </div>
            <input
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              placeholder="Masalan: Marketing"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[12px] font-medium text-text-secondary mb-1.5">
              Tavsif
            </div>
            <textarea
              value={draft.description}
              onChange={(e) =>
                onChange({ ...draft, description: e.target.value })
              }
              rows={2}
              placeholder="Bu rol qaysi xodimlar uchun..."
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12.5px] font-semibold text-text-primary">
            Ruxsatlar ({draft.permissions.length}/{ALL_PERMISSION_KEYS.length})
          </div>
          <div className="flex gap-2 text-[11px]">
            <button
              onClick={selectAll}
              className="text-primary hover:underline"
            >
              Hammasi
            </button>
            <span className="text-text-muted">·</span>
            <button
              onClick={clearAll}
              className="text-text-muted hover:text-text-primary"
            >
              Hech biri
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {PERMISSION_GROUPS.map((g) => {
            const groupAllOn = g.items.every((i) =>
              draft.permissions.includes(i.k),
            );
            return (
              <div
                key={g.key}
                className="rounded-lg border border-line bg-bg-input/40 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                    {g.label}
                  </div>
                  <button
                    onClick={() => toggleGroup(g.items)}
                    className="text-[10.5px] text-primary hover:underline"
                  >
                    {groupAllOn ? "Bekor qilish" : "Guruh"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {g.items.map((i) => {
                    const has = draft.permissions.includes(i.k);
                    return (
                      <label
                        key={i.k}
                        className="flex items-center gap-2 cursor-pointer text-[12.5px] text-text-secondary hover:text-text-primary"
                      >
                        <input
                          type="checkbox"
                          checked={has}
                          onChange={() => togglePerm(i.k)}
                          className="h-3.5 w-3.5"
                        />
                        <span>{i.l}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            Bekor
          </button>
          <button onClick={onSave} className="btn-primary text-[12.5px]">
            <Save className="h-3.5 w-3.5" /> Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
