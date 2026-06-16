/**
 * Socket.IO mijoz lead board uchun.
 *
 * Bitta singleton-style ulanish ochadi. Komponentlar `subscribe()` orqali
 * event listener qo'shadi va return qilingan unsubscribe'ni cleanup'da
 * chaqiradi. Token localStorage'dan o'qiladi (jojo_admin_token).
 */
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api";

const SOCKET_URL = (() => {
  // API_BASE = "https://api.jojoapp.uz/api" → socket'ga origin kerak.
  const apiUrl = "https://api.jojoapp.uz/api";
  return apiUrl.replace(/\/api\/?$/, "");
})();

type LeadEvent =
  | "lead_changed"
  | "lead_comment"
  | "connect"
  | "disconnect"
  | "connect_error"
  | "connected";

let socket: Socket | null = null;
let refCount = 0;

// Listener'larni o'zimiz registr qilamiz — qayta connect bo'lganda yangi
// socket'ga ham bir xil handler'larni bog'lab beramiz. socket-io-client
// `disconnect()`dan keyin handler'larni unutadi.
type Registered = { event: LeadEvent; handler: (data: unknown) => void };
const registered: Set<Registered> = new Set();

function buildSocket(): Socket {
  const token = getAccessToken();
  const s = io(SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 10000,
  });
  // Saqlangan listener'larni yangi socket'ga qayta ulaymiz.
  for (const r of registered) s.on(r.event, r.handler);
  return s;
}

function ensureSocket(): Socket {
  if (socket) return socket;
  socket = buildSocket();
  return socket;
}

export function subscribe(
  event: LeadEvent,
  handler: (data: unknown) => void,
): () => void {
  const s = ensureSocket();
  const reg: Registered = { event, handler };
  registered.add(reg);
  refCount++;
  s.on(event, handler);
  return () => {
    s.off(event, handler);
    registered.delete(reg);
    refCount = Math.max(0, refCount - 1);
    // refCount=0 bo'lganda socket'ni darhol uzmaymiz — Lead'lar sahifasi
    // tezroq qaytib kelganda qayta connect qilmasligi uchun (komponent
    // re-mount tabiiy uzilish-ulanishini hisobga olib). Real ulanish
    // sahifa yopilganda brauzer tomonidan tozalanadi.
  };
}

/** Ulanishni majburan yangilaydi — token yangilanganda yoki foydalanuvchi
 *  "Reconnect" bossagandan keyin ishlatamiz. Eski handler'lar yangi
 *  socket'ga avtomatik bog'lanadi. */
export function reconnect(): void {
  if (socket) {
    try {
      socket.disconnect();
    } catch {
      // ignore
    }
    socket = null;
  }
  socket = buildSocket();
  socket.connect();
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}
