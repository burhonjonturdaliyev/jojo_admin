import { useEffect, useRef, useState } from "react";
import { Send, X, Sparkles, Loader2, Bell } from "lucide-react";
import { useT, type Lang } from "../lib/i18n";
import { translateInto, TranslateError } from "../lib/translate";
import { notificationsApi, type AdminUserRow } from "../lib/resources";
import { cn } from "../lib/utils";

const LANG_ORDER: Lang[] = ["uz", "uz_cyrl", "ru", "en"];

const LANG_LABEL: Record<Lang, string> = {
  uz: "O'z",
  uz_cyrl: "Ўз",
  ru: "Ру",
  en: "En",
};

const LANG_FLAG: Record<Lang, string> = {
  uz: "🇺🇿",
  uz_cyrl: "🇺🇿",
  ru: "🇷🇺",
  en: "🇬🇧",
};

type Field = "title" | "body";
type LocalizedField = Record<Lang, string>;

const emptyField = (): LocalizedField => ({
  uz: "",
  uz_cyrl: "",
  ru: "",
  en: "",
});

export function SendNotificationModal({
  user,
  onClose,
  onSent,
}: {
  user: AdminUserRow;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { t, lang } = useT();
  const [activeLang, setActiveLang] = useState<Lang>(lang);
  const [title, setTitle] = useState<LocalizedField>(emptyField);
  const [body, setBody] = useState<LocalizedField>(emptyField);
  const [translating, setTranslating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const sendingRef = useRef(false);

  // Reset success banner whenever the user edits anything.
  useEffect(() => {
    if (success) setSuccess(null);
    // Intentionally only depend on the edited values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body]);

  const set = (field: Field, value: string) => {
    if (field === "title") setTitle((p) => ({ ...p, [activeLang]: value }));
    else setBody((p) => ({ ...p, [activeLang]: value }));
  };

  // Auto-translate from the currently-active language into the other three.
  // `translateInto` issues a single backend round-trip per field that returns
  // all target languages at once (plus server-side uz_cyrl transliteration).
  // Empty source fields are skipped.
  const translateAll = async () => {
    setError(null);
    setTranslating(true);
    try {
      const targets = LANG_ORDER.filter((l) => l !== activeLang);
      const sourceTitle = title[activeLang].trim();
      const sourceBody = body[activeLang].trim();
      if (!sourceTitle && !sourceBody) {
        setError(t("usersNotif.fillSomethingFirst"));
        return;
      }
      const [titleMap, bodyMap] = await Promise.all([
        sourceTitle
          ? translateInto(sourceTitle, activeLang, targets)
          : Promise.resolve({} as Record<Lang, string>),
        sourceBody
          ? translateInto(sourceBody, activeLang, targets)
          : Promise.resolve({} as Record<Lang, string>),
      ]);
      const nextTitle = { ...title };
      const nextBody = { ...body };
      for (const to of targets) {
        if (titleMap[to]) nextTitle[to] = titleMap[to];
        if (bodyMap[to]) nextBody[to] = bodyMap[to];
      }
      setTitle(nextTitle);
      setBody(nextBody);
    } catch (e) {
      setError(
        e instanceof TranslateError ? e.message : t("usersNotif.translateError"),
      );
    } finally {
      setTranslating(false);
    }
  };

  const send = async () => {
    if (sendingRef.current) return;
    setError(null);
    setSuccess(null);

    const titleUz = title.uz.trim();
    const titleRu = title.ru.trim();
    const titleEn = title.en.trim();
    const titleCyrl = title.uz_cyrl.trim();
    const bodyUz = body.uz.trim();
    const bodyRu = body.ru.trim();
    const bodyEn = body.en.trim();
    const bodyCyrl = body.uz_cyrl.trim();

    // Backend's broadcast endpoint requires `title` and `body` (the primary
    // language). Fall back to whichever variant the operator filled in.
    const primaryTitle =
      titleUz || titleRu || titleEn || titleCyrl;
    const primaryBody = bodyUz || bodyRu || bodyEn || bodyCyrl;

    if (!primaryTitle) {
      setError(t("usersNotif.titleRequired"));
      return;
    }
    if (!primaryBody) {
      setError(t("usersNotif.bodyRequired"));
      return;
    }

    sendingRef.current = true;
    setSending(true);
    try {
      const res = await notificationsApi.broadcast({
        title: primaryTitle,
        body: primaryBody,
        title_uz_cyrl: titleCyrl || undefined,
        body_uz_cyrl: bodyCyrl || undefined,
        title_ru: titleRu || undefined,
        body_ru: bodyRu || undefined,
        title_en: titleEn || undefined,
        body_en: bodyEn || undefined,
        category: "personal",
        audience: "selected",
        parent_ids: [user.id],
      });
      if ((res.sent ?? 0) > 0) {
        setSuccess(t("usersNotif.sentOk"));
        onSent?.();
      } else {
        // sent === 0 means the parent had no push token registered. Surface
        // it explicitly so the operator doesn't think nothing happened.
        setError(t("usersNotif.notDeliverable"));
      }
    } catch (e) {
      setError(
        (e as { message?: string }).message ?? t("usersNotif.sendError"),
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const displayName =
    (user.full_name && user.full_name.trim()) ||
    user.phone ||
    `#${user.id}`;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-bg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[15.5px] font-semibold text-text-primary">
                {t("usersNotif.title")}
              </h3>
              <p className="mt-0.5 text-[11.5px] text-text-muted">
                {t("usersNotif.subtitle", { name: displayName })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Language tabs */}
        <div className="mb-3 flex items-center gap-1 rounded-lg border border-line bg-bg-input p-1">
          {LANG_ORDER.map((l) => {
            const filled = title[l].trim() || body[l].trim();
            return (
              <button
                key={l}
                type="button"
                onClick={() => setActiveLang(l)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors flex items-center justify-center gap-1",
                  activeLang === l
                    ? "bg-primary/15 text-primary"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <span>{LANG_FLAG[l]}</span>
                <span>{LANG_LABEL[l]}</span>
                {filled && (
                  <span
                    className={cn(
                      "ml-0.5 h-1.5 w-1.5 rounded-full",
                      activeLang === l ? "bg-primary" : "bg-status-resolved",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("usersNotif.titleField")}
            </label>
            <input
              value={title[activeLang]}
              onChange={(e) => set("title", e.target.value)}
              maxLength={80}
              placeholder={t("usersNotif.titlePh")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-text-secondary">
              {t("usersNotif.bodyField")}
            </label>
            <textarea
              value={body[activeLang]}
              onChange={(e) => set("body", e.target.value)}
              rows={4}
              maxLength={400}
              placeholder={t("usersNotif.bodyPh")}
              className="w-full resize-none rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
            />
            <div className="mt-0.5 text-right text-[10.5px] text-text-muted">
              {body[activeLang].length}/400
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={translateAll}
          disabled={translating || sending}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[12px] font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
          title={t("usersNotif.translateHint")}
        >
          {translating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {translating
            ? t("usersNotif.translating")
            : t("usersNotif.translateAll", { lang: LANG_LABEL[activeLang] })}
        </button>

        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600">
            ✓ {success}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-secondary text-[12.5px]"
            disabled={sending}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={send}
            disabled={sending}
            className="btn-primary text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {sending ? t("usersNotif.sending") : t("usersNotif.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
