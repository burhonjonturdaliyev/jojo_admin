import { useEffect, useState } from "react";
import {
  Plus,
  Headset,
  Pencil,
  Trash2,
  X,
  KeyRound,
  Shield,
  Crown,
  Eye,
  EyeOff,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import {
  operatorsApi,
  adminRolesApi,
  type AdminOperatorWithRole,
  type AdminRole,
} from "../lib/resources";

export function OperatorsPage() {
  const { t } = useT();
  const { user: me } = useAuth();
  const canManageSuperuser = !!me?.is_superuser;
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
        subtitle={t("operators.subtitle", { count: items.length })}
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-4 w-4" /> {t("operators.newButton")}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-3 gap-4">
          {loading && (
            <div className="col-span-3 py-12 text-center text-text-muted">
              {t("common.loading")}
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="col-span-3 py-12 text-center text-text-muted">
              <Headset className="mx-auto mb-2 h-8 w-8 opacity-40" />
              {t("operators.empty")}
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
                  {op.is_active ? t("users.filter.active") : t("common.inactive")}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {op.is_superuser && (
                  <div className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                    <Crown className="h-3 w-3" /> {t("form.superAdmin")}
                  </div>
                )}
                {op.role_name ? (
                  <div className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-500">
                    <Shield className="h-3 w-3" /> {op.role_name}
                  </div>
                ) : !op.is_superuser ? (
                  <div className="text-[11px] text-text-muted italic">{t("operators.roleless")}</div>
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[11px] text-text-muted">
                  {t("operators.added")}: {new Date(op.date_joined).toLocaleDateString("uz-UZ")}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(op)}
                    className="icon-btn h-7 w-7"
                    title={t("users.action.edit")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      removeOperator(op.id, op.first_name || op.phone)
                    }
                    className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                    title={t("users.action.delete")}
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
          canManageSuperuser={canManageSuperuser}
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
  canManageSuperuser,
  onClose,
  onSaved,
}: {
  op: AdminOperatorWithRole;
  roles: AdminRole[];
  canManageSuperuser: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [fullName, setFullName] = useState(op.first_name);
  const [phone, setPhone] = useState(op.phone);
  const [isActive, setIsActive] = useState(op.is_active);
  const [isSuperuser, setIsSuperuser] = useState(!!op.is_superuser);
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
        ...(canManageSuperuser ? { is_superuser: isSuperuser } : {}),
      });
      onSaved();
    } catch (e) {
      setError((e as { message?: string }).message || t("common.error"));
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
            {t("form.editEmployee")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("form.fullName")}
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("form.namePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("form.phone")}
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("form.phonePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] font-mono outline-none focus:border-primary"
            />
            <p className="mt-1 text-[10.5px] text-text-muted">
              {t("form.phoneLoginHint")}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("form.newPassword")}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("form.passwordKeepEmpty")}
                className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("form.role")}
            </div>
            <select
              value={roleId ?? ""}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              <option value="">{t("form.roleNone")}</option>
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
            {t("form.activeNotBlocked")}
          </label>
          {canManageSuperuser && (
            <label className="flex items-start gap-2 text-[12.5px] text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={isSuperuser}
                onChange={(e) => setIsSuperuser(e.target.checked)}
              />
              <span>
                <span className="font-medium text-amber-500">{t("form.superAdmin")}</span>
                <span className="block text-[10.5px] text-text-muted">
                  {t("form.superAdminHint")}
                </span>
              </span>
            </label>
          )}
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
              {error}
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("form.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? t("form.saving") : t("form.save")}
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
  const { t } = useT();
  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError(`${t("form.phone")} ${t("form.required").toLowerCase()}`);
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
      setError((e as { message?: string }).message || t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg p-5">
        <h3 className="text-[16px] font-semibold text-text-primary mb-4">
          {t("form.addEmployee")}
        </h3>
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <input type="text" name="prevent-autofill" autoComplete="off" className="hidden" />
          <input type="password" name="prevent-autofill-pw" autoComplete="new-password" className="hidden" />
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("form.phone")} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="operator-phone"
              autoComplete="off"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("form.phonePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] font-mono text-text-primary outline-none focus:border-primary"
            />
            <p className="mt-1 text-[10.5px] text-text-muted">
              {t("form.phoneLoginHint")}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("form.fullName")}
            </label>
            <input
              type="text"
              name="operator-fullname"
              autoComplete="off"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("form.namePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("form.password")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="operator-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("form.passwordPlaceholder")}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 pr-10 text-[13px] text-text-primary outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn h-7 w-7 text-text-muted hover:text-text-primary"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">
              {t("form.role")}
            </div>
            <select
              value={roleId ?? ""}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              <option value="">{t("form.roleNone")}</option>
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
        </form>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            {t("form.cancel")}
          </button>
          <button
            className="btn-primary text-[12.5px]"
            onClick={submit}
            disabled={busy}
          >
            {busy ? t("form.creating") : t("form.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
