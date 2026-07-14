import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function SettingsMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

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
