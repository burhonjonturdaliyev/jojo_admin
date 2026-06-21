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

// Default labels in case the OrderStatus lookup misses (e.g. when a code
// arrives from backend before the admin's custom OrderStatus table has
// loaded). Mirrors the `orderStatus.*` locale keys; runtime UI prefers
// the localized version via `useT()`.
export const orderStatusLabels: Record<OrderStatus, string> = {
  sent: "Yangi",
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

const mk = (
  id: string,
  productId: string,
  productName: string,
  productPrice: number,
  userName: string,
  userPhone: string,
  userId: string,
  userAddress: string,
  status: OrderStatus,
  createdAt: string,
  statusHistory: StatusHistoryEntry[],
  managerNote = "",
): Order => ({
  id,
  productId,
  productName,
  productPrice,
  userId,
  userPhone,
  userName,
  userAddress,
  status,
  statusHistory,
  managerNote,
  createdAt,
});

export const initialOrders: Order[] = [
  mk("JOJ-1042", "codybot", "CodyBot — dasturlash roboti", 1_290_000, "Zarina Abdurahmonova", "+998 90 123 45 67", "USR-00012345", "Toshkent, Yunusobod 17", "shipping", "30.05.2024 09:12", [
    { status: "sent", at: "30.05.2024 09:12" },
    { status: "review", at: "30.05.2024 11:40", by: "Operator A." },
    { status: "confirmed", at: "30.05.2024 14:00", by: "Operator A." },
    { status: "shipping", at: "31.05.2024 08:30", by: "Logistika" },
  ], "Mijoz bilan bog'lanildi, ertaga olib boriladi."),
  mk("JOJ-1041", "math-blocks", "Matematika bloklari", 380_000, "Abdulla Karimov", "+998 93 456 78 90", "USR-00012298", "Samarqand, Registon", "confirmed", "30.05.2024 16:21", [
    { status: "sent", at: "30.05.2024 16:21" },
    { status: "review", at: "31.05.2024 09:05", by: "Operator B." },
    { status: "confirmed", at: "31.05.2024 09:40", by: "Operator B." },
  ]),
  mk("JOJ-1040", "ertaklar-kitobi", "Sehrli ertaklar — 1-jild", 95_000, "Nilufar Usmonova", "+998 91 222 33 44", "USR-00012156", "Buxoro, Markaz", "review", "31.05.2024 08:00", [
    { status: "sent", at: "31.05.2024 08:00" },
    { status: "review", at: "31.05.2024 10:20", by: "Operator C." },
  ], "Manzilni aniqlashtirish kerak."),
  mk("JOJ-1039", "alifbe-kitobi", "Quvnoq alifbe", 65_000, "Sardorbek M.", "+998 97 654 32 10", "USR-00011980", "Andijon, Bog'ishamol", "sent", "31.05.2024 13:15", [
    { status: "sent", at: "31.05.2024 13:15" },
  ]),
  mk("JOJ-1038", "codybot", "CodyBot — dasturlash roboti", 1_290_000, "Shahnoza B.", "+998 99 888 77 66", "USR-00011540", "Toshkent, Chilonzor", "delivered", "25.05.2024", [
    { status: "sent", at: "25.05.2024" },
    { status: "review", at: "25.05.2024" },
    { status: "confirmed", at: "26.05.2024" },
    { status: "shipping", at: "27.05.2024" },
    { status: "delivered", at: "29.05.2024" },
  ], "Yetkazildi."),
  mk("JOJ-1037", "drawing-tablet", "LCD chizish planshet", 180_000, "Islom Yusupov", "+998 90 100 20 30", "USR-00011220", "Farg'ona", "cancelled", "24.05.2024 11:00", [
    { status: "sent", at: "24.05.2024 11:00" },
    { status: "review", at: "24.05.2024 13:00" },
    { status: "cancelled", at: "24.05.2024 18:40", by: "Mijoz" },
  ], "Mijoz fikrini o'zgartirdi."),
  mk("JOJ-1036", "math-blocks", "Matematika bloklari", 380_000, "Dilshod Olimov", "+998 90 111 22 33", "USR-00011100", "Toshkent, Mirzo Ulug'bek", "delivered", "22.05.2024", [
    { status: "sent", at: "22.05.2024" },
    { status: "review", at: "22.05.2024" },
    { status: "confirmed", at: "22.05.2024" },
    { status: "shipping", at: "23.05.2024" },
    { status: "delivered", at: "24.05.2024" },
  ]),
  mk("JOJ-1035", "math-blocks", "Matematika bloklari", 380_000, "Aziz Rahmatov", "+998 91 222 11 00", "USR-00010985", "Toshkent, Yashnobod", "delivered", "20.05.2024", [
    { status: "sent", at: "20.05.2024" },
    { status: "delivered", at: "23.05.2024" },
  ]),
  mk("JOJ-1034", "math-blocks", "Matematika bloklari", 380_000, "Gulbahor S.", "+998 93 444 55 66", "USR-00010850", "Samarqand, Siyob", "delivered", "18.05.2024", [
    { status: "sent", at: "18.05.2024" },
    { status: "delivered", at: "21.05.2024" },
  ]),
  mk("JOJ-1033", "math-blocks", "Matematika bloklari", 380_000, "Rustam K.", "+998 99 333 22 11", "USR-00010720", "Namangan", "shipping", "28.05.2024", [
    { status: "sent", at: "28.05.2024" },
    { status: "confirmed", at: "29.05.2024" },
    { status: "shipping", at: "30.05.2024" },
  ]),
  mk("JOJ-1032", "math-blocks", "Matematika bloklari", 380_000, "Madina O.", "+998 90 555 66 77", "USR-00010600", "Toshkent, Sergeli", "delivered", "15.05.2024", [
    { status: "sent", at: "15.05.2024" },
    { status: "delivered", at: "18.05.2024" },
  ]),
  mk("JOJ-1031", "alifbe-kitobi", "Quvnoq alifbe", 65_000, "Bobur N.", "+998 91 777 88 99", "USR-00010488", "Qarshi", "delivered", "12.05.2024", [
    { status: "sent", at: "12.05.2024" },
    { status: "delivered", at: "15.05.2024" },
  ]),
  mk("JOJ-1030", "alifbe-kitobi", "Quvnoq alifbe", 65_000, "Marjona T.", "+998 93 600 50 40", "USR-00010350", "Toshkent, Olmazor", "delivered", "10.05.2024", [
    { status: "sent", at: "10.05.2024" },
    { status: "delivered", at: "13.05.2024" },
  ]),
  mk("JOJ-1029", "alifbe-kitobi", "Quvnoq alifbe", 65_000, "Sherali R.", "+998 99 100 90 80", "USR-00010220", "Toshkent, Mirobod", "delivered", "08.05.2024", [
    { status: "sent", at: "08.05.2024" },
    { status: "delivered", at: "11.05.2024" },
  ]),
  mk("JOJ-1028", "alifbe-kitobi", "Quvnoq alifbe", 65_000, "Lola K.", "+998 90 234 56 78", "USR-00010100", "Nukus", "cancelled", "06.05.2024", [
    { status: "sent", at: "06.05.2024" },
    { status: "cancelled", at: "07.05.2024", by: "Operator A." },
  ], "Mijoz javob bermadi."),
  mk("JOJ-1027", "codybot", "CodyBot — dasturlash roboti", 1_290_000, "Jasur A.", "+998 91 345 67 89", "USR-00009980", "Toshkent, Chilonzor", "delivered", "04.05.2024", [
    { status: "sent", at: "04.05.2024" },
    { status: "delivered", at: "08.05.2024" },
  ]),
  mk("JOJ-1026", "codybot", "CodyBot — dasturlash roboti", 1_290_000, "Nodira E.", "+998 93 567 89 01", "USR-00009850", "Toshkent, Yakkasaroy", "cancelled", "02.05.2024", [
    { status: "sent", at: "02.05.2024" },
    { status: "review", at: "03.05.2024" },
    { status: "cancelled", at: "04.05.2024", by: "Operator B." },
  ], "Narx yuqori deb topdi."),
  mk("JOJ-1025", "ertaklar-kitobi", "Sehrli ertaklar — 1-jild", 95_000, "Feruza M.", "+998 99 678 90 12", "USR-00009720", "Samarqand", "delivered", "01.05.2024", [
    { status: "sent", at: "01.05.2024" },
    { status: "delivered", at: "04.05.2024" },
  ]),
  mk("JOJ-1024", "ertaklar-kitobi", "Sehrli ertaklar — 1-jild", 95_000, "Otabek S.", "+998 90 789 01 23", "USR-00009600", "Buxoro", "delivered", "29.04.2024", [
    { status: "sent", at: "29.04.2024" },
    { status: "delivered", at: "02.05.2024" },
  ]),
  mk("JOJ-1023", "drawing-tablet", "LCD chizish planshet", 180_000, "Mohira K.", "+998 91 890 12 34", "USR-00009480", "Toshkent, Yunusobod", "cancelled", "27.04.2024", [
    { status: "sent", at: "27.04.2024" },
    { status: "review", at: "28.04.2024" },
    { status: "cancelled", at: "29.04.2024", by: "Mijoz" },
  ], "Boshqa rangini xohlagan edi."),
  mk("JOJ-1022", "drawing-tablet", "LCD chizish planshet", 180_000, "Sanjar T.", "+998 93 901 23 45", "USR-00009360", "Andijon", "cancelled", "25.04.2024", [
    { status: "sent", at: "25.04.2024" },
    { status: "cancelled", at: "26.04.2024", by: "Operator C." },
  ], "Yetkazib berish hududidan tashqari."),
  mk("JOJ-1021", "codybot", "CodyBot — dasturlash roboti", 1_290_000, "Komron Y.", "+998 99 012 34 56", "USR-00009240", "Toshkent, Shayxontohur", "delivered", "23.04.2024", [
    { status: "sent", at: "23.04.2024" },
    { status: "delivered", at: "27.04.2024" },
  ]),
  mk("JOJ-1020", "math-blocks", "Matematika bloklari", 380_000, "Sevinch B.", "+998 90 123 45 60", "USR-00009120", "Farg'ona", "delivered", "21.04.2024", [
    { status: "sent", at: "21.04.2024" },
    { status: "delivered", at: "24.04.2024" },
  ]),
  mk("JOJ-1019", "math-blocks", "Matematika bloklari", 380_000, "Akmal H.", "+998 91 234 56 71", "USR-00009000", "Toshkent, Yashnobod", "review", "29.05.2024 10:30", [
    { status: "sent", at: "29.05.2024 10:30" },
    { status: "review", at: "29.05.2024 14:20", by: "Operator A." },
  ]),
  mk("JOJ-1018", "codybot", "CodyBot — dasturlash roboti", 1_290_000, "Diyora R.", "+998 93 345 67 82", "USR-00008880", "Toshkent, Mirzo Ulug'bek", "confirmed", "28.05.2024 15:40", [
    { status: "sent", at: "28.05.2024 15:40" },
    { status: "review", at: "29.05.2024 09:10", by: "Operator B." },
    { status: "confirmed", at: "29.05.2024 11:00", by: "Operator B." },
  ]),
  mk("JOJ-1017", "alifbe-kitobi", "Quvnoq alifbe", 65_000, "Bekzod M.", "+998 99 456 78 93", "USR-00008760", "Toshkent, Bektemir", "sent", "31.05.2024 16:00", [
    { status: "sent", at: "31.05.2024 16:00" },
  ]),
  mk("JOJ-1016", "ertaklar-kitobi", "Sehrli ertaklar — 1-jild", 95_000, "Nargiza D.", "+998 90 567 89 04", "USR-00008640", "Toshkent, Chilonzor", "delivered", "19.04.2024", [
    { status: "sent", at: "19.04.2024" },
    { status: "delivered", at: "22.04.2024" },
  ]),
];
