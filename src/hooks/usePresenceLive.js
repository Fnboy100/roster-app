import { useEffect, useRef } from 'react';
import { connectNotificationSocket } from '../api/websocket';
import { useAuth } from '../context/AuthContext';

/**
 * Subscribes to the shared /ws socket (see app/routers/ws.py) and calls
 * onEvent for any presence-related push: a new presence_event (clock in/out,
 * break start/end, ...), a new presence_violation, or a
 * presence_violation_check (an automatic rule check ran after a break
 * ended — may or may not have created a violation). The backend already
 * scopes these pushes to admin/manager/outlet_manager users for the
 * relevant outlet, so no client-side filtering is needed beyond the type
 * check here.
 */
export function usePresenceLive(onEvent) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const socket = connectNotificationSocket({
      onMessage: (data) => {
        if (data?.type === 'presence_event' || data?.type === 'presence_violation' || data?.type === 'presence_violation_check') {
          handlerRef.current?.(data);
        }
      },
    });
    socketRef.current = socket;

    return () => {
      socket?.close();
      socketRef.current = null;
    };
  }, [isAuthenticated]);
}
