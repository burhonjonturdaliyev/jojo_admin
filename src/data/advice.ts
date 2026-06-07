import type { Localized } from "../types/locale";

export type AdviceType = "video" | "blog";

export interface AdviceItem {
  id: string;
  type: AdviceType;
  /** Localized; seed records may be plain strings. */
  title: Localized<string> | string;
  imageUrl: string;
  body?: Localized<string> | string;
  url: string;
  durationLabel?: string;
  readTimeMinutes?: number;
  publishedAt: string;
  likes: number;
  bookmarks: number;
  isPublished: boolean;
  sortOrder: number;
}

export const initialAdvice: AdviceItem[] = [
  {
    id: "ADV-V-001",
    type: "video",
    title: "Bolaning ekran vaqtini qanday cheklash kerak?",
    imageUrl: "#3B82F6",
    url: "https://youtube.com/watch?v=demo1",
    durationLabel: "11:38",
    publishedAt: "30.05.2025",
    likes: 482,
    bookmarks: 124,
    isPublished: true,
    sortOrder: 1,
  },
  {
    id: "ADV-V-002",
    type: "video",
    title: "5-7 yoshli bolalar uchun foydali o'yinchoqlar",
    imageUrl: "#F59E0B",
    url: "https://youtube.com/watch?v=demo2",
    durationLabel: "07:21",
    publishedAt: "28.05.2025",
    likes: 318,
    bookmarks: 89,
    isPublished: true,
    sortOrder: 2,
  },
  {
    id: "ADV-V-003",
    type: "video",
    title: "Maktabdan oldin: bolani qanday tayyorlash",
    imageUrl: "#10B981",
    url: "https://youtube.com/watch?v=demo3",
    durationLabel: "14:02",
    publishedAt: "22.05.2025",
    likes: 624,
    bookmarks: 201,
    isPublished: true,
    sortOrder: 3,
  },
  {
    id: "ADV-V-004",
    type: "video",
    title: "Ota-onalar uchun: STEM nima va nima uchun kerak",
    imageUrl: "#8B5CF6",
    url: "https://youtube.com/watch?v=demo4",
    durationLabel: "09:45",
    publishedAt: "15.05.2025",
    likes: 211,
    bookmarks: 54,
    isPublished: false,
    sortOrder: 4,
  },
  {
    id: "ADV-B-001",
    type: "blog",
    title: "Bolaga kitob o'qishni qanday sevdirish mumkin?",
    imageUrl: "#EF4444",
    body:
      "Bolaning kitobga bo'lgan qiziqishi erta yoshdan boshlanadi. Eng muhimi — uy muhitida o'qish madaniyatini yaratishdir.\n\nQuyida 5 ta amaliy maslahat keltirilgan:\n\n1. Har kuni 10-15 daqiqa birga o'qing\n2. Bolaning yoshiga mos kitob tanlang\n3. Hikoya orqali muhokama qiling\n4. Kutubxonalarga sayohat uyushtiring\n5. O'zingiz ham kitob o'qing — bola ko'rib o'rganadi",
    url: "https://jojoapp.uz/blog/bolaga-kitob",
    readTimeMinutes: 5,
    publishedAt: "29.05.2025",
    likes: 156,
    bookmarks: 68,
    isPublished: true,
    sortOrder: 1,
  },
  {
    id: "ADV-B-002",
    type: "blog",
    title: "Bola uchun sog'lom ovqatlanish: 10 ta qoida",
    imageUrl: "#10B981",
    body:
      "Sog'lom ovqatlanish — bolaning jismoniy va aqliy rivojlanishi uchun asosdir.\n\nMutaxassislar tomonidan tavsiya etilgan 10 ta qoida:\n\n- Sabzavot va mevalarni har kuni iste'mol qilish\n- Shirin gazli ichimliklardan voz kechish\n- Tabiiy oqsillarni rejimga qo'shish\n- Suv ichish odatini shakllantirish\n- Birga ovqat tayyorlash",
    url: "https://jojoapp.uz/blog/soglom-ovqat",
    readTimeMinutes: 7,
    publishedAt: "26.05.2025",
    likes: 234,
    bookmarks: 102,
    isPublished: true,
    sortOrder: 2,
  },
  {
    id: "ADV-B-003",
    type: "blog",
    title: "Bola jahl chiqarganda — ota-onaning to'g'ri javobi",
    imageUrl: "#F59E0B",
    body:
      "Tantrum yoki jahl bolaning katta bo'lib borishida tabiiy holat. Asosiy savol: ota-ona qanday javob qaytarishi kerak?\n\nPsixologlar maslahat beradi:\n\n- Vaziyatni jiddiy qabul qilmang, lekin e'tibordan chetda ham qoldirmang\n- Bolaga his-tuyg'ularini nomlashga yordam bering\n- Aniq chegaralar belgilang\n- O'zingiz xotirjam bo'ling",
    url: "https://jojoapp.uz/blog/jahl",
    readTimeMinutes: 6,
    publishedAt: "20.05.2025",
    likes: 412,
    bookmarks: 187,
    isPublished: true,
    sortOrder: 3,
  },
];
