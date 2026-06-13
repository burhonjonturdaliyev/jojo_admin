import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const ok = await login(username, password);
      if (ok) {
        navigate(from, { replace: true });
      } else {
        setError(t("login.error"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[400px] rounded-2xl border border-line bg-bg-panel p-8 shadow-panel">
        <div className="mb-7 flex flex-col items-center text-center">
          <img
            src="/favicon.png"
            alt="Jojo Admin"
            className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-brand/30"
          />
          <h1 className="mt-4 text-xl font-bold tracking-wide text-text-primary">
            {t("nav.brand")}
          </h1>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            {t("nav.adminPanel")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              {t("login.username")}
            </label>
            <div className="relative">
              <UserIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                strokeWidth={2}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                autoFocus
                className="w-full rounded-lg border border-line bg-bg-input py-2.5 pl-9 pr-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              {t("login.password")}
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                strokeWidth={2}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                autoComplete="current-password"
                className="w-full rounded-lg border border-line bg-bg-input py-2.5 pl-9 pr-10 text-[14px] text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? t("login.hide") : t("login.show")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text-muted transition-colors hover:text-text-secondary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-status-blocked/40 bg-status-blocked/10 px-3 py-2 text-[13px] font-medium text-status-blocked">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-brand py-2.5 text-[14px] font-semibold text-white shadow-lg shadow-brand/30 transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("login.submit")}
          </button>
        </form>

        <div className="mt-5">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
