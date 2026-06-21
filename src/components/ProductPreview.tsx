import { useEffect, useMemo, useState } from "react";
import { Bookmark, Clock, Package, Play, ShoppingBag, Truck } from "lucide-react";
import type { UiProduct } from "../lib/adapters";
import type { AdminStoreCategory } from "../lib/resources";
import type { Lang } from "../lib/i18n";

/**
 * Jojo parent ilovasidagi do'kon dizaynini aniq takrorlovchi preview komponenti.
 * Rang va o'lchamlar parent app'dagi widget kodlaridan olingan — admin
 * yangi mahsulot kiritayotganda real ko'rinishni darhol ko'rishi uchun.
 */

const C = {
  ink: "#171A1C",
  ink2: "#464E53",
  muted: "#909BA2",
  line: "#E3E6E8",
  bg: "#F6F7F8",
  chip: "#F1F3F4",
  accent: "#1FA6F2",
  accent2: "#0E92E8",
  accentSoft: "#EAF6FE",
  accentLine: "#CDE9FB",
  green: "#34C759",
  red: "#E5413B",
  redSoft: "#FCEBEA",
  redLine: "#F6D5D3",
};

type PreviewMode = "card" | "detail";

interface Props {
  product: UiProduct;
  categories?: AdminStoreCategory[];
  /** Qaysi tilda preview ko'rsatilsin */
  previewLang?: Lang;
}

function pickLang(value: { uz: string; uz_cyrl: string; ru: string; en: string }, lang: Lang): string {
  // Bo'sh maydon bo'lsa, boshqa tildan fallback qilamiz — preview hech qachon
  // bo'sh ko'rinmasligi uchun.
  const order: Lang[] = [lang, "uz", "uz_cyrl", "ru", "en"];
  for (const l of order) {
    const v = value[l as keyof typeof value];
    if (v && v.trim()) return v;
  }
  return "";
}

function fmtPrice(n: number): string {
  return (n || 0).toLocaleString("uz-UZ").replace(/,/g, " ");
}

function langLabel(l: Lang): string {
  if (l === "ru") return "🇷🇺 RU";
  if (l === "en") return "🇬🇧 EN";
  if (l === "uz_cyrl") return "🇺🇿 UZ-Cyr";
  return "🇺🇿 UZ";
}

