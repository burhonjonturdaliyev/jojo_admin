export type BannerTheme = "cream" | "sky" | "green";
export type BannerActionType = "openProduct" | "filterByType" | "none";

export interface PromoBanner {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  theme: BannerTheme;
  imageUrl: string | null;
  actionType: BannerActionType;
  actionValue: string;
  sortOrder: number;
  isActive: boolean;
}

export const themeStyles: Record<
  BannerTheme,
  { name: string; bg: string; text: string; kicker: string; chip: string }
> = {
  cream: {
    name: "Cream",
    bg: "linear-gradient(135deg, #FCE9C7, #F6D5A0)",
    text: "#3F2A12",
    kicker: "#B25F1F",
    chip: "rgba(178, 95, 31, 0.18)",
  },
  sky: {
    name: "Sky",
    bg: "linear-gradient(135deg, #BFE2FF, #88C2F1)",
    text: "#0E2A52",
    kicker: "#1B4FA0",
    chip: "rgba(27, 79, 160, 0.18)",
  },
  green: {
    name: "Green",
    bg: "linear-gradient(135deg, #C4ECC9, #8FD79A)",
    text: "#10381E",
    kicker: "#1C6F36",
    chip: "rgba(28, 111, 54, 0.18)",
  },
};

export const initialBanners: PromoBanner[] = [
  {
    id: "BNR-001",
    kicker: "Yangi mahsulot",
    title: "CodyBot bilan\ndasturlashni o'rganing",
    subtitle: "6+ yosh bolalar uchun interaktiv robot",
    theme: "sky",
    imageUrl: null,
    actionType: "openProduct",
    actionValue: "codybot",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "BNR-002",
    kicker: "Aksiya",
    title: "Kitoblarga\n30% chegirma",
    subtitle: "Yozgi mavsum maxsus taklif",
    theme: "cream",
    imageUrl: null,
    actionType: "filterByType",
    actionValue: "book",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "BNR-003",
    kicker: "Tavsiya",
    title: "STEM o'yinchoqlar\nintellektni o'stiradi",
    subtitle: "Eng yaxshi STEM to'plamlari",
    theme: "green",
    imageUrl: null,
    actionType: "filterByType",
    actionValue: "stem",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "BNR-004",
    kicker: "Tez orada",
    title: "Yangi to'plam\niyul oyida",
    subtitle: "Kuting va kuzating!",
    theme: "sky",
    imageUrl: null,
    actionType: "none",
    actionValue: "",
    sortOrder: 4,
    isActive: false,
  },
];
