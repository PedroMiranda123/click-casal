import { useEffect, useRef, useState } from 'react';
import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead, NotificationItem } from '../lib/push';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;

  return date.toLocaleDateString('pt-BR');
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const count = await fetchUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    }

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      if (!open) return;
      setLoading(true);
      try {
        const items = await fetchNotifications();
        setNotifications(items);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    if (open) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleMarkRead(id: string) {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markNotificationRead(id);
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to mark as read:', err);
      await reloadNotifications();
    }
  }

  async function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      await reloadNotifications();
    }
  }

  async function reloadNotifications() {
    try {
      const items = await fetchNotifications();
      setNotifications(items);
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to reload:', err);
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read);
  const displayCount = unreadCount > 9 ? '9+' : unreadCount > 0 ? unreadCount.toString() : '';

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors relative"
        style={{ background: open ? 'var(--gold-bg)' : 'transparent', color: 'var(--ink-dim)' }}
        aria-label="Notificações"
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <div
            className="absolute top-0 right-0 min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'var(--coral)', transform: 'translate(2px, -2px)' }}
          >
            {displayCount}
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{ background: 'var(--glass-strong)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', maxHeight: '24rem', display: 'flex', flexDirection: 'column' }}
          role="menu"
        >
          {unreadNotifications.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-xs font-medium border-b transition-colors"
              style={{ borderColor: 'rgba(27,42,56,0.08)', color: 'var(--ink-dim)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(27,42,56,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              Marcar todas como lidas
            </button>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && (
              <div className="px-4 py-3 text-center text-xs" style={{ color: 'var(--ink-muted)' }}>
                Carregando...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>
                Nenhuma notificação por aqui
              </div>
            )}

            {!loading && notifications.map((n) => {
              const hasContent = n.title.trim() || n.body.trim();
              if (!hasContent) return null;

              const icon = n.type === 'POKE' ? '👉' : '📅';
              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className="w-full text-left px-4 py-3 border-b transition-colors"
                  style={{
                    borderColor: 'rgba(27,42,56,0.08)',
                    opacity: n.read ? 0.6 : 1,
                    background: !n.read ? 'rgba(255, 193, 7, 0.05)' : 'transparent',
                    borderLeft: !n.read ? '3px solid var(--gold)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!n.read) (e.currentTarget.style.background = 'rgba(27,42,56,0.04)');
                  }}
                  onMouseLeave={(e) => {
                    if (!n.read) (e.currentTarget.style.background = 'rgba(255, 193, 7, 0.05)');
                  }}
                >
                  <div className="flex gap-2">
                    <div className="text-lg flex-shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0">
                      {n.title && <p className="text-xs font-medium leading-tight" style={{ color: 'var(--ink)' }}>{n.title}</p>}
                      {n.body && <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--ink-dim)' }}>{n.body}</p>}
                      <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>{formatRelativeTime(n.sentAt)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
