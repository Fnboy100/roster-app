import { useCallback, useEffect, useRef, useState } from 'react';
import * as notificationsApi from '../api/notifications';
import { connectNotificationSocket } from '../api/websocket';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.listNotifications();
      setNotifications(data);
    } catch {
      // Notifications are a nice-to-have; a failed fetch here shouldn't
      // break the rest of the page, so it's silently skipped.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    refresh();

    // Live push: a new notification event arrives as
    // { type: "notification", id, message }. Prepend it optimistically
    // rather than re-fetching, so the bell updates instantly.
    const socket = connectNotificationSocket({
      onMessage: (event) => {
        if (event?.type === 'notification') {
          setNotifications((prev) => [
            { id: event.id, message: event.message, is_read: false, created_at: new Date().toISOString() },
            ...prev,
          ]);
        }
      },
    });
    socketRef.current = socket;

    return () => {
      socket?.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (notificationId) => {
    await notificationsApi.markRead(notificationId);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, refresh, markRead, markAllRead };
}
