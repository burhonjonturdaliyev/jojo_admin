import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, MapPin, X, LogOut } from "lucide-react";
import { sessionsApi, type AdminSession } from "../lib/resources";
import { subscribe } from "../lib/leadsSocket";
import { relativeTime } from "./DevicesSessionsSection";

/**
 * Akkauntga yangi qurilmadan login bo'lganda, oldindan kirgan (eski)
 * qurilmalarga ko'rinadigan bildirishnoma. Telegramdagi "Yangi qurilmadan
 * kirildi" xabariga o'xshash.
 *
 * Manba: realtime socket (`admin.session.new`) + zaxira poll (`alerts`).
 */
export function NewLoginAlert() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AdminSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());

  const pushAlerts = useCallback((items: AdminSession[]) => {
    const fresh = items.filter((a) => a && a.sid && !seen.current.has(a.sid));
    if (fresh.length === 0) return;
    fresh.forEach((a) => seen.current.add(a.sid));
    setAlerts((prev) => [...fresh, ...prev].slice(0, 5));
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const r = await sessionsApi.alerts();
      if (r.alerts?.length) pushAlerts(r.alerts);
    } catch {
      // jim — bildirishnoma kritik emas
    }
  }, [pushAlerts]);

  useEffect(() => {
    loadAlerts();
    const off = subscribe("admin.session.new", (data) => {
      const s = data as AdminSession;
      if (s && s.sid) pushAlerts([s]);
    });
    const timer = window.setInterval(loadAlerts, 60_000);
    return () => {
      off();
      window.clearInterval(timer);
    };
  }, [loadAlerts, pushAlerts]);

  const dismissAll = async () => {
    setAlerts([]);
    setNote(null);
    try {
      await sessionsApi.ackAlerts();
    } catch {
      // ignore
    }
  };

  const terminateOthers = async () => {
    setBusy(true);
    setNote(null);
    try {
      const r = await sessionsApi.terminateOthers();
      setNote(`${r.terminated} ta qurilma chiqarildi.`);
      setAlerts([]);
      await sessionsApi.ackAlerts().catch(() => undefined);
    } catch (e) {
      setNote(
        (e as { message?: string }).message ||
          "Hozircha chiqarib bo'lmadi (sessiya 1 soatdan oshishi kerak).",
      );
    } finally {
      setBusy(false);
    }
  };

  if (alerts.length === 0 && !note) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[340px] flex-col gap-2">
      {alerts.map((a) => (
        <div
          key={a.sid}
          className="pointer-events-auto overflow-hidden rounded-xl border border-amber-500/40 bg-bg-panel shadow-lg"
        >
          <div className="flex items-start gap-3 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-text-primary">
                Yangi qurilmadan kirildi
              </div>
              <div className="mt-0.5 truncate text-[12px] text-text-secondary">
                {a.device_label}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-text-muted">
                {a.location_label && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {a.location_label}
                  </span>
                )}
                {a.ip_address && <span className="font-mono">{a.ip_address}</span>}
                <span>{relativeTime(a.created_at)}</span>
              </div>
            </div>
            <button
              onClick={dismissAll}
              className="shrink-0 text-text-muted hover:text-text-primary"
              title="Bu men — yopish"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 border-t border-line px-3 py-2">
            <button
              onClick={() => {
                dismissAll();
                navigate("/settings");
              }}
              className="text-[11.5px] font-medium text-text-secondary hover:text-text-primary"
            >
              Qurilmalarni ko'rish
            </button>
            <button
              onClick={terminateOthers}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-[11.5px] font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Bu men emasman
            </button>
          </div>
        </div>
      ))}
      {note && (
        <div className="pointer-events-auto rounded-xl border border-line bg-bg-panel px-3 py-2 text-[12px] text-text-secondary shadow-lg">
          {note}
          <button
            onClick={() => setNote(null)}
            className="ml-2 text-text-muted hover:text-text-primary"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
