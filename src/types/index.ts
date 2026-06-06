export type UserStatus =
  | "yangi"
  | "jarayonda"
  | "kutilmoqda"
  | "hal_qilingan"
  | "yopilgan"
  | "bloklangan";

export type ChildStatus = "ulangan" | "ulanmagan";
export type PremiumStatus = "sotib_olgan" | "sotib_olmagan" | "faol";

export interface Child {
  id: string;
  name: string;
  age: number;
  gender: "Erkak" | "Ayol";
  device: string;
  connected: boolean;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  type: string;
  status: "muvaffaqiyatli" | "kutilmoqda" | "rad_etilgan";
}

export interface ActivityLog {
  id: string;
  date: string;
  type: string;
  description: string;
}

export interface Comment {
  id: string;
  operatorName: string;
  operatorAvatar: string;
  status: UserStatus;
  date: string;
  text: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gender: "Erkak" | "Ayol";
  birthDate: string;
  avatar: string;
  status: UserStatus;
  childStatus: ChildStatus;
  premiumStatus: PremiumStatus;
  premiumDaysLeft?: number;
  premiumExpiry?: string;
  registeredAt: string;
  lastActivity: string;
  currentOperator?: { name: string; avatar: string };
  startedAt?: string;
  waitingTime?: string;
  resolvedAt?: string;
  closedAt?: string;
  closedReason?: string;
  blockedAt?: string;
  blockedReason?: string;
  cardTimestamp: string;
  commentsCount: number;
  operatorNote?: string;
  comments?: Comment[];
  children?: Child[];
  payments?: Payment[];
  activity?: ActivityLog[];
}

export interface StatColumn {
  status: UserStatus;
  label: string;
  count: number;
  color: string;
}
