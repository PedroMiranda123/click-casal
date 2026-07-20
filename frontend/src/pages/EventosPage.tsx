import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Suggestion {
  id: string;
  source: string;
  title: string;
  description: string | null;
  venueName: string | null;
  city: string | null;
  startAt: string;
  url: string | null;
  imageUrl: string | null;
  category: string | null;
  kind: 'EVENT' | 'MOVIE';
  status: 'NEW' | 'DISMISSED' | 'ADDED';
  reason: string | null;
}

const API = import.meta.env.VITE_API_URL ?? 'https://api.clickcasal.com.br';

export default function EventosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEventosTab = location.pathname === '/eventos';
  const isFilmesTab = location.pathname === '/eventos/filmes';

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'NEW' | 'ADDED' | 'DISMISSED'>('NEW');
  const [activeItem, setActiveItem] = useState<Suggestion | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSuggestions = async (kind: 'EVENT' | 'MOVIE') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/event-suggestions?kind=${kind}&status=${selectedStatus}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Erro ao carregar sugestões');
      setSuggestions(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEventosTab) fetchSuggestions('EVENT');
    if (isFilmesTab) fetchSuggestions('MOVIE');
  }, [location.pathname, selectedStatus]);

  const handleAction = async (id: string, status: 'ADDED' | 'DISMISSED') => {
    setActionLoading(true);
    try {
      await fetch(`${API}/api/event-suggestions/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setSuggestions(prev => prev.filter(s => s.id !== id));
      setActiveItem(null);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const sourceLabel: Record<string, string> = {
    ticketmaster: 'Ticketmaster',
    hidden_nordvest: 'Hidden Nordvest',
    nv_and_more: 'NV & More',
    kulturkbh: 'KulturKBH',
    tmdb: 'TMDB',
  };

  const StatusTabs = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {(['NEW', 'ADDED', 'DISMISSED'] as const).map(s => (
        <button
          key={s}
          onClick={() => setSelectedStatus(s)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: selectedStatus === s ? 'var(--gold)' : 'var(--gold-bg)',
            color: selectedStatus === s ? '#fff' : 'var(--ink)',
            transition: 'all 0.15s',
          }}
        >
          {s === 'NEW' ? 'Novas' : s === 'ADDED' ? 'Salvas' : 'Descartadas'}
        </button>
      ))}
    </div>
  );

  const SuggestionCard = ({ item }: { item: Suggestion }) => (
    <div
      className="flat-panel"
      onClick={() => setActiveItem(item)}
      style={{ padding: 16, marginBottom: 12, cursor: 'pointer', borderRadius: 16 }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title}
          </div>
          {item.venueName && (
            <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 2 }}>📍 {item.venueName}</div>
          )}
          <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 4 }}>
            🗓 {formatDate(item.startAt)}
          </div>
          {item.reason && (
            <div style={{ fontSize: 12, color: 'var(--blue)', fontStyle: 'italic' }}>
              ✨ {item.reason}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', flexShrink: 0 }}>
          {sourceLabel[item.source] ?? item.source}
        </div>
      </div>
    </div>
  );

  const ListContent = () => (
    <div>
      <StatusTabs />
      {loading && (
        <div>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 16, marginBottom: 12 }} />)}
        </div>
      )}
      {error && <div style={{ color: 'var(--coral)', padding: 16, textAlign: 'center' }}>{error}</div>}
      {!loading && !error && suggestions.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '48px 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎭</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhuma sugestão</div>
          <div style={{ fontSize: 14 }}>
            {selectedStatus === 'NEW'
              ? 'As sugestões aparecem aqui após o job semanal rodar.'
              : selectedStatus === 'ADDED'
              ? 'Nenhum evento salvo ainda.'
              : 'Nenhum evento descartado.'}
          </div>
        </div>
      )}
      {!loading && suggestions.map(s => <SuggestionCard key={s.id} item={s} />)}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f0eae3)', paddingBottom: 32 }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px 20px 12px', marginBottom: 8, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-dim)', fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Início
          </button>
          <button
            onClick={() => navigate('/eventos/interesses')}
            style={{ marginLeft: 'auto', background: 'var(--gold-bg)', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
          >
            🏷 Interesses
          </button>
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0, marginBottom: 12 }}>
          Eventos
        </h1>
        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: 'Eventos', path: '/eventos' },
            { label: 'Filmes', path: '/eventos/filmes' },
          ].map(tab => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                borderBottom: location.pathname === tab.path ? '2px solid var(--gold)' : '2px solid transparent',
                padding: '8px 0',
                fontWeight: 600,
                fontSize: 14,
                color: location.pathname === tab.path ? 'var(--ink)' : 'var(--ink-dim)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        {(isEventosTab || isFilmesTab) ? <ListContent /> : <Outlet />}
      </div>

      {/* Detail bottom sheet */}
      {activeItem && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setActiveItem(null)}
        >
          <div
            className="glass-panel-strong"
            style={{ width: '100%', borderRadius: '20px 20px 0 0', padding: 24, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {activeItem.imageUrl && (
              <img src={activeItem.imageUrl} alt={activeItem.title} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
            )}
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
              {activeItem.title}
            </div>
            {activeItem.venueName && <div style={{ color: 'var(--ink-dim)', marginBottom: 4 }}>📍 {activeItem.venueName}</div>}
            <div style={{ color: 'var(--ink-dim)', marginBottom: 4 }}>🗓 {formatDate(activeItem.startAt)}</div>
            {activeItem.reason && (
              <div style={{ color: 'var(--blue)', fontSize: 14, fontStyle: 'italic', marginBottom: 12 }}>✨ {activeItem.reason}</div>
            )}
            {activeItem.description && (
              <div style={{ color: 'var(--ink-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                {activeItem.description.slice(0, 400)}{activeItem.description.length > 400 ? '…' : ''}
              </div>
            )}
            {activeItem.url && (
              <a href={activeItem.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--blue)', fontSize: 14, marginBottom: 20 }}>
                Ver mais →
              </a>
            )}
            {activeItem.status === 'NEW' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => handleAction(activeItem.id, 'DISMISSED')}
                  disabled={actionLoading}
                  style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: 'var(--coral-bg)', color: 'var(--coral)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                >
                  Descartar
                </button>
                <button
                  onClick={() => handleAction(activeItem.id, 'ADDED')}
                  disabled={actionLoading}
                  style={{ flex: 2, padding: '14px 0', borderRadius: 14, border: 'none', background: 'var(--gold)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                >
                  Adicionar ao Calendário
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
