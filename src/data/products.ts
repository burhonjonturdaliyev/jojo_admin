export type ProductType = "stem" | "book" | "other";
export type ProductBadge = "none" | "top" | "yangi";

export interface Product {
  id: string;
  name: string;
  category: string;
  type: ProductType;
  age: string;
  price: number;
  oldPrice: number | null;
  badge: ProductBadge;
  features: string[];
  description: string;
  images: string[];
  videoUrl: string | null;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const productTypeLabels: Record<ProductType, string> = {
  stem: "STEM",
  book: "Kitob",
  other: "Boshqa",
};

export const badgeLabels: Record<ProductBadge, string> = {
  none: "—",
  top: "TOP",
  yangi: "Yangi",
};

export const initialProducts: Product[] = [
  {
    id: "codybot",
    name: "CodyBot — dasturlash roboti",
    category: "STEM O'YINCHOQ",
    type: "stem",
    age: "6+ yosh",
    price: 1_290_000,
    oldPrice: 1_590_000,
    badge: "top",
    features: ["Bluetooth", "Mobil ilova", "50+ daraja", "Rang sensori"],
    description:
      "Bolalar uchun dasturlashni o'rgatuvchi interaktiv robot. Mobil ilova orqali boshqariladi.",
    images: ["#3B82F6", "#1D4ED8"],
    videoUrl: "https://youtube.com/watch?v=demo",
    featured: true,
    isActive: true,
    createdAt: "12.04.2024",
    updatedAt: "20.05.2024",
  },
  {
    id: "math-blocks",
    name: "Matematika bloklari",
    category: "STEM O'YINCHOQ",
    type: "stem",
    age: "4+ yosh",
    price: 380_000,
    oldPrice: null,
    badge: "yangi",
    features: ["120 bo'lak", "Magnit", "Rangli kitobcha"],
    description: "Sanoq, qo'shish va ayirishni o'yin orqali o'rgatuvchi to'plam.",
    images: ["#10B981"],
    videoUrl: null,
    featured: true,
    isActive: true,
    createdAt: "02.05.2024",
    updatedAt: "02.05.2024",
  },
  {
    id: "ertaklar-kitobi",
    name: "Sehrli ertaklar — 1-jild",
    category: "KITOB",
    type: "book",
    age: "3+ yosh",
    price: 95_000,
    oldPrice: 120_000,
    badge: "none",
    features: ["240 sahifa", "Qattiq muqova", "Rasmlar bilan"],
    description:
      "Mashhur o'zbek va jahon ertaklari to'plami. Yotishdan oldin o'qish uchun.",
    images: ["#F59E0B"],
    videoUrl: null,
    featured: false,
    isActive: true,
    createdAt: "15.03.2024",
    updatedAt: "10.05.2024",
  },
  {
    id: "alifbe-kitobi",
    name: "Quvnoq alifbe",
    category: "KITOB",
    type: "book",
    age: "4+ yosh",
    price: 65_000,
    oldPrice: null,
    badge: "top",
    features: ["64 sahifa", "QR audio", "Mashqlar"],
    description: "Harflarni quvnoq tarzda o'rgatuvchi qo'llanma.",
    images: ["#EF4444"],
    videoUrl: null,
    featured: true,
    isActive: true,
    createdAt: "01.04.2024",
    updatedAt: "01.04.2024",
  },
  {
    id: "drawing-tablet",
    name: "LCD chizish planshet",
    category: "BOSHQA",
    type: "other",
    age: "3+ yosh",
    price: 180_000,
    oldPrice: 220_000,
    badge: "none",
    features: ["10 dyuym", "Batareya bilan", "Stilus"],
    description: "Bolalar uchun elektron chizish va yozish planshet.",
    images: ["#8B5CF6"],
    videoUrl: null,
    featured: false,
    isActive: false,
    createdAt: "18.02.2024",
    updatedAt: "25.04.2024",
  },
];
