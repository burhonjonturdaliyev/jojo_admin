import { useEffect, useState } from "react";
import { Plus, Headset, Pencil, Trash2, X, KeyRound, Shield } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import {
  operatorsApi,
  adminRolesApi,
  type AdminOperatorWithRole,
  type AdminRole,
} from "../lib/resources";

export function OperatorsPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminOperatorWithRole[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AdminOperatorWithRole | null>(null);

  const removeOperator = async (id: number, name: string) => {
    if (!confirm(`${name} ni o'chirasizmi?`)) return;
    try {
      await operatorsApi.remove(id);
      setItems((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
    }
  };

  const reload = async () => {
    setLoading(true);
    try {
      const [r, rolesRes] = await Promise.all([
        operatorsApi.list(),
        adminRolesApi.list(),
      ]);
      setItems(r.results);
      setRoles(rolesRes.results || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.operators")}
        subtitle={`${items.length} ta call operator`}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-4 w-4" /> Yangi operator
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-3 gap-4">
          {loading && (
            <div className="col-span-3 py-12 text-center text-text-muted">
              Yuklanmoqda...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="col-span-3 py-12 text-center text-text-muted">
              <Headset className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Xodimlar yo'q
            </div>
          )}
          {items.map((op) => (
            <div key={op.id} className="card p-5 group">
              <div className="flex items-center gap-3">
                <Avatar name={op.first_name || op.phone} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-text-primary">
                    {op.first_name || op.username}
                  </div>
                  <div className="text-[12px] text-text-secondary font-mono">
                    {op.phone}
                  </div>
                </div>
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[10.5px] font-medium " +
                    (op.is_active
                      ? "bg-status-resolved/15 text-status-resolved"
                      : "bg-text-muted/15 text-text-muted")
                  }
                >
                  {op.is_active ? "Faol" : "Nofaol"}
                </span>
              </div>
              {op.role_name && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-500">
                  <Shield className="h-3 w-3" /> {op.role_name}
                </div>
              )}
              {!op.role_name && (
                <div className="mt-2 text-[11px] text-text-muted italic">
                  Rolsiz
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[11px] text-text-muted">
                  Qo'shilgan: {new Date(op.date_joined).toLocaleDateString("uz-UZ")}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(op)}
                    className="icon-btn h-7 w-7"
                    title="Tahrirlash"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      removeOperator(op.id, op.first_name || op.phone)
                    }
                    className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                    title="O'chirish"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {adding && (
        <CreateOperatorModal
          roles={roles}
          onClose={() => setAdding(false)}
          onCreated={async () => {
            setAdding(false);
            await reload();
          }}
        />
      )}
      {editing && (
        <EditOperatorModal
          op={editing}
          roles={roles}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function EditOperatorModal({
  op,
  roles,
  onClose,
  onSaved,
}: {
  op: AdminOperatorWithRole;
  roles: AdminRole[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(op.first_name);
  const [phone, setPhone] = useState(op.phone);
  const [isActive, setIsActive] = useState(op.is_active);
  const [newPassword, setNewPassword] = useState("");
  const [roleId, setRoleId] = useState<number | null>(op.role_id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await operatorsApi.update(op.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        is_active: isActive,
        new_password: newPassword || undefined,
        role_id: roleId,
      });
      onSaved();
    } catch (e) {
      setError((e as { message?: string }).message || "Xato");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            Xodimni tahrirlash
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="To'liq ism"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998..."
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] font-mono outline-none focus:border-primary"
          />
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yangi parol (bo'sh qoldirsangiz o'zgarmaydi)"
              className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              Rol
            </div>
            <select
              value={roleId ?? ""}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              <option value="">— Rolsiz —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Faol (bloklanmagan)
          </label>
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
              {error}
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            Bekor
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateOperatorModal({
  roles,
  onClose,
  onCreated,
}: {
  roles: AdminRole[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError("Telefon va parol majburiy");
      return;
    }
    setBusy(true);
    try {
      await operatorsApi.create({
        phone: phone.trim(),
        password,
        full_name: fullName.trim() || undefined,
        role_id: roleId,
      });
      onCreated();
    } catch (e) {
      setError((e as { message?: string }).message || "Xato");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg p-5">
        <h3 className="text-[16px] font-semibold text-text-primary mb-4">
          Yangi operator yaratish
        </h3>
        <div className="space-y-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998901234567"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="To'liq ism"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              Rol
            </div>
            <select
              value={roleId ?? ""}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              <option value="">— Rolsiz —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
              {error}
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            Bekor
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Yaratilmoqda..." : "Yaratish"}
          </button>
        </div>
      </div>
    </div>
  );
}