export function ProductPreview({
  product,
  categories,
  previewLang = "uz",
}: Props) {
  const [mode, setMode] = useState<PreviewMode>("card");
  const [lang, setLang] = useState<Lang>(previewLang);

  const name = useMemo(() => pickLang(product.name, lang), [product.name, lang]);
  const shortDesc = useMemo(
    () => pickLang(product.shortDescription, lang),
    [product.shortDescription, lang],
  );
  const fullDesc = useMemo(
    () => pickLang(product.description, lang),
    [product.description, lang],
  );
  const categoryLabel = useMemo(
    () => pickLang(product.categoryLabel, lang),
    [product.categoryLabel, lang],
  );

  const categoryName = useMemo(() => {
    if (!product.categoryId) return "";
    const c = categories?.find((x) => String(x.id) === product.categoryId);
    if (!c) return "";
    if (lang === "ru") return c.name_ru || c.name;
    if (lang === "en") return c.name_en || c.name;
    if (lang === "uz_cyrl") return c.name_uz_cyrl || c.name;
    return c.name;
  }, [product.categoryId, categories, lang]);

  const hasDiscount =
    product.oldPriceUzs != null &&
    product.oldPriceUzs > product.priceUzs &&
    product.priceUzs > 0;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.oldPriceUzs! - product.priceUzs) / product.oldPriceUzs!) * 100,
      )
    : 0;

  const coverImage = product.image || product.images[0] || null;
  const galleryImages = useMemo(() => {
    const all: string[] = [];
    if (product.image) all.push(product.image);
    product.images.forEach((x) => {
      if (x && x !== product.image) all.push(x);
    });
    return all;
  }, [product.image, product.images]);

  return (
    <div className="flex h-full flex-col">
      {/* Tab + lang switcher */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center rounded-lg border border-line bg-bg-input p-0.5">
          {(["card", "detail"] as PreviewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                "rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors " +
                (mode === m
                  ? "bg-primary/15 text-primary"
                  : "text-text-secondary hover:text-text-primary")
              }
            >
              {m === "card" ? "Karta" : "Detail"}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center rounded-lg border border-line bg-bg-input p-0.5">
          {(["uz", "uz_cyrl", "ru", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={
                "rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors " +
                (lang === l
                  ? "bg-primary/15 text-primary"
                  : "text-text-secondary hover:text-text-primary")
              }
            >
              {langLabel(l)}
            </button>
          ))}
        </div>
      </div>

      {/* iPhone style mock */}
      <div
        className="relative mx-auto w-full max-w-[300px] rounded-[36px] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl overflow-hidden"
        style={{ aspectRatio: mode === "card" ? "9 / 14" : "9 / 19" }}
      >
        <div
          className="h-full w-full overflow-y-auto scrollbar-thin"
          style={{ backgroundColor: C.bg }}
        >
          {mode === "card" ? (
            <CardPreview
              name={name}
              categoryLabel={categoryLabel || categoryName}
              ageLabel={product.ageLabel}
              priceUzs={product.priceUzs}
              oldPriceUzs={product.oldPriceUzs}
              hasDiscount={hasDiscount}
              discountPercent={discountPercent}
              coverImage={coverImage}
              isFeatured={product.isFeatured}
            />
          ) : (
            <DetailPreview
              name={name}
              categoryLabel={categoryLabel || categoryName}
              shortDesc={shortDesc}
              fullDesc={fullDesc}
              tags={product.tags.map((t) => t.name).filter(Boolean)}
              ageLabel={product.ageLabel}
              priceUzs={product.priceUzs}
              oldPriceUzs={product.oldPriceUzs}
              hasDiscount={hasDiscount}
              discountPercent={discountPercent}
              gallery={galleryImages}
              videoUrls={product.videoUrls}
              brand={product.brand}
              isFeatured={product.isFeatured}
              dealEndsAt={product.dealEndsAt}
              delivery={{
                courier: product.delivery.courier,
                price: product.delivery.price,
                isFree: product.delivery.isFree,
                city: pickLang(product.delivery.city, lang),
                time: pickLang(product.delivery.time, lang),
                note: pickLang(product.delivery.note, lang),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CARD preview (do'kondagi kichik plitka)
// ============================================================================

function CardPreview(props: {
  name: string;
  categoryLabel: string;
  ageLabel: string;
  priceUzs: number;
  oldPriceUzs: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  coverImage: string | null;
  isFeatured: boolean;
}) {
  return (
    <div className="p-3" style={{ backgroundColor: C.bg }}>
      {/* Header strip — bosh sahifa subtle */}
      <div className="mb-2 flex items-center justify-between text-[10px]" style={{ color: C.muted }}>
        <span>16:24</span>
        <span>Jojo</span>
      </div>

      {/* Sample search bar */}
      <div
        className="mb-3 rounded-xl px-3 py-2 text-[10.5px]"
        style={{ backgroundColor: "#FFFFFF", color: C.muted, border: `1px solid ${C.line}` }}
      >
        Qidirish...
      </div>

      {/* 2-column grid mimic */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Real card */}
        <ProductCardTile {...props} />
        {/* Placeholder card */}
        <div
          className="overflow-hidden rounded-[18px] opacity-40"
          style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.line}` }}
        >
          <div className="aspect-square w-full" style={{ backgroundColor: C.chip }} />
          <div className="p-3 space-y-1">
            <div className="h-2 w-12 rounded" style={{ backgroundColor: C.line }} />
            <div className="h-3 w-full rounded" style={{ backgroundColor: C.line }} />
            <div className="h-3 w-2/3 rounded" style={{ backgroundColor: C.line }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCardTile({
  name,
  categoryLabel,
  ageLabel,
  priceUzs,
  oldPriceUzs,
  hasDiscount,
  discountPercent,
  coverImage,
  isFeatured,
}: {
  name: string;
  categoryLabel: string;
  ageLabel: string;
  priceUzs: number;
  oldPriceUzs: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  coverImage: string | null;
  isFeatured: boolean;
}) {
  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        border: `1px solid ${C.line}`,
      }}
    >
      <div className="relative aspect-square w-full overflow-hidden" style={{ backgroundColor: C.chip }}>
        {coverImage ? (
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8" style={{ color: C.muted, opacity: 0.5 }} />
          </div>
        )}

        {/* Badges left stack */}
        <div className="absolute left-[10px] top-[10px] flex flex-col gap-1.5">
          {hasDiscount && (
            <span
              className="inline-flex items-center px-[9px] text-[11.5px] font-extrabold text-white"
              style={{
                backgroundColor: C.red,
                borderRadius: 8,
                height: 22,
                letterSpacing: 0.2,
              }}
            >
              -{discountPercent}%
            </span>
          )}
          {isFeatured && (
            <span
              className="inline-flex items-center px-[9px] text-[11px] font-extrabold uppercase text-white"
              style={{
                backgroundColor: C.accent,
                borderRadius: 8,
                height: 22,
                letterSpacing: 0.4,
              }}
            >
              TOP
            </span>
          )}
        </div>

        {/* Bookmark btn */}
        <div
          className="absolute right-[8px] top-[8px] flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.9)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          <Bookmark size={16} style={{ color: C.ink2 }} />
        </div>
      </div>

      <div style={{ padding: "11px 12px 13px" }}>
        {categoryLabel ? (
          <div
            className="font-semibold uppercase"
            style={{
              fontSize: 11,
              letterSpacing: 0.4,
              color: C.muted,
            }}
          >
            {categoryLabel}
          </div>
        ) : null}
        <div
          className="font-extrabold"
          style={{
            fontSize: 13,
            lineHeight: 1.3,
            color: C.ink,
            marginTop: categoryLabel ? 4 : 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {name || "Mahsulot nomi"}
        </div>
        {ageLabel ? (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            {ageLabel}
          </div>
        ) : null}

        <div className="flex items-baseline gap-1.5" style={{ marginTop: 10 }}>
          <span
            className="font-extrabold"
            style={{
              fontSize: 15.5,
              color: hasDiscount ? C.red : C.ink,
            }}
          >
            {fmtPrice(priceUzs)}
          </span>
          <span style={{ fontSize: 11, color: C.muted }}>so'm</span>
        </div>
        {hasDiscount && oldPriceUzs ? (
          <div
            style={{
              fontSize: 11.5,
              color: C.muted,
              textDecoration: "line-through",
              marginTop: 2,
            }}
          >
            {fmtPrice(oldPriceUzs)} so'm
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================================
// DETAIL preview (mahsulot to'liq sahifasi)
// ============================================================================

function DetailPreview({
  name,
  categoryLabel,
  shortDesc,
  fullDesc,
  tags,
  ageLabel,
  priceUzs,
  oldPriceUzs,
  hasDiscount,
  discountPercent,
  gallery,
  videoUrls,
  brand,
  isFeatured,
  dealEndsAt,
  delivery,
}: {
  name: string;
  categoryLabel: string;
  shortDesc: string;
  fullDesc: string;
  tags: string[];
  ageLabel: string;
  priceUzs: number;
  oldPriceUzs: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  gallery: string[];
  videoUrls: string[];
  brand: string;
  isFeatured: boolean;
  dealEndsAt: string | null;
  delivery: {
    courier: string;
    price: number;
    isFree: boolean;
    city: string;
    time: string;
    note: string;
  };
}) {
  const [selected, setSelected] = useState(0);
  const items: { type: "img" | "video"; src: string }[] = [
    ...gallery.map((g) => ({ type: "img" as const, src: g })),
    ...videoUrls
      .map((v) => parseYouTubeId(v))
      .filter(Boolean)
      .map((id) => ({ type: "video" as const, src: id as string })),
  ];
  const active = items[selected];

  return (
    <div style={{ backgroundColor: "#FFFFFF" }}>
      {/* Drag handle */}
      <div className="pt-2 pb-1 flex justify-center">
        <div style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: C.line }} />
      </div>

      {/* Main image */}
      <div className="mx-4">
        <div
          className="relative overflow-hidden"
          style={{
            height: 184,
            borderRadius: 18,
            backgroundColor: C.chip,
          }}
        >
          {active?.type === "img" ? (
            <img src={active.src} alt="" className="h-full w-full object-cover" />
          ) : active?.type === "video" ? (
            <img
              src={`https://i.ytimg.com/vi/${active.src}/hqdefault.jpg`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12" style={{ color: C.muted, opacity: 0.45 }} />
            </div>
          )}

          {/* Badge */}
          {(hasDiscount || isFeatured) && (
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {hasDiscount && (
                <span
                  className="inline-flex items-center font-extrabold text-white"
                  style={{
                    backgroundColor: C.red,
                    borderRadius: 9,
                    height: 24,
                    paddingLeft: 10,
                    paddingRight: 10,
                    fontSize: 12,
                    letterSpacing: 0.2,
                  }}
                >
                  -{discountPercent}%
                </span>
              )}
              {isFeatured && (
                <span
                  className="inline-flex items-center font-extrabold uppercase text-white"
                  style={{
                    backgroundColor: C.accent,
                    borderRadius: 9,
                    height: 24,
                    paddingLeft: 10,
                    paddingRight: 10,
                    fontSize: 11,
                    letterSpacing: 0.4,
                  }}
                >
                  TOP
                </span>
              )}
            </div>
          )}

          {/* Video play overlay */}
          {active?.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
              >
                <Play size={20} className="text-white" fill="white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="mt-3 px-4 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-2">
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className="shrink-0 overflow-hidden"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 12,
                  border: `2px solid ${selected === i ? C.accent : "transparent"}`,
                  backgroundColor: C.chip,
                }}
              >
                {it.type === "img" ? (
                  <img src={it.src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="relative h-full w-full">
                    <img
                      src={`https://i.ytimg.com/vi/${it.src}/hqdefault.jpg`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play size={14} className="text-white" fill="white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "10px 16px 16px" }}>
        {categoryLabel ? (
          <div
            className="font-semibold uppercase"
            style={{
              color: C.accent,
              fontSize: 11.5,
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            {categoryLabel}
          </div>
        ) : null}

        <div
          className="font-extrabold"
          style={{ fontSize: 22, lineHeight: 1.2, color: C.ink, marginBottom: 12 }}
        >
          {name || "Mahsulot nomi"}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 12 }}>
            {tags.slice(0, 6).map((t, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: "rgba(31,166,242,0.1)",
                  color: C.accent,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 10,
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {brand && (
          <div className="flex items-center gap-1" style={{ marginBottom: 10 }}>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: C.ink2,
                backgroundColor: C.chip,
                padding: "5px 12px",
                borderRadius: 10,
              }}
            >
              {brand}
            </span>
          </div>
        )}

        {shortDesc && (
          <div style={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.55, marginBottom: 12 }}>
            {shortDesc}
          </div>
        )}

        {fullDesc && (
          <div
            style={{
              fontSize: 13.5,
              color: C.ink2,
              lineHeight: 1.55,
              marginBottom: 15,
              whiteSpace: "pre-wrap",
            }}
          >
            {fullDesc}
          </div>
        )}

        {/* Price + Age block */}
        <div
          style={{
            backgroundColor: C.bg,
            borderRadius: 14,
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>Narxi</div>
            <div className="font-extrabold" style={{ fontSize: 23, color: hasDiscount ? C.red : C.ink }}>
              {fmtPrice(priceUzs)}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>so'm</div>
            {hasDiscount && oldPriceUzs ? (
              <>
                <div
                  style={{
                    fontSize: 13.5,
                    color: C.muted,
                    textDecoration: "line-through",
                    marginTop: 6,
                  }}
                >
                  {fmtPrice(oldPriceUzs)} so'm
                </div>
                <div
                  className="inline-flex items-center font-extrabold"
                  style={{
                    backgroundColor: C.redSoft,
                    color: C.red,
                    fontSize: 12,
                    height: 22,
                    paddingLeft: 8,
                    paddingRight: 8,
                    borderRadius: 7,
                    marginTop: 6,
                  }}
                >
                  -{discountPercent}%
                </div>
              </>
            ) : null}
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>Yosh</div>
            <div className="font-extrabold" style={{ fontSize: 16, color: C.ink }}>
              {ageLabel || "—"}
            </div>
          </div>
        </div>

        {/* Countdown — chegirma tugashiga */}
        {hasDiscount && dealEndsAt ? (
          <DealCountdown endsAt={dealEndsAt} />
        ) : null}

        {/* Delivery box — real ma'lumotlardan */}
        {(delivery.city || delivery.time || delivery.note || delivery.courier) && (
          <div
            style={{
              backgroundColor: C.accentSoft,
              border: `1px solid ${C.accentLine}`,
              borderRadius: 14,
              padding: "12px 13px",
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
              marginBottom: 14,
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                backgroundColor: C.accent,
              }}
            >
              <Truck size={17} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 2 }}>
                {delivery.isFree
                  ? "Bepul yetkazib berish"
                  : delivery.price > 0
                    ? `Yetkazib berish: ${fmtPrice(delivery.price)} so'm`
                    : "Yetkazib berish"}
              </div>
              {(delivery.city || delivery.time) && (
                <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.45 }}>
                  {[delivery.city, delivery.time].filter(Boolean).join(" · ")}
                </div>
              )}
              {delivery.courier && (
                <div style={{ fontSize: 11.5, color: C.ink2, marginTop: 4 }}>
                  {courierLabel(delivery.courier)}
                </div>
              )}
              {delivery.note && (
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
                  {delivery.note}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchase CTA */}
        <button
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 font-extrabold text-white"
          style={{
            height: 48,
            borderRadius: 14,
            background: `linear-gradient(180deg, ${C.accent} 0%, ${C.accent2} 100%)`,
            boxShadow: `0 8px 20px ${C.accent}40`,
            fontSize: 14,
          }}
        >
          <ShoppingBag size={16} />
          Sotib olish
        </button>
      </div>
    </div>
  );
}

function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function courierLabel(code: string): string {
  switch (code) {
    case "bts":
      return "BTS Cargo";
    case "uzposhta":
      return "UzPosta";
    case "yandex":
      return "Yandex Delivery";
    case "fargo":
      return "Fargo";
    case "express24":
      return "Express24";
    case "self_pickup":
      return "O'zi olib ketadi";
    case "other":
      return "Boshqa kuryer";
    default:
      return "";
  }
}

/** Real-time countdown — Flutter widget StoreDealCountdown'ning ekvivalenti. */
function DealCountdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(endsAt).getTime();
  const diff = target - now;

  if (isNaN(target) || diff <= 0) {
    return (
      <div
        style={{
          backgroundColor: C.redSoft,
          border: `1px solid ${C.redLine}`,
          borderRadius: 14,
          padding: "11px 14px",
          marginBottom: 12,
          color: C.red,
          fontSize: 12.5,
          fontWeight: 700,
        }}
      >
        Chegirma tugadi
      </div>
    );
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const cells: { label: string; value: string }[] = [];
  if (days > 0) cells.push({ label: "K", value: pad(days) });
  cells.push({ label: "S", value: pad(hours) });
  cells.push({ label: "D", value: pad(minutes) });
  cells.push({ label: "S", value: pad(seconds) });

  return (
    <div
      style={{
        backgroundColor: C.redSoft,
        border: `1px solid ${C.redLine}`,
        borderRadius: 14,
        padding: "11px 14px",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div className="flex items-center gap-1.5" style={{ color: C.red }}>
        <Clock size={14} />
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>
          Chegirma tugashiga
        </span>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        {cells.map((c, i) => (
          <span
            key={i}
            style={{
              minWidth: 27,
              padding: "3px 6px",
              borderRadius: 6,
              backgroundColor: C.red,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {c.value}
          </span>
        ))}
      </div>
    </div>
  );
}
