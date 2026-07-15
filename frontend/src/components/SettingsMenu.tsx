import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isPushSupported, isCurrentlySubscribed, subscribeToPush, unsubscribeFromPush } from '../lib/push';

export function SettingsMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPushSupported()) {
      setPushSupported(true);
      isCurrentlySubscribed().then(setPushSubscribed);
    }
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function handlePushToggle() {
    setPushLoading(true);
    setPushError(null);
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush();
        setPushSubscribed(false);
      } else {
        await subscribeToPush();
        setPushSubscribed(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar notificações';
      setPushError(msg);
    } finally {
      setPushLoading(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
        style={{ background: open ? 'var(--gold-bg)' : 'transparent', color: 'var(--ink-dim)' }}
        aria-label="Configurações"
        aria-expanded={open}
      >
        <GearIcon />
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-56 glass-panel-strong rounded-2xl shadow-xl p-2 z-50"
          role="menu"
        >
          <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'rgba(27,42,56,0.08)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--ink-faint)' }}>{user?.email}</p>
          </div>
          {pushSupported && (
            <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'rgba(27,42,56,0.08)' }}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Notificações push</label>
                <button
                  onClick={handlePushToggle}
                  disabled={pushLoading}
                  className="w-11 h-6 rounded-full transition-colors relative"
                  style={{
                    background: pushSubscribed ? 'var(--gold)' : 'rgba(27,42,56,0.15)',
                    opacity: pushLoading ? 0.6 : 1,
                  }}
                  aria-label={pushSubscribed ? 'Desativar notificações' : 'Ativar notificações'}
                >
                  <div
                    className="w-5 h-5 rounded-full absolute top-0.5 transition-transform"
                    style={{
                      background: '#fff',
                      transform: pushSubscribed ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
                    }}
                  />
                </button>
              </div>
              {pushError && <p className="text-xs mt-1" style={{ color: 'var(--coral)' }}>{pushError}</p>}
            </div>
          )}
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--coral)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--coral-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            role="menuitem"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
