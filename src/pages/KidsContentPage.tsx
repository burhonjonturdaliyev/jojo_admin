import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Gamepad2,
  Plus,
  Pencil,
  Trash2,
  X,
  FolderTree,
  Search,
  Video as Youtube,
  PlayCircle,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import { MultilangInput, buildLangValue } from "../components/MultilangInput";
import { useT } from "../lib/i18n";
import {
  kidsContentApi,
  kidsVideosApi,
  extractYouTubeId,
  type AdminGame,
  type AdminGameCategory,
  type AdminKidsVideo,
  type AdminKidsVideoCategory,
} from "../lib/resources";

type Tab = "games" | "categories" | "videos" | "video_categories";

export function KidsContentPage() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("games");
  const [categories, setCategories] = useState<AdminGameCategory[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [videos, setVideos] = useState<AdminKidsVideo[]>([]);
  const [videoCategories, setVideoCategories] = useState<AdminKidsVideoCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<number | null>(null);
  const [filterVideoCat, setFilterVideoCat] = useState<number | null>(null);
  const [videoSearch, setVideoSearch] = useState("");
  const [editingGame, setEditingGame] = useState<AdminGame | null>(null);
  const [editingCat, setEditingCat] = useState<AdminGameCategory | null>(null);
  const [editingVideo, setEditingVideo] = useState<AdminKidsVideo | null>(null);
  const [editingVideoCat, setEditingVideoCat] =
    useState<AdminKidsVideoCategory | null>(null);

  const reloadCats = useCallback(async () => {
    const r = await kidsContentApi.categories.list();
    setCategories(r.results || []);
  }, []);

  const reloadGames = useCallback(async () => {
    const r = await kidsContentApi.games.list({
      category_id: filterCat ?? undefined,
      q: search || undefined,
    });
    setGames(r.results || []);
  }, [filterCat, search]);

  const reloadVideoCats = useCallback(async () => {
    const r = await kidsVideosApi.categories.list();
    setVideoCategories(r.results || []);
  }, []);

  const reloadVideos = useCallback(async () => {
    const r = await kidsVideosApi.videos.list({
      category_id: filterVideoCat ?? undefined,
      q: videoSearch || undefined,
    });
    setVideos(r.results || []);
  }, [filterVideoCat, videoSearch]);

  useEffect(() => {
    setLoading(true);
    Promise.all([reloadCats(), reloadGames(), reloadVideoCats(), reloadVideos()])
      .finally(() => setLoading(false));
  }, [reloadCats, reloadGames, reloadVideoCats, reloadVideos]);

  const removeGame = async (id: number) => {
    if (!confirm(t("kidsContent.confirmDeleteGame"))) return;
    await kidsContentApi.games.remove(id);
    void reloadGames();
  };
  const removeCat = async (id: number) => {
    if (!confirm(t("kidsContent.confirmDeleteGameCategory")))
      return;
    await kidsContentApi.categories.remove(id);
    void reloadCats();
    void reloadGames();
  };
  const removeVideo = async (id: number) => {
    if (!confirm(t("kidsContent.confirmDeleteVideo"))) return;
    await kidsVideosApi.videos.remove(id);
    void reloadVideos();
  };
  const removeVideoCat = async (id: number) => {
    if (!confirm(t("kidsContent.confirmDeleteVideoCategory")))
      return;
    await kidsVideosApi.categories.remove(id);
    void reloadVideoCats();
    void reloadVideos();
  };

  const headerSubtitle = useMemo(() => {
    return t("kidsContent.headerSubtitle", {
      games: games.length,
      videos: videos.length,
      categories: categories.length + videoCategories.length,
    });
  }, [t, games.length, videos.length, categories.length, videoCategories.length]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("kidsContent.pageTitle")}
        subtitle={headerSubtitle}
        actions={
          tab === "games" ? (
            <button
              onClick={() =>
                setEditingGame({
                  id: 0,
                  category: categories[0]?.id ?? 0,
                  title: "",
                  description: "",
                  thumbnail: null,
                  banner: null,
                  game_url: "",
                  screen_key: "",
                  age_min: 3,
                  age_max: 12,
                  reward_points: 0,
                  is_active: true,
                  is_featured: false,
                  order: 0,
                })
              }
              className="btn-primary text-[12.5px]"
            >
              <Plus className="h-4 w-4" /> {t("kidsContent.newGame")}
            </button>
          ) : tab === "categories" ? (
            <button
              onClick={() =>
                setEditingCat({
                  id: 0,
                  name: "",
                  icon: null,
                  is_active: true,
                  order: categories.length,
                  games_count: 0,
                })
              }
              className="btn-primary text-[12.5px]"
            >
              <Plus className="h-4 w-4" /> {t("kidsContent.newCategory")}
            </button>
          ) : tab === "videos" ? (
            <button
              onClick={() =>
                setEditingVideo({
                  id: 0,
                  category: videoCategories[0]?.id ?? 0,
                  title: "",
                  title_ru: "",
                  title_en: "",
                  description: "",
                  description_ru: "",
                  description_en: "",
                  youtube_url: "",
                  thumbnail: null,
                  duration_label: "",
                  age_min: 3,
                  age_max: 12,
                  is_active: true,
                  is_featured: false,
                  order: 0,
                })
              }
              className="btn-primary text-[12.5px]"
            >
              <Plus className="h-4 w-4" /> {t("kidsContent.newVideo")}
            </button>
          ) : (
            <button
              onClick={() =>
                setEditingVideoCat({
                  id: 0,
                  name: "",
                  name_ru: "",
                  name_en: "",
                  icon: null,
                  is_active: true,
                  order: videoCategories.length,
                  videos_count: 0,
                })
              }
              className="btn-primary text-[12.5px]"
            >
              <Plus className="h-4 w-4" /> {t("kidsContent.newVideoCategory")}
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {/* Tabs */}
        <div className="card p-2 inline-flex gap-1 mb-4 flex-wrap">
          <TabButton
            active={tab === "games"}
            onClick={() => setTab("games")}
            icon={<Gamepad2 className="h-4 w-4" />}
            label={t("kidsContent.tab.games")}
          />
          <TabButton
            active={tab === "categories"}
            onClick={() => setTab("categories")}
            icon={<FolderTree className="h-4 w-4" />}
            label={t("kidsContent.tab.categories")}
          />
          <TabButton
            active={tab === "videos"}
            onClick={() => setTab("videos")}
            icon={<Youtube className="h-4 w-4" />}
            label={t("kidsContent.tab.videos")}
          />
          <TabButton
            active={tab === "video_categories"}
            onClick={() => setTab("video_categories")}
            icon={<FolderTree className="h-4 w-4" />}
            label={t("kidsContent.tab.videoCategories")}
          />
        </div>

        {tab === "games" && (
          <GamesPanel
            loading={loading}
            games={games}
            categories={categories}
            search={search}
            setSearch={setSearch}
            filterCat={filterCat}
            setFilterCat={setFilterCat}
            onReload={reloadGames}
            onEdit={setEditingGame}
            onRemove={removeGame}
          />
        )}

        {tab === "categories" && (
          <CategoriesPanel
            loading={loading}
            categories={categories}
            onEdit={setEditingCat}
            onRemove={removeCat}
          />
        )}

        {tab === "videos" && (
          <VideosPanel
            loading={loading}
            videos={videos}
            categories={videoCategories}
            search={videoSearch}
            setSearch={setVideoSearch}
            filterCat={filterVideoCat}
            setFilterCat={setFilterVideoCat}
            onReload={reloadVideos}
            onEdit={setEditingVideo}
            onRemove={removeVideo}
          />
        )}

        {tab === "video_categories" && (
          <VideoCategoriesPanel
            loading={loading}
            categories={videoCategories}
            onEdit={setEditingVideoCat}
            onRemove={removeVideoCat}
          />
        )}
      </div>

      {editingGame && (
        <GameEditor
          game={editingGame}
          categories={categories}
          onClose={() => setEditingGame(null)}
          onSaved={() => {
            setEditingGame(null);
            void reloadGames();
          }}
        />
      )}
      {editingCat && (
        <CategoryEditor
          cat={editingCat}
          onClose={() => setEditingCat(null)}
          onSaved={() => {
            setEditingCat(null);
            void reloadCats();
          }}
        />
      )}
      {editingVideo && (
        <VideoEditor
          video={editingVideo}
          categories={videoCategories}
          onClose={() => setEditingVideo(null)}
          onSaved={() => {
            setEditingVideo(null);
            void reloadVideos();
          }}
        />
      )}
      {editingVideoCat && (
        <VideoCategoryEditor
          cat={editingVideoCat}
          onClose={() => setEditingVideoCat(null)}
          onSaved={() => {
            setEditingVideoCat(null);
            void reloadVideoCats();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Shared UI bits
// ============================================================================

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium " +
        (active
          ? "bg-primary text-white"
          : "text-text-secondary hover:bg-bg-hover")
      }
    >
      {icon} {label}
    </button>
  );
}

// ============================================================================
// Games panel (existing pattern, untouched UX)
// ============================================================================

function GamesPanel({
  loading,
  games,
  categories,
  search,
  setSearch,
  filterCat,
  setFilterCat,
  onReload,
  onEdit,
  onRemove,
}: {
  loading: boolean;
  games: AdminGame[];
  categories: AdminGameCategory[];
  search: string;
  setSearch: (s: string) => void;
  filterCat: number | null;
  setFilterCat: (n: number | null) => void;
  onReload: () => void;
  onEdit: (g: AdminGame) => void;
  onRemove: (id: number) => void;
}) {
  const { t } = useT();
  return (
    <>
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onReload()}
              placeholder={t("kidsContent.search.gamePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <select
            value={filterCat ?? ""}
            onChange={(e) =>
              setFilterCat(e.target.value ? Number(e.target.value) : null)
            }
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none"
          >
            <option value="">{t("kidsContent.filter.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-3 py-12 text-center text-text-muted">
            {t("common.loading")}
          </div>
        )}
        {!loading && games.length === 0 && (
          <div className="col-span-3 py-12 text-center text-text-muted">
            <Gamepad2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
            {t("kidsContent.empty.games")}
          </div>
        )}
        {games.map((g) => (
          <div key={g.id} className="card overflow-hidden">
            <div className="h-36 bg-bg-input flex items-center justify-center">
              {g.thumbnail ? (
                <img
                  src={g.thumbnail}
                  alt={g.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Gamepad2 className="h-10 w-10 text-text-muted opacity-40" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14px] font-semibold text-text-primary line-clamp-2">
                  {g.title}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(g)}
                    className="icon-btn h-7 w-7"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove(g.id)}
                    className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-1 text-[11.5px] text-text-secondary">
                {g.category_name ?? "—"}
              </div>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10.5px] font-medium text-blue-500">
                  {t("kidsContent.ageRange", { min: g.age_min, max: g.age_max })}
                </span>
                {g.reward_points > 0 && (
                  <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10.5px] font-medium text-yellow-600">
                    {t("kidsContent.rewardPoints", { points: g.reward_points })}
                  </span>
                )}
                {g.is_featured && (
                  <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10.5px] font-medium text-purple-500">
                    {t("kidsContent.featured")}
                  </span>
                )}
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
                    (g.is_active
                      ? "bg-status-resolved/15 text-status-resolved"
                      : "bg-text-muted/15 text-text-muted")
                  }
                >
                  {g.is_active ? t("common.active") : t("common.inactive")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CategoriesPanel({
  loading,
  categories,
  onEdit,
  onRemove,
}: {
  loading: boolean;
  categories: AdminGameCategory[];
  onEdit: (c: AdminGameCategory) => void;
  onRemove: (id: number) => void;
}) {
  const { t } = useT();
  return (
    <div className="card overflow-hidden">
      <table className="min-w-full text-[13px]">
        <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          <tr>
            <th className="px-4 py-3 w-16">{t("kidsContent.col.id")}</th>
            <th className="px-4 py-3">{t("kidsContent.col.name")}</th>
            <th className="px-4 py-3 w-28">{t("kidsContent.col.games")}</th>
            <th className="px-4 py-3 w-24">{t("kidsContent.col.order")}</th>
            <th className="px-4 py-3 w-28">{t("kidsContent.col.status")}</th>
            <th className="px-4 py-3 w-28 text-right">{t("kidsContent.col.action")}</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                {t("common.loading")}
              </td>
            </tr>
          )}
          {!loading && categories.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                <FolderTree className="mx-auto mb-2 h-8 w-8 opacity-40" />
                {t("kidsContent.empty.categories")}
              </td>
            </tr>
          )}
          {categories.map((c) => (
            <tr key={c.id} className="border-b border-line/50 hover:bg-bg-hover">
              <td className="px-4 py-3 font-mono text-[11.5px] text-text-muted">
                #{c.id}
              </td>
              <td className="px-4 py-3 font-medium text-text-primary flex items-center gap-2">
                {c.icon ? (
                  <img
                    src={c.icon}
                    className="h-8 w-8 rounded-lg object-cover"
                    alt=""
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-bg-input flex items-center justify-center">
                    <FolderTree className="h-4 w-4 text-text-muted" />
                  </div>
                )}
                {c.name}
              </td>
              <td className="px-4 py-3 text-text-secondary">{c.games_count}</td>
              <td className="px-4 py-3 text-text-secondary">{c.order}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[10.5px] font-medium " +
                    (c.is_active
                      ? "bg-status-resolved/15 text-status-resolved"
                      : "bg-text-muted/15 text-text-muted")
                  }
                >
                  {c.is_active ? t("common.active") : t("common.inactive")}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(c)}
                  className="icon-btn h-7 w-7"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onRemove(c.id)}
                  className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked ml-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Videos panel — YouTube kontenti
// ============================================================================

function VideosPanel({
  loading,
  videos,
  categories,
  search,
  setSearch,
  filterCat,
  setFilterCat,
  onReload,
  onEdit,
  onRemove,
}: {
  loading: boolean;
  videos: AdminKidsVideo[];
  categories: AdminKidsVideoCategory[];
  search: string;
  setSearch: (s: string) => void;
  filterCat: number | null;
  setFilterCat: (n: number | null) => void;
  onReload: () => void;
  onEdit: (v: AdminKidsVideo) => void;
  onRemove: (id: number) => void;
}) {
  const { t } = useT();
  return (
    <>
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onReload()}
              placeholder={t("kidsContent.search.videoPlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input pl-9 pr-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <select
            value={filterCat ?? ""}
            onChange={(e) =>
              setFilterCat(e.target.value ? Number(e.target.value) : null)
            }
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none"
          >
            <option value="">{t("kidsContent.filter.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-3 py-12 text-center text-text-muted">
            {t("common.loading")}
          </div>
        )}
        {!loading && videos.length === 0 && (
          <div className="col-span-3 py-12 text-center text-text-muted">
            <Youtube className="mx-auto mb-2 h-8 w-8 opacity-40" />
            {t("kidsContent.empty.videos")}
          </div>
        )}
        {videos.map((v) => (
          <div key={v.id} className="card overflow-hidden">
            <div className="relative h-36 bg-bg-input flex items-center justify-center">
              {v.thumbnail_url ? (
                <img
                  src={v.thumbnail_url}
                  alt={v.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Youtube className="h-10 w-10 text-text-muted opacity-40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                <PlayCircle className="h-3 w-3" />
                {v.duration_label || "YouTube"}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14px] font-semibold text-text-primary line-clamp-2">
                  {v.title}
                </h3>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(v)}
                    className="icon-btn h-7 w-7"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove(v.id)}
                    className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-1 text-[11.5px] text-text-secondary">
                {v.category_name ?? "—"}
              </div>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10.5px] font-medium text-blue-500">
                  {t("kidsContent.ageRange", { min: v.age_min, max: v.age_max })}
                </span>
                {v.title_ru && (
                  <span className="rounded-full bg-bg-input px-2 py-0.5 text-[10.5px] font-medium text-text-secondary">
                    Ру
                  </span>
                )}
                {v.title_en && (
                  <span className="rounded-full bg-bg-input px-2 py-0.5 text-[10.5px] font-medium text-text-secondary">
                    En
                  </span>
                )}
                {v.is_featured && (
                  <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10.5px] font-medium text-purple-500">
                    {t("kidsContent.featured")}
                  </span>
                )}
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
                    (v.is_active
                      ? "bg-status-resolved/15 text-status-resolved"
                      : "bg-text-muted/15 text-text-muted")
                  }
                >
                  {v.is_active ? t("common.active") : t("common.inactive")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function VideoCategoriesPanel({
  loading,
  categories,
  onEdit,
  onRemove,
}: {
  loading: boolean;
  categories: AdminKidsVideoCategory[];
  onEdit: (c: AdminKidsVideoCategory) => void;
  onRemove: (id: number) => void;
}) {
  const { t } = useT();
  return (
    <div className="card overflow-hidden">
      <table className="min-w-full text-[13px]">
        <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          <tr>
            <th className="px-4 py-3 w-16">{t("kidsContent.col.id")}</th>
            <th className="px-4 py-3">{t("kidsContent.col.nameUz")}</th>
            <th className="px-4 py-3">{t("kidsContent.col.translation")}</th>
            <th className="px-4 py-3 w-28">{t("kidsContent.col.videos")}</th>
            <th className="px-4 py-3 w-24">{t("kidsContent.col.order")}</th>
            <th className="px-4 py-3 w-28">{t("kidsContent.col.status")}</th>
            <th className="px-4 py-3 w-28 text-right">{t("kidsContent.col.action")}</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                {t("common.loading")}
              </td>
            </tr>
          )}
          {!loading && categories.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                <FolderTree className="mx-auto mb-2 h-8 w-8 opacity-40" />
                {t("kidsContent.empty.categories")}
              </td>
            </tr>
          )}
          {categories.map((c) => (
            <tr key={c.id} className="border-b border-line/50 hover:bg-bg-hover">
              <td className="px-4 py-3 font-mono text-[11.5px] text-text-muted">
                #{c.id}
              </td>
              <td className="px-4 py-3 font-medium text-text-primary flex items-center gap-2">
                {c.icon ? (
                  <img
                    src={c.icon}
                    className="h-8 w-8 rounded-lg object-cover"
                    alt=""
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-bg-input flex items-center justify-center">
                    <FolderTree className="h-4 w-4 text-text-muted" />
                  </div>
                )}
                {c.name}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                <div className="flex flex-col gap-0.5 text-[11.5px]">
                  <span>
                    <span className="opacity-50 mr-1">Ру:</span>
                    {c.name_ru || "—"}
                  </span>
                  <span>
                    <span className="opacity-50 mr-1">En:</span>
                    {c.name_en || "—"}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary">{c.videos_count}</td>
              <td className="px-4 py-3 text-text-secondary">{c.order}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[10.5px] font-medium " +
                    (c.is_active
                      ? "bg-status-resolved/15 text-status-resolved"
                      : "bg-text-muted/15 text-text-muted")
                  }
                >
                  {c.is_active ? t("common.active") : t("common.inactive")}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(c)}
                  className="icon-btn h-7 w-7"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onRemove(c.id)}
                  className="icon-btn h-7 w-7 hover:bg-status-blocked/15 hover:text-status-blocked ml-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Existing Game editors (unchanged)
// ============================================================================

function GameEditor({
  game,
  categories,
  onClose,
  onSaved,
}: {
  game: AdminGame;
  categories: AdminGameCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [d, setD] = useState(game);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      if (d.id === 0) {
        await kidsContentApi.games.create(d);
      } else {
        await kidsContentApi.games.update(d.id, d);
      }
      onSaved();
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
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
        className="bg-bg w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {d.id === 0 ? t("kidsContent.editor.gameNew") : t("kidsContent.editor.gameEdit")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <ImageUpload
              value={d.thumbnail}
              onChange={(url) => setD({ ...d, thumbnail: url })}
              folder="uploads"
              label={t("kidsContent.editor.thumbnailLabel")}
            />
          </div>
          <div className="col-span-2">
            <input
              value={d.title}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              placeholder={t("kidsContent.editor.gameNamePlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] font-semibold outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2">
            <textarea
              value={d.description}
              onChange={(e) => setD({ ...d, description: e.target.value })}
              rows={3}
              placeholder={t("kidsContent.editor.descPlaceholder")}
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <select
            value={d.category}
            onChange={(e) => setD({ ...d, category: Number(e.target.value) })}
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          >
            <option value={0}>{t("kidsContent.editor.categoryDash")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={d.reward_points}
            onChange={(e) =>
              setD({ ...d, reward_points: Number(e.target.value) })
            }
            placeholder={t("kidsContent.editor.rewardPlaceholder")}
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <input
            type="number"
            value={d.age_min}
            onChange={(e) => setD({ ...d, age_min: Number(e.target.value) })}
            placeholder={t("kidsContent.editor.ageMinPlaceholder")}
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <input
            type="number"
            value={d.age_max}
            onChange={(e) => setD({ ...d, age_max: Number(e.target.value) })}
            placeholder={t("kidsContent.editor.ageMaxPlaceholder")}
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <input
            value={d.game_url}
            onChange={(e) => setD({ ...d, game_url: e.target.value })}
            placeholder={t("kidsContent.editor.gameUrlPlaceholder")}
            className="col-span-2 rounded-lg border border-line bg-bg-input px-3 py-2 text-[12px] font-mono outline-none focus:border-primary"
          />
          <input
            value={d.screen_key}
            onChange={(e) => setD({ ...d, screen_key: e.target.value })}
            placeholder={t("kidsContent.editor.screenKeyPlaceholder")}
            className="col-span-2 rounded-lg border border-line bg-bg-input px-3 py-2 text-[12px] font-mono outline-none focus:border-primary"
          />
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_active}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            {t("common.active")}
          </label>
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_featured}
              onChange={(e) => setD({ ...d, is_featured: e.target.checked })}
            />
            {t("kidsContent.editor.featured")}
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("form.cancel")}
          </button>
          <button
            onClick={save}
            disabled={busy || !d.title.trim() || !d.category}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryEditor({
  cat,
  onClose,
  onSaved,
}: {
  cat: AdminGameCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [d, setD] = useState(cat);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      if (d.id === 0) {
        await kidsContentApi.categories.create(d);
      } else {
        await kidsContentApi.categories.update(d.id, d);
      }
      onSaved();
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
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
            {d.id === 0 ? t("kidsContent.editor.categoryNew") : t("kidsContent.editor.categoryEdit")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <ImageUpload
            value={d.icon}
            onChange={(url) => setD({ ...d, icon: url })}
            folder="uploads"
            label={t("kidsContent.editor.iconOptional")}
          />
          <input
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            placeholder={t("kidsContent.editor.namePlaceholder")}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] font-semibold outline-none focus:border-primary"
          />
          <input
            type="number"
            value={d.order}
            onChange={(e) => setD({ ...d, order: Number(e.target.value) })}
            placeholder={t("kidsContent.editor.orderPlaceholder")}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_active}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            {t("common.active")}
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("form.cancel")}
          </button>
          <button
            onClick={save}
            disabled={busy || !d.name.trim()}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Video editors — multi-language title/description + YouTube URL
// ============================================================================

function VideoEditor({
  video,
  categories,
  onClose,
  onSaved,
}: {
  video: AdminKidsVideo;
  categories: AdminKidsVideoCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [d, setD] = useState(video);
  const [busy, setBusy] = useState(false);

  const ytId = useMemo(() => extractYouTubeId(d.youtube_url), [d.youtube_url]);
  const previewThumb = d.thumbnail
    || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

  const titleValue = buildLangValue(
    d.title,
    d.title_ru,
    d.title_en,
    d.title_uz_cyrl,
  );
  const descValue = buildLangValue(
    d.description,
    d.description_ru,
    d.description_en,
    d.description_uz_cyrl,
  );

  const save = async () => {
    setBusy(true);
    try {
      if (d.id === 0) {
        await kidsVideosApi.videos.create(d);
      } else {
        await kidsVideosApi.videos.update(d.id, d);
      }
      onSaved();
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
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
        className="bg-bg w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {d.id === 0 ? t("kidsContent.editor.videoNew") : t("kidsContent.editor.videoEdit")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <ImageUpload
                value={d.thumbnail}
                onChange={(url) => setD({ ...d, thumbnail: url })}
                folder="uploads"
                label={t("kidsContent.editor.customThumbnailLabel")}
              />
            </div>
            <div className="rounded-xl border border-line bg-bg-input p-2 flex flex-col items-center justify-center min-h-[160px]">
              {previewThumb ? (
                <img
                  src={previewThumb}
                  alt="preview"
                  className="max-h-[140px] w-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-text-muted text-[12px] flex flex-col items-center">
                  <Youtube className="h-7 w-7 mb-2 opacity-50" />
                  {t("kidsContent.video.previewPlaceholder")}
                </div>
              )}
              {ytId && (
                <div className="mt-2 text-[10.5px] font-mono text-text-muted">
                  {t("kidsContent.video.idLabel", { id: ytId })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-text-secondary flex items-center gap-1.5 mb-1.5">
              <Youtube className="h-3.5 w-3.5" />
              {t("kidsContent.video.youtubeLabel")}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={d.youtube_url}
              onChange={(e) => setD({ ...d, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className={
                "w-full rounded-lg border bg-bg-input px-3 py-2 text-[12px] font-mono outline-none focus:border-primary " +
                (d.youtube_url && !ytId
                  ? "border-status-blocked"
                  : "border-line")
              }
            />
            {d.youtube_url && !ytId && (
              <div className="text-[11px] text-status-blocked mt-1">
                {t("kidsContent.video.youtubeIdNotFound")}
              </div>
            )}
          </div>

          <MultilangInput
            label={t("notifRules.titleField")}
            required
            value={titleValue}
            onChange={(v) =>
              setD({
                ...d,
                title: v.uz,
                title_uz_cyrl: v.uz_cyrl,
                title_ru: v.ru,
                title_en: v.en,
              })
            }
            placeholder={t("kidsContent.editor.videoTitlePlaceholder")}
          />

          <MultilangInput
            label={t("kidsContent.editor.descPlaceholder")}
            multiline
            rows={3}
            value={descValue}
            onChange={(v) =>
              setD({
                ...d,
                description: v.uz,
                description_uz_cyrl: v.uz_cyrl,
                description_ru: v.ru,
                description_en: v.en,
              })
            }
            placeholder={t("kidsContent.editor.videoDescPlaceholder")}
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={d.category}
              onChange={(e) => setD({ ...d, category: Number(e.target.value) })}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            >
              <option value={0}>{t("kidsContent.editor.categoryDash")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={d.duration_label}
              onChange={(e) => setD({ ...d, duration_label: e.target.value })}
              placeholder={t("kidsContent.editor.durationPlaceholder")}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <input
              type="number"
              value={d.age_min}
              onChange={(e) => setD({ ...d, age_min: Number(e.target.value) })}
              placeholder={t("kidsContent.editor.ageMinPlaceholder")}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <input
              type="number"
              value={d.age_max}
              onChange={(e) => setD({ ...d, age_max: Number(e.target.value) })}
              placeholder={t("kidsContent.editor.ageMaxPlaceholder")}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <input
              type="number"
              value={d.order}
              onChange={(e) => setD({ ...d, order: Number(e.target.value) })}
              placeholder={t("kidsContent.editor.orderPlaceholder")}
              className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <div className="flex flex-col gap-1 justify-center">
              <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={d.is_active}
                  onChange={(e) => setD({ ...d, is_active: e.target.checked })}
                />
                {t("common.active")}
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={d.is_featured}
                  onChange={(e) => setD({ ...d, is_featured: e.target.checked })}
                />
                {t("kidsContent.editor.featured")}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("form.cancel")}
          </button>
          <button
            onClick={save}
            disabled={
              busy
              || !d.title.trim()
              || !d.category
              || !d.youtube_url.trim()
              || !ytId
            }
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoCategoryEditor({
  cat,
  onClose,
  onSaved,
}: {
  cat: AdminKidsVideoCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [d, setD] = useState(cat);
  const [busy, setBusy] = useState(false);

  const nameValue = buildLangValue(
    d.name,
    d.name_ru,
    d.name_en,
    d.name_uz_cyrl,
  );

  const save = async () => {
    setBusy(true);
    try {
      if (d.id === 0) {
        await kidsVideosApi.categories.create(d);
      } else {
        await kidsVideosApi.categories.update(d.id, d);
      }
      onSaved();
    } catch (e) {
      alert((e as { message?: string }).message || t("common.error"));
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
            {d.id === 0 ? t("kidsContent.editor.videoCategoryNew") : t("kidsContent.editor.videoCategoryEdit")}
          </h3>
          <button onClick={onClose} className="icon-btn h-7 w-7">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <ImageUpload
            value={d.icon}
            onChange={(url) => setD({ ...d, icon: url })}
            folder="uploads"
            label={t("kidsContent.editor.iconOptional")}
          />
          <MultilangInput
            label={t("kidsContent.editor.namePlaceholder")}
            required
            value={nameValue}
            onChange={(v) =>
              setD({
                ...d,
                name: v.uz,
                name_uz_cyrl: v.uz_cyrl,
                name_ru: v.ru,
                name_en: v.en,
              })
            }
            placeholder={t("kidsContent.editor.videoCategoryNamePlaceholder")}
          />
          <input
            type="number"
            value={d.order}
            onChange={(e) => setD({ ...d, order: Number(e.target.value) })}
            placeholder={t("kidsContent.editor.orderPlaceholder")}
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_active}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            {t("common.active")}
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            {t("form.cancel")}
          </button>
          <button
            onClick={save}
            disabled={busy || !d.name.trim()}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
