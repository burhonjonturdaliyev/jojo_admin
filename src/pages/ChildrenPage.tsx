import { useCallback, useEffect, useState } from "react";
import {
  Baby,
  CircleUser,
  User as UserIcon,
  Pencil,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Eye,
  Smartphone,
  Phone as PhoneIcon,
  Globe,
  Calendar,
  Activity as ActivityIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { useT } from "../lib/i18n";
import {
  childrenApi,
  type AdminChild,
  type AdminChildFull,
} from "../lib/resources";

type LangInfo = { code: string; flag: string; label: string; name: string };
function langInfo(raw?: string): LangInfo | null {
  const r = (raw || "").toLowerCase();
  if (!r) return null;
  if (r.startsWith("uz")) {
    if (r.includes("cyr"))
      return { code: "uz_cyrl", flag: "🇺🇿", label: "UZ-Cyr", name: "Ўзбек кирилл" };
    return { code: "uz_latn", flag: "🇺🇿", label: "UZ", name: "O'zbek lotin" };
  }
  if (r.startsWith("ru")) return { code: "ru", flag: "🇷🇺", label: "RU", name: "Русский" };
  if (r.startsWith("en")) return { code: "en", flag: "🇬🇧", label: "EN", name: "English" };
  return null;
}

export function ChildrenPage() {
  const { t } = useT();
  const [items, setItems] = useState<AdminChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminChild | null>(null);
  const [viewing, setViewing] = useState<AdminChild | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    childrenApi
      .list({ page_size: 100 })
      .then((r) => setItems(r.results))
      .catch((e) => console.error("children load", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = async (c: AdminChild) => {
    const name = c.first_name || c.username || `#${c.id}`;
    if (!confirm(t("users.confirmDelete", { name }))) return;
    try {
      await childrenApi.remove(c.id);
      setItems((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.children")}
        subtitle={`${items.length} ta bola tizimda`}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="card overflow-hidden">
          <table className="min-w-full text-[13px]">
            <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">{t("nav.children")}</th>
                <th className="px-4 py-3">{t("users.col.parent")}</th>
                <th className="px-4 py-3">{t("users.col.age")}</th>
                <th className="px-4 py-3">{t("users.col.gender")}</th>
                <th className="px-4 py-3">{t("users.col.language")}</th>
                <th className="px-4 py-3">{t("users.col.device")}</th>
                <th className="px-4 py-3">{t("users.col.status")}</th>
                <th className="px-4 py-3">{t("user.connected")}</th>
                <th className="px-4 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-text-muted">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    <Baby className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    {t("users.empty.children")}
                  </td>
                </tr>
              )}
              {items.map((c) => {
                const status = c.child_status || (c.is_active ? "active" : "non_active");
                const isInactive = status !== "active";
                const lang = langInfo(c.language);
                const genderLabel =
                  c.gender === "male"
                    ? t("lead.genderMale")
                    : c.gender === "female"
                      ? t("lead.genderFemale")
                      : t("child.gender.unknown");
                const statusKey =
                  status === "active"
                    ? "child.status.active"
                    : status === "non_active"
                      ? "child.status.non_active"
                      : "child.status.unknown";
                return (
                <tr
                  key={c.id}
                  className={
                    "border-b border-line/50 transition-colors " +
                    (isInactive
                      ? "bg-red-500/[0.03] hover:bg-red-500/[0.06]"
                      : "hover:bg-bg-hover")
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          "relative flex h-9 w-9 items-center justify-center rounded-lg " +
                          (isInactive
                            ? "bg-red-500/15 text-red-500"
                            : "bg-orange-500/15 text-orange-500")
                        }
                      >
                        <CircleUser className="h-5 w-5" />
                        {isInactive && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg ring-2 ring-bg">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          </span>
                        )}
                      </div>
                      <div>
                        <div
                          className={
                            "font-medium " +
                            (isInactive ? "text-text-secondary" : "text-text-primary")
                          }
                        >
                          {c.first_name || c.username || "—"}
                        </div>
                        <div className="text-[11px] text-text-muted">#{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.parent ? (
                      <Link
                        to={`/users?focus=${c.parent.id}`}
                        className="group flex items-center gap-2 rounded-md hover:bg-bg-hover px-1 py-1 -mx-1"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/15 text-blue-500 group-hover:bg-blue-500/25">
                          <UserIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="leading-tight">
                          <div className="text-[12.5px] font-medium text-text-primary group-hover:text-blue-500">
                            {c.parent.full_name || c.parent.first_name || "—"}
                          </div>
                          <div className="text-[11px] text-text-muted font-mono">
                            {c.parent.phone}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <span className="text-[11.5px] text-text-muted italic">
                        {t("users.unlinked")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.age ?? "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{genderLabel}</td>
                  <td className="px-4 py-3">
                    {lang ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-bg-input px-2 py-0.5 text-[11.5px] font-medium text-text-secondary"
                        title={lang.name}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    ) : (
                      <span className="text-[12px] text-text-muted">{t("child.lang.unknown")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.device ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12.5px] text-text-secondary">
                          {[c.device.brand, c.device.model].filter(Boolean).join(" ").trim() ||
                            (c.device.type?.toLowerCase() === "ios" ? "iPhone" : "Android")}
                        </span>
                        {c.device.os_version && (
                          <span className="text-[10.5px] text-text-muted">
                            {c.device.type?.toLowerCase() === "ios" ? "iOS" : "Android"} {c.device.os_version}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[12px] text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                        (isInactive
                          ? "bg-red-500/15 text-red-500 ring-1 ring-red-500/30"
                          : "bg-emerald-500/15 text-emerald-500")
                      }
                    >
                      {isInactive ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {t(statusKey)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(c.date_joined).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewing(c)}
                        className="icon-btn h-7 w-7"
                        title="Bola ma'lumotlari"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditing(c)}
                        className="icon-btn h-7 w-7"
                        title={t("common.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ChildEditor
          child={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setItems((prev) => prev.map((x) => (x.id === saved.id ? { ...x, ...saved } : x)));
            setEditing(null);
          }}
        />
      )}
      {viewing && (
        <ChildInfoModal childId={viewing.id} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

const ACTIVITY_DOT_CHILD: Record<string, string> = {
  child_registered: "bg-primary",
  child_parent_linked: "bg-purple-500",
  child_last_login: "bg-emerald-500",
  child_sos_sent: "bg-red-500",
  child_daily_activity: "bg-indigo-500",
  child_location_visit: "bg-cyan-500",
  child_about_notification: "bg-blue-500",
};

function ChildInfoModal({
  childId,
  onClose,
}: {
  childId: number;
  onClose: () => void;
}) {
  const { t } = useT();
  const [data, setData] = useState<AdminChildFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    childrenApi
      .full(childId)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e) => {
        if (!cancelled)
          setError((e as { message?: string }).message || "Xato");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return (
        d.toLocaleDateString("uz-UZ", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return iso;
    }
  };

  const langText = (code?: string) => {
    const info = langInfo(code);
    return info ? `${info.flag} ${info.name}` : "—";
  };

  const c = data?.child;
  const name =
    c?.full_name?.trim() ||
    [c?.first_name, c?.last_name].filter(Boolean).join(" ").trim() ||
    c?.username ||
    c?.phone ||
    `#${childId}`;
  const status = c?.child_status || (c?.is_active ? "active" : "non_active");
  const isInactive = status !== "active";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-bg h-full overflow-y-auto scrollbar-thin shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={
                "relative flex h-10 w-10 items-center justify-center rounded-lg " +
                (isInactive
                  ? "bg-red-500/15 text-red-500"
                  : "bg-orange-500/15 text-orange-500")
              }
            >
              <CircleUser className="h-5 w-5" />
              {isInactive && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg ring-2 ring-bg">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                </span>
              )}
            </div>
            <div>
              <div className="text-[15px] font-semibold text-text-primary">
                {name}
              </div>
              <div className="text-[11.5px] text-text-muted">Bola · #{childId}</div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="p-8 text-center text-text-muted text-[13px]">
            {t("common.loading")}
          </div>
        )}
        {error && (
          <div className="m-5 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
            {error}
          </div>
        )}

        {data && c && (
          <div className="space-y-4 p-5">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] font-semibold text-text-secondary">
                  Profil
                </div>
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                    (isInactive
                      ? "bg-red-500/15 text-red-500 ring-1 ring-red-500/30"
                      : "bg-emerald-500/15 text-emerald-500")
                  }
                >
                  {isInactive ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {t(
                    status === "active"
                      ? "child.status.active"
                      : status === "non_active"
                        ? "child.status.non_active"
                        : "child.status.unknown",
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <ChildInfoRow icon={<PhoneIcon className="h-3.5 w-3.5" />} label="Telefon" value={c.phone || "—"} mono />
                <ChildInfoRow
                  icon={<UserIcon className="h-3.5 w-3.5" />}
                  label={t("users.col.gender")}
                  value={
                    c.gender === "male"
                      ? t("lead.genderMale")
                      : c.gender === "female"
                        ? t("lead.genderFemale")
                        : t("child.gender.unknown")
                  }
                />
                <ChildInfoRow icon={<Globe className="h-3.5 w-3.5" />} label={t("users.col.language")} value={langText(c.language)} />
                <ChildInfoRow icon={<Baby className="h-3.5 w-3.5" />} label={t("users.col.age")} value={c.age != null ? String(c.age) : "—"} />
                <ChildInfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Qo'shilgan" value={fmtDate(c.date_joined)} />
                <ChildInfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Oxirgi faollik" value={fmtDate(c.last_login)} />
              </div>
            </div>

            <div className="card p-4">
              <div className="text-[12px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" /> Ota-onalar ({data.parents.length})
              </div>
              {data.parents.length === 0 ? (
                <div className="text-[12px] text-text-muted italic">Ulangan ota-ona yo'q</div>
              ) : (
                <div className="space-y-2">
                  {data.parents.map((p) => (
                    <Link
                      key={p.id}
                      to={`/users?focus=${p.id}`}
                      className="flex items-center gap-3 rounded-lg bg-bg-input px-3 py-2 hover:bg-bg-hover"
                    >
                      <Avatar name={p.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-text-primary truncate">{p.name}</div>
                        {p.phone && (
                          <div className="text-[11px] text-text-muted font-mono">{p.phone}</div>
                        )}
                      </div>
                      {p.linked_at && (
                        <div className="text-[10.5px] text-text-muted">
                          {fmtDate(p.linked_at)}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="text-[12px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Qurilmalar ({data.devices.length})
              </div>
              {data.devices.length === 0 ? (
                <div className="text-[12px] text-text-muted italic">Qurilmalar yo'q</div>
              ) : (
                <div className="space-y-2">
                  {data.devices.map((d) => (
                    <div key={d.id} className="rounded-lg bg-bg-input px-3 py-2 text-[12px]">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-text-primary">
                          {(d.brand || d.model)
                            ? `${d.brand ?? ""} ${d.model ?? ""}`.trim()
                            : d.type === "ios"
                              ? "iPhone"
                              : "Android"}
                        </div>
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] font-medium " +
                            (d.is_active
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-text-muted/15 text-text-muted")
                          }
                        >
                          {d.is_active ? "Faol" : "Nofaol"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-text-muted">
                        {d.os_version && (
                          <span>
                            {d.type === "ios" ? "iOS" : "Android"} {d.os_version}
                          </span>
                        )}
                        {d.app_version && (
                          <span className="text-blue-500 font-medium">Jojo Kids v{d.app_version}</span>
                        )}
                        {d.last_login_at && <span>· Login: {fmtDate(d.last_login_at)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="text-[12px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                <ActivityIcon className="h-3.5 w-3.5" /> Faollik tarixi ({data.activity.length})
              </div>
              {data.activity.length === 0 ? (
                <div className="text-[12px] text-text-muted italic">{t("lead.noActivityRecords")}</div>
              ) : (
                <div className="space-y-2">
                  {data.activity.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-bg-input px-3 py-2"
                    >
                      <div
                        className={
                          "h-2 w-2 rounded-full mt-1.5 shrink-0 " +
                          (ACTIVITY_DOT_CHILD[a.type] || "bg-text-muted")
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] text-text-primary">
                          {t(a.i18n_key, a.params)}
                        </div>
                        <div className="text-[10.5px] text-text-muted">
                          {fmtDate(a.at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChildInfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1 text-[10.5px] text-text-muted">
        {icon}
        {label}
      </div>
      <div className={"text-text-primary truncate" + (mono ? " font-mono" : "")}>{value}</div>
    </div>
  );
}

function ChildEditor({
  child,
  onClose,
  onSaved,
}: {
  child: AdminChild;
  onClose: () => void;
  onSaved: (c: AdminChild) => void;
}) {
  const [firstName, setFirstName] = useState(child.first_name || "");
  const [phone, setPhone] = useState(child.phone || "");
  const [username, setUsername] = useState(child.username || "");
  const [age, setAge] = useState<string>(child.age != null ? String(child.age) : "");
  const [gender, setGender] = useState(child.gender || "");
  const [language, setLanguage] = useState(child.language || "uz");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await childrenApi.update(child.id, {
        first_name: firstName.trim(),
        phone: phone.trim(),
        username: username.trim(),
        age: age.trim() === "" ? null : Number(age),
        gender: gender.trim(),
        language: language.trim(),
      });
      onSaved(r);
    } catch (e) {
      alert((e as { message?: string }).message || "Xato");
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
        className="bg-bg w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            Bolani tahrirlash
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">Ism</div>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">Telefon</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-text-secondary mb-1">Username</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">Yosh</div>
              <input
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">Jinsi</div>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              >
                <option value="">—</option>
                <option value="male">Erkak</option>
                <option value="female">Ayol</option>
              </select>
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-text-secondary mb-1">Til</div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
              >
                <option value="uz">UZ</option>
                <option value="ru">RU</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            Bekor
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
