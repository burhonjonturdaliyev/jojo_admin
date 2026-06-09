import { useCallback, useEffect, useState } from "react";
import {
  Gamepad2,
  Plus,
  Pencil,
  Trash2,
  X,
  FolderTree,
  Search,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import {
  kidsContentApi,
  type AdminGame,
  type AdminGameCategory,
} from "../lib/resources";

type Tab = "games" | "categories";

export function KidsContentPage() {
  const [tab, setTab] = useState<Tab>("games");
  const [categories, setCategories] = useState<AdminGameCategory[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<number | null>(null);
  const [editingGame, setEditingGame] = useState<AdminGame | null>(null);
  const [editingCat, setEditingCat] = useState<AdminGameCategory | null>(null);

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

  useEffect(() => {
    setLoading(true);
    Promise.all([reloadCats(), reloadGames()]).finally(() => setLoading(false));
  }, [reloadCats, reloadGames]);

  const removeGame = async (id: number) => {
    if (!confirm("O'yinni o'chirasizmi?")) return;
    await kidsContentApi.games.remove(id);
    void reloadGames();
  };
  const removeCat = async (id: number) => {
    if (!confirm("Kategoriya va undagi barcha o'yinlar o'chiriladi. Davom etaylikmi?"))
      return;
    await kidsContentApi.categories.remove(id);
    void reloadCats();
    void reloadGames();
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Kids kontent"
        subtitle={`${games.length} ta o'yin, ${categories.length} ta kategoriya`}
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
              <Plus className="h-4 w-4" /> Yangi o'yin
            </button>
          ) : (
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
              <Plus className="h-4 w-4" /> Yangi kategoriya
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-7 py-5">
        {/* Tabs */}
        <div className="card p-2 inline-flex gap-1 mb-4">
          <button
            onClick={() => setTab("games")}
            className={
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium " +
              (tab === "games"
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-bg-hover")
            }
          >
            <Gamepad2 className="h-4 w-4" /> O'yinlar
          </button>
          <button
            onClick={() => setTab("categories")}
            className={
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium " +
              (tab === "categories"
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-bg-hover")
            }
          >
            <FolderTree className="h-4 w-4" /> Kategoriyalar
          </button>
        </div>

        {tab === "games" ? (
          <>
            {/* Filter */}
            <div className="card p-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && reloadGames()}
                    placeholder="O'yin nomi..."
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
                  <option value="">Barcha kategoriyalar</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Games grid */}
            <div className="grid grid-cols-3 gap-4">
              {loading && (
                <div className="col-span-3 py-12 text-center text-text-muted">
                  Yuklanmoqda...
                </div>
              )}
              {!loading && games.length === 0 && (
                <div className="col-span-3 py-12 text-center text-text-muted">
                  <Gamepad2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  O'yinlar yo'q
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
                          onClick={() => setEditingGame(g)}
                          className="icon-btn h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeGame(g.id)}
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
                        {g.age_min}–{g.age_max} yosh
                      </span>
                      {g.reward_points > 0 && (
                        <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10.5px] font-medium text-yellow-600">
                          +{g.reward_points} ball
                        </span>
                      )}
                      {g.is_featured && (
                        <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10.5px] font-medium text-purple-500">
                          Tavsiya
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
                        {g.is_active ? "Faol" : "Nofaol"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Categories table */
          <div className="card overflow-hidden">
            <table className="min-w-full text-[13px]">
              <thead className="border-b border-line bg-bg-input text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3 w-16">№</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3 w-28">O'yinlar</th>
                  <th className="px-4 py-3 w-24">Tartib</th>
                  <th className="px-4 py-3 w-28">Holat</th>
                  <th className="px-4 py-3 w-28 text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!loading && categories.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                      <FolderTree className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      Kategoriyalar yo'q
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
                        {c.is_active ? "Faol" : "Nofaol"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingCat(c)}
                        className="icon-btn h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeCat(c.id)}
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
    </div>
  );
}

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
        className="bg-bg w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {d.id === 0 ? "Yangi o'yin" : "O'yinni tahrirlash"}
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
              label="Rasm (thumbnail)"
            />
          </div>
          <div className="col-span-2">
            <input
              value={d.title}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              placeholder="O'yin nomi"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] font-semibold outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2">
            <textarea
              value={d.description}
              onChange={(e) => setD({ ...d, description: e.target.value })}
              rows={3}
              placeholder="Tavsif"
              className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <select
            value={d.category}
            onChange={(e) => setD({ ...d, category: Number(e.target.value) })}
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          >
            <option value={0}>— kategoriya —</option>
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
            placeholder="Ballar"
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <input
            type="number"
            value={d.age_min}
            onChange={(e) => setD({ ...d, age_min: Number(e.target.value) })}
            placeholder="Yosh: min"
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <input
            type="number"
            value={d.age_max}
            onChange={(e) => setD({ ...d, age_max: Number(e.target.value) })}
            placeholder="Yosh: max"
            className="rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <input
            value={d.game_url}
            onChange={(e) => setD({ ...d, game_url: e.target.value })}
            placeholder="WebGame URL (ixtiyoriy)"
            className="col-span-2 rounded-lg border border-line bg-bg-input px-3 py-2 text-[12px] font-mono outline-none focus:border-primary"
          />
          <input
            value={d.screen_key}
            onChange={(e) => setD({ ...d, screen_key: e.target.value })}
            placeholder="Local screen key (Flutter)"
            className="col-span-2 rounded-lg border border-line bg-bg-input px-3 py-2 text-[12px] font-mono outline-none focus:border-primary"
          />
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_active}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            Faol
          </label>
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_featured}
              onChange={(e) => setD({ ...d, is_featured: e.target.checked })}
            />
            Tavsiya etiladi
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            Bekor
          </button>
          <button
            onClick={save}
            disabled={busy || !d.title.trim() || !d.category}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? "Saqlanmoqda..." : "Saqlash"}
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
        className="bg-bg w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-text-primary">
            {d.id === 0 ? "Yangi kategoriya" : "Kategoriyani tahrirlash"}
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
            label="Belgi (ixtiyoriy)"
          />
          <input
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            placeholder="Nom"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13.5px] font-semibold outline-none focus:border-primary"
          />
          <input
            type="number"
            value={d.order}
            onChange={(e) => setD({ ...d, order: Number(e.target.value) })}
            placeholder="Tartib"
            className="w-full rounded-lg border border-line bg-bg-input px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <label className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <input
              type="checkbox"
              checked={d.is_active}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            Faol
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-[12.5px]">
            Bekor
          </button>
          <button
            onClick={save}
            disabled={busy || !d.name.trim()}
            className="btn-primary text-[12.5px] disabled:opacity-50"
          >
            {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
