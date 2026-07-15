import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          background: '#f1f5f9',
          border: 'none',
          borderRadius: 8,
          width: 36,
          height: 36,
          cursor: 'pointer',
          fontSize: 16,
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: '#dc2626',
              color: '#fff',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 42,
            width: 320,
            maxHeight: 420,
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.16)',
            border: '1px solid #e2e8f0',
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #f8fafc',
                  fontSize: 13,
                  color: n.is_read ? '#94a3b8' : '#0f172a',
                  background: n.is_read ? '#fff' : '#f0f9ff',
                  cursor: n.is_read ? 'default' : 'pointer',
                }}
              >
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
