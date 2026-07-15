import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsMenu } from '../components/SettingsMenu';
import { NotificationBell } from '../components/NotificationBell';
import PokeSheet from '../components/PokeSheet';
import { useAuth } from '../context/AuthContext';

interface HubCard {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route?: string; // undefined = coming soon
}

const CARDS: HubCard[] = [
  {
    title: 'Finanças',
    subtitle: 'Saldo, gastos e transações',
    icon: <FinancasIcon />,
    route: '/financas',
  },
  {
    title: 'Calendário',
    subtitle: 'Eventos e lembretes',
    icon: <CalendarIcon />,
    route: '/calendario',
  },
  {
    title: 'Compras',
    subtitle: 'Lista com ofertas da semana',
    icon: <ShoppingIcon />,
    route: '/compras',
  },
  {
    title: 'Viagens',
    subtitle: 'Roteiros e reservas',
    icon: <TravelIcon />,
  },
  {
    title: 'Jogos',
    subtitle: 'Desafios e metas',
    icon: <GamesIcon />,
  },
  {
    title: 'Eventos',
    subtitle: 'O que fazer juntos',
    icon: <EventsIcon />,
  },
];

export function HubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPokeSheet, setShowPokeSheet] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-none" style={{ color: 'var(--ink)' }}>
            Click Casal
          </h1>
          {user && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-faint)' }}>
              Olá, {user.name.split(' ')[0]}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <SettingsMenu />
        </div>
      </header>

      <main className="flex-1 px-4 pt-3 pb-8">
        {/* Finanças — hero card, full width */}
        <button
          onClick={() => navigate('/financas')}
          className="glass-panel w-full rounded-3xl p-5 text-left mb-3 transition-all active:scale-[0.98] hover:shadow-md"
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-start justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--gold-bg)', color: 'var(--gold)' }}
            >
              <FinancasIcon />
            </div>
            <ArrowIcon />
          </div>
          <p className="font-display text-xl font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
            Finanças
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-dim)' }}>
            Saldo, gastos e transações
          </p>
        </button>

        {/* Secondary cards — 2-column grid */}
        <div className="grid grid-cols-2 gap-3">
          {CARDS.slice(1).map((card) =>
            card.route ? (
              <button
                key={card.title}
                onClick={() => navigate(card.route!)}
                className="flat-panel rounded-2xl p-4 text-left transition-all active:scale-[0.97] hover:shadow-sm"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                >
                  {card.icon}
                </div>
                <p className="font-display text-base font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
                  {card.title}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--ink-faint)' }}>
                  {card.subtitle}
                </p>
              </button>
            ) : (
              <div
                key={card.title}
                className="flat-panel rounded-2xl p-4 opacity-50 select-none"
                aria-disabled="true"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                >
                  {card.icon}
                </div>
                <p className="font-display text-base font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
                  {card.title}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--ink-faint)' }}>
                  {card.subtitle}
                </p>
                <span
                  className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--gold-bg)', color: 'var(--gold)' }}
                >
                  Em breve
                </span>
              </div>
            )
          )}
          <button
            onClick={() => setShowPokeSheet(true)}
            className="flat-panel rounded-2xl p-4 text-left transition-all active:scale-[0.97] hover:shadow-sm"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            >
              👉
            </div>
            <p className="font-display text-base font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
              Cutucar
            </p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--ink-faint)' }}>
              Mande uma mensagem
            </p>
          </button>
        </div>
      </main>

      {showPokeSheet && <PokeSheet onClose={() => setShowPokeSheet(false)} />}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-faint)' }} aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function FinancasIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ShoppingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function TravelIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function GamesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><circle cx="15" cy="11" r="1" /><circle cx="17" cy="13" r="1" /><path d="M17 1H7C3.13 1 0 4.13 0 8v3c0 3.87 3.13 7 7 7h10c3.87 0 7-3.13 7-7V8c0-3.87-3.13-7-7-7z" />
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
