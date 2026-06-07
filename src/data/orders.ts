export type OrderStatus =
  | "sent"
  | "review"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export interface StatusHistoryEntry {
  status: OrderStatus;
  at: string;
  by?: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  userId: string;
  userPhone: string;
  userName: string;
  userAddress?: string;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  managerNote: string;
  createdAt: string;
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  sent: "Yuborildi",
  review: "Ko'rib chiqilmoqda",
  confirmed: "Tasdiqlangan",
  shipping: "Yetkazilmoqda",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilingan",
};

export const orderStatusColors: Record<
  OrderStatus,
  { dot: string; chip: string; bg: string }
> = {
  sent: {
    dot: "bg-status-new",
    chip: "bg-status-new/15 text-status-new",
    bg: "#9AA3B2",
  },
  review: {
    dot: "bg-status-progress",
    chip: "bg-status-progress/15 text-status-progress",
    bg: "#F59E0B",
  },
  confirmed: {
    dot: "bg-status-waiting",
    chip: "bg-status-waiting/15 text-status-waiting",
    bg: "#3B82F6",
  },
  shipping: {
    dot: "bg-brand",
    chip: "bg-brand-soft text-brand",
    bg: "#3B82F6",
  },
  delivered: {
    dot: "bg-status-resolved",
    chip: "bg-status-resolved/15 text-status-resolved",
    bg: "#10B981",
  },
  cancelled: {
    dot: "bg-status-blocked",
    chip: "bg-status-blocked/15 text-status-blocked",
    bg: "#EF4444",
  },
};

export const orderFlow: OrderStatus[] = [
  "sent",
  "review",
  "confirmed",
  "shipping",
  "delivered",
];

export const initialOrders: Order[] = [
  {
    id: "JOJ-1042",
    productId: "codybot",
    productName: "CodyBot — dasturlash roboti",
    productPrice: 1_290_000,
    userId: "USR-00012345",
    userPhone: "+998 90 123 45 67",
    userName: "Zarina Abdurahmonova",
    userAddress: "Toshkent, Yunusobod 17",
    status: "shipping",
    statusHistory: [
      { status: "sent", at: "30.05.2024 09:12" },
      { status: "review", at: "30.05.2024 11:40", by: "Operator A." },
      { status: "confirmed", at: "30.05.2024 14:00", by: "Operator A." },
      { status: "shipping", at: "31.05.2024 08:30", by: "Logistika" },
    ],
    managerNote: "Mijoz bilan bog'lanildi, ertaga olib boriladi.",
    createdAt: "30.05.2024 09:12",
  },
  {
    id: "JOJ-1041",
    productId: "math-blocks",
    productName: "Matematika bloklari",
    productPrice: 380_000,
    userId: "USR-00012298",
    userPhone: "+998 93 456 78 90",
    userName: "Abdulla Karimov",
    userAddress: "Samarqand, Registon",
    status: "confirmed",
    statusHistory: [
      { status: "sent", at: "30.05.2024 16:21" },
      { status: "review", at: "31.05.2024 09:05", by: "Operator B." },
      { status: "confirmed", at: "31.05.2024 09:40", by: "Operator B." },
    ],
    managerNote: "",
    createdAt: "30.05.2024 16:21",
  },
  {
    id: "JOJ-1040",
    productId: "ertaklar-kitobi",
    productName: "Sehrli ertaklar — 1-jild",
    productPrice: 95_000,
    userId: "USR-00012156",
    userPhone: "+998 91 222 33 44",
    userName: "Nilufar Usmonova",
    userAddress: "Buxoro, Markaz",
    status: "review",
    statusHistory: [
      { status: "sent", at: "31.05.2024 08:00" },
      { status: "review", at: "31.05.2024 10:20", by: "Operator C." },
    ],
    managerNote: "Manzilni aniqlashtirish kerak.",
    createdAt: "31.05.2024 08:00",
  },
  {
    id: "JOJ-1039",
    productId: "alifbe-kitobi",
    productName: "Quvnoq alifbe",
    productPrice: 65_000,
    userId: "USR-00011980",
    userPhone: "+998 97 654 32 10",
    userName: "Sardorbek M.",
    userAddress: "Andijon, Bog'ishamol",
    status: "sent",
    statusHistory: [{ status: "sent", at: "31.05.2024 13:15" }],
    managerNote: "",
    createdAt: "31.05.2024 13:15",
  },
  {
    id: "JOJ-1038",
    productId: "codybot",
    productName: "CodyBot — dasturlash roboti",
    productPrice: 1_290_000,
    userId: "USR-00011540",
    userPhone: "+998 99 888 77 66",
    userName: "Shahnoza B.",
    userAddress: "Toshkent, Chilonzor",
    status: "delivered",
    statusHistory: [
      { status: "sent", at: "25.05.2024" },
      { status: "review", at: "25.05.2024" },
      { status: "confirmed", at: "26.05.2024" },
      { status: "shipping", at: "27.05.2024" },
      { status: "delivered", at: "29.05.2024" },
    ],
    managerNote: "Yetkazildi.",
    createdAt: "25.05.2024",
  },
  {
    id: "JOJ-1037",
    productId: "drawing-tablet",
    productName: "LCD chizish planshet",
    productPrice: 180_000,
    userId: "USR-00011220",
    userPhone: "+998 90 100 20 30",
    userName: "Islom Yusupov",
    userAddress: "Farg'ona",
    status: "cancelled",
    statusHistory: [
      { status: "sent", at: "24.05.2024 11:00" },
      { status: "review", at: "24.05.2024 13:00" },
      { status: "cancelled", at: "24.05.2024 18:40", by: "Mijoz" },
    ],
    managerNote: "Mijoz fikrini o'zgartirdi.",
    createdAt: "24.05.2024 11:00",
  },
];
