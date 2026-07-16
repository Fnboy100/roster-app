const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://restaurant-inventory-api-8h0b.onrender.com/api/v1';

/**
 * Opens the live-push WebSocket. Browsers can't set custom headers on a
 * WS handshake, so the JWT travels as a query param — matching
 * app/routers/ws.py exactly. Returns null if there's no token (caller
 * should only connect once logged in).
 */
export function connectNotificationSocket({ onMessage, onOpen, onClose, onError } = {}) {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  const socket = new WebSocket(`${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}`);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch {
      // Non-JSON frame (shouldn't happen per the backend's contract) — ignore.
    }
  };
  if (onOpen) socket.onopen = onOpen;
  if (onClose) socket.onclose = onClose;
  if (onError) socket.onerror = onError;

  return socket;
}
