import { useMemo, useState } from "react";
import {
  Plus,
  Heart,
  Bookmark,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  Play,
  FileText,
  ExternalLink,
  Clock,
  Bold,
  Italic,
  List,
  Link2,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  initialAdvice,
  type AdviceItem,
  type AdviceType,
} from "../data/advice";
import { cn } from "../lib/utils";

const swatches = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const emptyItem = (type: AdviceType, sortOrder: number): AdviceItem => ({
  id: `ADV-${type === "video" ? "V" : "B"}-${Math.floor(Math.random() * 900 + 100)}`,
  type,
  title: "",
  imageUrl: swatches[Math.floor(Math.random() * swatches.length)],
  body: type === "blog" ? "" : undefined,
  url: "",
  durationLabel: type === "video" ? "00:00" : undefined,
  readTimeMinutes: type === "blog" ? 5 : undefined,
  publishedAt: new Date().toLocaleDateString("ru-RU"),
  likes: 0,
  bookmarks: 0,
  isPublished: true,
  sortOrder,
});

export function AdvicePage() {
  const [items, setItems] = useState<AdviceItem[]>(initialAdvice);
  const [tab, setTab] = useState<AdviceType>("video");
  const [editing, setEditing] = useState<AdviceItem | null>(null);

  const list = useMemo(
    () =>
      items
        .filter((i) => i.type === tab)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [items, tab],
  );

  const counts = useMemo(
    () => ({
      video: items.filter((i) => i.type === "video").length,
      blog: items.filter((i) => i.type === "blog").length,
    }),
    [items],
  );

  const totalStats = useMemo(() => {
    const filtered = items.filter((i) => i.type === tab);
    return {
      published: filtered.filter((i) => i.isPublished).length,
      likes: filtered.reduce((s, i) => s + i.likes, 0),
      bookmarks: filtered.reduce((s, i) => s + i.bookmarks, 0),
    };
  }, [items, tab]);

  const togglePublish = (id: string) =>
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, isPublished: !i.isPublished } : i,
      ),
    );

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const save = (item: AdviceItem) => {
    setItems((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      return exists ? prev.map((x) => (x.id === item.id ? item : x)) : [item, ...prev];
    });
    setEditing(null);
  };

  const nextSortOrder =
    items.filter((i) => i.type === tab).reduce((m, i) => Math.max(m, i.sortOrder), 0) + 1;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Maslahatlar"
        subtitle="Foydali videolar va blog yozuvlari"
        actions={
          <button
            className="btn-primary text-[12.5px]"
            onClick={() => setEditing(emptyItem(tab, nextSortOrder))}
          >
            <Plus className="h-4 w-4" />
            Yangi {tab === "video" ? "video" : "yozuv"}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-bg-input p-1 w-fit">
          <button
            onClick={() => setTab("video")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-colors",
              tab === "video"
                ? "bg-brand text-white"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            <Play className="h-3.5 w-3.5" /> Videolar
            <span className="text-[11px] opacity-70">{counts.video}</span>
          </button>
          <button
            onClick={() => setTab("blog")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition-colors",
              tab === "blog"
                ? "bg-brand text-white"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            <FileText className="h-3.5 w-3.5" /> Bloglar
            <span className="text-[11px] opacity-70">{counts.blog}</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-4">
          {[
            { label: "Jami", value: counts[tab], color: "#3B82F6", icon: tab === "video" ? Play : FileText },
            { label: "Chop etilgan", value: totalStats.published, color: "#10B981", icon: Eye },
            { label: "Jami like", value: totalStats.likes.toLocaleString("ru-RU"), color: "#EF4444", icon: Heart },
            { label: "Bookmark qilingan", value: totalStats.bookmarks.toLocaleString("ru-RU"), color: "#F59E0B", icon: Bookmark },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[12px] text-text-secondary">{s.label}</div>
                  <div className="mt-1 text-[22px] font-bold text-text-primary">
                    {s.value}
                  </div>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${s.color}26`, color: s.color }}
                >
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          {list.map((item) => (
            <AdviceCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onTogglePublish={() => togglePublish(item.id)}
              onRemove={() => remove(item.id)}
            />
          ))}
          {list.length === 0 && (
            <div className="col-span-3 rounded-xl border border-dashed border-line py-16 text-center text-[13px] text-text-muted">
              Hozircha {tab === "video" ? "video" : "yozuv"} yo'q
            </div>
          )}
        </div>
      </div>

      {editing && (
        <AdviceFormDrawer
          item={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function AdviceCard({
  item,
  onEdit,
  onTogglePublish,
  onRemove,
}: {
  item: AdviceItem;
  onEdit: () => void;
  onTogglePublish: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "card overflow-hidden transition-opacity",
        !item.isPublished && "opacity-60",
      )}
    >
      <div
        className="relative flex h-40 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${item.imageUrl}, ${item.imageUrl}88)`,
        }}
      >
        {item.type === "video" ? (
          <>
            <Play className="h-12 w-12 text-white/80" fill="currentColor" />
            {item.durationLabel && (
              <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                {item.durationLabel}
              </span>
            )}
          </>
        ) : (
          <FileText className="h-12 w-12 text-white/60" strokeWidth={1.5} />
        )}
        <span
          className={cn(
            "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
            item.isPublished
              ? "bg-status-resolved/90 text-white"
              : "bg-text-muted/90 text-white",
          )}
        >
          {item.isPublished ? "Chop etilgan" : "Qoralama"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-[14px] font-semibold text-text-primary">
          {item.title || "Sarlavhasiz"}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[11.5px] text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {item.type === "video"
              ? item.durationLabel
              : `${item.readTimeMinutes} daqiqa`}
          </span>
          <span>·</span>
          <span>{item.publishedAt}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[11.5px]">
          <div className="flex items-center gap-1.5 text-status-blocked">
            <Heart className="h-3.5 w-3.5" fill="currentColor" />
            <span className="font-semibold">{item.likes.toLocaleString("ru-RU")}</span>
            <span className="text-text-muted">like</span>
          </div>
          <div className="flex items-center gap-1.5 text-status-progress">
            <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
            <span className="font-semibold">{item.bookmarks.toLocaleString("ru-RU")}</span>
            <span className="text-text-muted">saqlangan</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-line pt-3">
          <a
            href={item.url || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11.5px] text-brand hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Havola
          </a>
          <div className="flex items-center gap-1">
            <button
              className={cn(
                "icon-btn h-8 w-8",
                item.isPublished
                  ? "hover:text-status-progress"
                  : "hover:text-status-resolved",
              )}
              onClick={onTogglePublish}
              title={item.isPublished ? "Qoralama qilish" : "Chop etish"}
            >
              {item.isPublished ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button className="icon-btn h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </button>
            <button
              className="icon-btn h-8 w-8 hover:bg-status-blocked/15 hover:text-status-blocked"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdviceFormDrawer({
  item,
  onClose,
  onSave,
}: {
  item: AdviceItem;
  onClose: () => void;
  onSave: (i: AdviceItem) => void;
}) {
  const [draft, setDraft] = useState<AdviceItem>(item);
  const [dragOver, setDragOver] = useState(false);

  const set = <K extends keyof AdviceItem>(key: K, value: AdviceItem[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const wrap = (before: string, after = before) => {
    const body = draft.body ?? "";
    set("body", body + before + "matn" + after);
  };

  const valid = draft.title.trim() && draft.url.trim();

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col border-l border-line bg-bg-panel shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary">
              {draft.title
                ? `Tahrirlash: ${draft.type === "video" ? "Video" : "Blog"}`
                : `Yangi ${draft.type === "video" ? "video" : "yozuv"}`}
            </h2>
            <p className="mt-0.5 font-mono text-[11.5px] text-text-muted">
              {draft.id}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Sarlavha
            </label>
            <input
              className="input"
              placeholder="Bolaning ekran vaqtini qanday cheklash kerak?"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Cover rasm
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                set("imageUrl", swatches[Math.floor(Math.random() * swatches.length)]);
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors",
                dragOver
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-bg-input",
              )}
            >
              <div
                className="mb-2 flex h-16 w-28 items-center justify-center rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${draft.imageUrl}, ${draft.imageUrl}88)`,
                }}
              >
                <ImageIcon className="h-6 w-6 text-white/70" />
              </div>
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-text-muted" />
                <span className="text-[12.5px] font-medium text-text-secondary">
                  Rasmni shu yerga tashlang
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                {draft.type === "video" ? "Video URL (YouTube/Vimeo)" : "Tashqi havola"}
              </label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  className="input pl-9"
                  placeholder={
                    draft.type === "video"
                      ? "https://youtube.com/..."
                      : "https://jojoapp.uz/blog/..."
                  }
                  value={draft.url}
                  onChange={(e) => set("url", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                {draft.type === "video" ? "Davomiyligi (11:38)" : "O'qish vaqti (daqiqa)"}
              </label>
              {draft.type === "video" ? (
                <input
                  className="input"
                  placeholder="11:38"
                  value={draft.durationLabel ?? ""}
                  onChange={(e) => set("durationLabel", e.target.value)}
                />
              ) : (
                <input
                  type="number"
                  className="input"
                  placeholder="5"
                  value={draft.readTimeMinutes ?? 0}
                  onChange={(e) =>
                    set("readTimeMinutes", Number(e.target.value))
                  }
                />
              )}
            </div>
          </div>

          {draft.type === "blog" && (
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Maqola matni
              </label>
              <div className="rounded-lg border border-line bg-bg-input">
                <div className="flex items-center gap-1 border-b border-line p-1.5">
                  <ToolbarButton onClick={() => wrap("**")} title="Qalin">
                    <Bold className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => wrap("*")} title="Kursiv">
                    <Italic className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => wrap("\n- ", "")} title="Ro'yxat">
                    <List className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <span className="ml-auto pr-2 text-[10.5px] text-text-muted">
                    Markdown
                  </span>
                </div>
                <textarea
                  rows={10}
                  className="w-full resize-none rounded-b-lg bg-transparent px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
                  placeholder="Maqola matnini yozing... \n\nParagraflarni \\n\\n bilan ajrating."
                  value={draft.body ?? ""}
                  onChange={(e) => set("body", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Chop etish sanasi
              </label>
              <input
                className="input"
                placeholder="30.05.2025"
                value={draft.publishedAt}
                onChange={(e) => set("publishedAt", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Tartib
              </label>
              <input
                type="number"
                className="input"
                value={draft.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-bg-input p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Statistika (faqat o'qish)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat icon={Heart} color="#EF4444" value={draft.likes} label="Like" />
              <Stat
                icon={Bookmark}
                color="#F59E0B"
                value={draft.bookmarks}
                label="Bookmark"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => set("isPublished", !draft.isPublished)}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-bg-input px-3 py-2.5 text-left transition-colors hover:bg-bg-hover"
          >
            <div>
              <div className="text-[13px] font-medium text-text-primary">
                {draft.isPublished ? "Chop etilgan" : "Qoralama"}
              </div>
              <div className="text-[11px] text-text-muted">
                {draft.isPublished
                  ? "Foydalanuvchilar ilovada ko'rmoqda"
                  : "Ilovada ko'rinmaydi"}
              </div>
            </div>
            <span
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                draft.isPublished ? "bg-brand" : "bg-bg-hover",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  draft.isPublished ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button className="btn-secondary text-[12.5px]" onClick={onClose}>
            Bekor qilish
          </button>
          <button
            className="btn-primary text-[12.5px] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!valid}
            onClick={() => onSave(draft)}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
    >
      {children}
    </button>
  );
}

function Stat({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: typeof Heart;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-bg-card p-2.5">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: `${color}26`, color }}
      >
        <Icon className="h-4 w-4" fill="currentColor" />
      </div>
      <div>
        <div className="text-[15px] font-bold text-text-primary">
          {value.toLocaleString("ru-RU")}
        </div>
        <div className="text-[10.5px] uppercase tracking-wider text-text-muted">
          {label}
        </div>
      </div>
    </div>
  );
}
