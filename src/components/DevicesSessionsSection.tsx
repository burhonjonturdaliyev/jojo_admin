import { useCallback, useEffect, useState } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  LogOut,
  ShieldAlert,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  sessionsApi,
  type AdminSessionListResponse,
} from "../lib/resources";
import { subscribe } from "../lib/leadsSocket";

/** "2 daqiqa oldin" ko'rinishidagi nisbiy vaqt. */
export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 45) return "hozir";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function deviceIcon(type: string) {
  if (type === "mobile") return Smartphone;
  if (type === "tablet") return Tablet;
  return Monitor;
}

/** Soniyani "12 daqiqa" ko'rinishida. */
function humanizeSeconds(sec: number): string {
  if (sec <= 0) return "0 daqiqa";
  const m = Math.ceil(sec / 60);
  if (m < 60) return `${m} daqiqa`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} soat ${rem} daqiqa` : `${h} soat`;
}

export function DevicesSessionsSection() {
  const [data, setData] = useState<AdminSessionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // sid yoki "others"
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await sessionsApi.list();
      setData(r);
      setError(null);
    } catch (e) {
      setError((e as { message?: string }).message || "Yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Yangi login bo'lsa ro'yxatni yangilab turamiz (realtime + zaxira poll).
    const off = subscribe("admin.session.new", () => load());
    const timer = window.setInterval(load, 60_000);
    return () => {
      off();
      window.clearInterval(timer);
    };
  }, [load]);

  const terminate = async (sid: string) => {
    setBusy(sid);
    setError(null);
    setInfo(null);
    try {
      await sessionsApi.terminate(sid);
      setInfo("Qurilma chiqarildi.");
      await load();
    } catch (e) {
      setError((e as { message?: string }).message || "Chiqarib bo'lmadi");
    } finally {
      setBusy(null);
    }
  };

  const terminateOthers = async () => {
    setBusy("others");
    setError(null);
    setInfo(null);
    try {
      const r = await sessionsApi.terminateOthers();
      setInfo(`${r.terminated} ta qurilma chiqarildi.`);
      await load();
    } catch (e) {
      setError((e as { message?: string }).message || "Chiqarib bo'lmadi");
    } finally {
      setBusy(null);
    }
  };

  const sessions = data?.sessions ?? [];
  const others = sessions.filter((s) => !s.is_current);
  const canOthers = data?.can_terminate_others ?? false;
  const availableIn = data?.terminate_others_available_in ?? 0;

  return (
    <div className="card mt-4 max-w-3xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[14.5px] font-semibold text-text-primary">
              Faol qurilmalar
            </h3>
            <p className="text-[12px] text-text-secondary">
              Akkauntingizga kirgan barcha qurilmalar va sessiyalar
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="icon-btn h-8 w-8"
          title="Yangilash"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {info && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-[12px] text-green-500">
          <CheckCircle2 className="h-4 w-4" /> {info}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-[13px] text-text-muted">
          Yuklanmoqda…
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="py-8 text-center text-[13px] text-text-muted">
          Faol sessiya topilmadi.
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((s) => {
          const Icon = deviceIcon(s.device_type);
          return (
            <div
              key={s.sid}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                s.is_current
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-line bg-bg-input"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-hover text-text-secondary">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-semibold text-text-primary">
                    {s.device_label}
                  </span>
                  {s.is_current && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-medium text-emerald-500">
                      Joriy qurilma
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-text-secondary">
                  {s.location_label && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {s.location_label}
                    </span>
                  )}
                  {s.ip_address && (
                    <span className="font-mono">{s.ip_address}</span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {s.is_current
                      ? `kirgan: ${relativeTime(s.created_at)}`
                      : `faol: ${relativeTime(s.last_seen_at)}`}
                  </span>
                </div>
              </div>
              {!s.is_current && (
                <button
                  onClick={() => terminate(s.sid)}
                  disabled={!s.can_terminate || busy === s.sid}
                  title={
                    s.can_terminate
                      ? "Bu qurilmani chiqarish"
                      : "Yangi sessiya 1 soat to'lmaguncha eski qurilmalarni chiqara olmaydi"
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-[11.5px] font-medium text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {busy === s.sid ? "..." : "Chiqarish"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {others.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <button
            onClick={terminateOthers}
            disabled={!canOthers || busy === "others"}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12.5px] font-medium text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldAlert className="h-4 w-4" />
            {busy === "others"
              ? "Chiqarilmoqda…"
              : "Barcha boshqa qurilmalardan chiqish"}
          </button>
          {!canOthers && (
            <p className="mt-2 text-[11.5px] text-text-muted">
              Bu imkoniyat joriy sessiya 1 soatdan oshganda faollashadi
              {availableIn > 0 ? ` · ${humanizeSeconds(availableIn)} qoldi` : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
