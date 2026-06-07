import { useState } from "react";
import { Lock, CheckCircle2, AlertCircle, LogOut, User } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useT } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { settingsApi } from "../lib/resources";

export function SettingsPage() {
  const { t } = useT();
  const { user, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const changePassword = async () => {
    setError(null);
    setSuccess(null);
    if (newPassword.length < 4) {
      setError("Yangi parol kamida 4 belgi");
      return;
    }
    setBusy(true);
    try {
      await settingsApi.changePassword(oldPassword, newPassword);
      setSuccess("Parol muvaffaqiyatli almashtirildi");
      setOldPassword("");
      setNewPassword("");
    } catch (e) {
      setError((e as { message?: string }).message || "Xato");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t("nav.settings")} subtitle="Profil va xavfsizlik" />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="grid grid-cols-2 gap-4 max-w-3xl">
          {/* Profile */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[14.5px] font-semibold text-text-primary">
                  Joriy profil
                </h3>
                <p className="text-[12px] text-text-secondary">
                  Tizimga kirgan admin
                </p>
              </div>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-text-secondary">Ism:</span>
                <span className="font-medium text-text-primary">
                  {user?.full_name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Telefon:</span>
                <span className="font-mono text-text-primary">
                  {user?.phone || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Username:</span>
                <span className="font-mono text-text-primary">
                  {user?.username || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Daraja:</span>
                <span className="font-medium text-text-primary">
                  {user?.is_superuser ? "Superuser" : "Admin"}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12.5px] font-medium text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" /> Chiqish
            </button>
          </div>

          {/* Change password */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[14.5px] font-semibold text-text-primary">
                  Parolni almashtirish
                </h3>
                <p className="text-[12px] text-text-secondary">
                  Xavfsizlik uchun muntazam yangilang
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Joriy parol"
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yangi parol"
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
              />
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-[12px] text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}
              <button
                onClick={changePassword}
                disabled={busy}
                className="btn-primary w-full justify-center py-2 text-[12.5px] disabled:opacity-60"
              >
                {busy ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
