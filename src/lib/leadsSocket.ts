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

function ensureSocket(): Socket {
  if (socket) return socket;
  const token = getAccessToken();
  socket = io(SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 10000,
  });
  return socket;
}

export function subscribe(
  event: LeadEvent,
  handler: (data: unknown) => void,
): () => void {
  const s = ensureSocket();
  refCount++;
  s.on(event, handler);
  return () => {
    s.off(event, handler);
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && socket) {
      socket.disconnect();
      socket = null;
    }
  };
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}
