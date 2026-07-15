import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiJson } from '../api';
import AddItemSheet from '../components/AddItemSheet';
import type { ShoppingListItem } from '../types';

function formatPrice(ore: number) {
  return (ore / 100).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  // Track items that were just added and are still awaiting match
  const [pendingMatch, setPendingMatch] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const data = await apiJson<ShoppingListItem[]>('/shopping-list');
      setItems(data);
      setError(null);
    } catch {
      setError('Não foi possível carregar a lista.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(name: string) {
    const item = await apiJson<ShoppingListItem>('/shopping-list', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setItems(prev => [item, ...prev]);
    // Mark as pending match — poll once after 4s for the AI result
    setPendingMatch(prev => new Set(prev).add(item.id));
    setTimeout(async () => {
      try {
        const updated = await apiJson<ShoppingListItem[]>('/shopping-list');
        setItems(updated);
      } finally {
        setPendingMatch(prev => { const s = new Set(prev); s.delete(item.id); return s; });
      }
    }, 4000);
  }

  async function handleToggle(item: ShoppingListItem) {
    const updated = await apiJson<ShoppingListItem>(`/shopping-list/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ checked: !item.checked }),
    });
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await api(`/shopping-list/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== id));
      setConfirmingId(null);
    } finally {
      setDeleting(false);
    }
  }

  const active = items.filter(i => !i.checked);
  const done = items.filter(i => i.checked);

  function renderItem(item: ShoppingListItem) {
    const isConfirming = confirmingId === item.id;
    const isBadgeExpanded = expandedBadge === item.id;
    const isPending = pendingMatch.has(item.id) && !item.matchedOffer;

    return (
      <li
        key={item.id}
        className="border-b last:border-0"
        style={{ borderColor: 'rgba(27,42,56,0.06)' }}
      >
        <div className="flex items-center gap-3 py-3">
          {/* Checkbox */}
          <button
            onClick={() => handleToggle(item)}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              border: item.checked ? 'none' : '2px solid rgba(27,42,56,0.2)',
              background: item.checked ? 'var(--gold)' : 'transparent',
            }}
            aria-label={item.checked ? 'Desmarcar' : 'Marcar como feito'}
          >
            {item.checked && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="2 6 5 9 10 3" />
              </svg>
            )}
          </button>

          {/* Name */}
          <span
            className="flex-1 text-sm font-medium"
            style={{
              color: item.checked ? 'var(--ink-faint)' : 'var(--ink)',
              textDecoration: item.checked ? 'line-through' : 'none',
            }}
          >
            {item.name}
          </span>

          {/* Match badge / pending */}
          {isPending ? (
            <span
              className="text-xs px-2 py-1 rounded-full animate-pulse"
              style={{ background: 'var(--gold-bg)', color: 'var(--gold)' }}
            >
              …
            </span>
          ) : item.matchedOffer ? (
            <button
              onClick={() => setExpandedBadge(isBadgeExpanded ? null : item.id)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full flex-shrink-0 transition-all"
              style={{ background: 'var(--gold-bg)', color: 'var(--gold)', maxWidth: '9rem' }}
              aria-expanded={isBadgeExpanded}
            >
              <span className="truncate font-medium">{item.matchedOffer.dealerName}</span>
              <span className="opacity-60">·</span>
              <span className="font-medium flex-shrink-0">{formatPrice(item.matchedOffer.priceOre)}</span>
            </button>
          ) : null}

          {/* Trash */}
          <button
            onClick={() => setConfirmingId(isConfirming ? null : item.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
            style={{
              color: isConfirming ? 'var(--coral)' : 'var(--ink-faint)',
              background: isConfirming ? 'var(--coral-bg)' : 'transparent',
            }}
            aria-label="Remover item"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Expanded badge detail */}
        {isBadgeExpanded && item.matchedOffer && (
          <div
            className="px-9 pb-2 text-xs leading-relaxed"
            style={{ color: 'var(--ink-dim)' }}
          >
            {item.matchNote && (
              <p className="mb-0.5 italic">{item.matchNote}</p>
            )}
            <span className="font-medium" style={{ color: 'var(--gold)' }}>{item.matchedOffer.dealerName}</span>
            {' — '}{item.matchedOffer.name}
            {item.matchedOffer.prePriceOre != null && (
              <span className="line-through ml-2" style={{ color: 'var(--ink-faint)' }}>
                {formatPrice(item.matchedOffer.prePriceOre)}
              </span>
            )}
            <span className="ml-1 font-semibold" style={{ color: 'var(--ink)' }}>
              {formatPrice(item.matchedOffer.priceOre)}
            </span>
          </div>
        )}

        {/* Delete confirm */}
        {isConfirming && (
          <div className="flex items-center gap-2 pb-3 pl-9">
            <p className="text-xs flex-1" style={{ color: 'var(--ink-dim)' }}>Remover da lista?</p>
            <button
              onClick={() => handleDelete(item.id)}
              disabled={deleting}
              className="text-xs font-semibold px-3 py-1 rounded-lg transition-opacity disabled:opacity-50"
              style={{ background: 'var(--coral)', color: '#fff' }}
            >
              Remover
            </button>
            <button
              onClick={() => setConfirmingId(null)}
              className="text-xs font-medium px-3 py-1 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)' }}
            >
              Cancelar
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link
          to="/"
          className="text-sm font-medium px-3 py-1.5 rounded-full"
          style={{ color: 'var(--ink-muted)', background: 'rgba(0,0,0,0.06)' }}
        >
          ← Início
        </Link>
        <h1 className="text-xl font-semibold flex-1" style={{ color: 'var(--ink)' }}>Compras</h1>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--coral)' }}>{error}</p>
        ) : (
          <>
            {/* Active items */}
            {active.length === 0 && done.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: 'var(--ink-faint)' }}>
                Lista vazia. Toque + para adicionar.
              </p>
            ) : active.length === 0 ? (
              <p className="text-sm pb-4" style={{ color: 'var(--ink-faint)' }}>Tudo comprado!</p>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-border)' }}>
                <ul>
                  {active.map(renderItem)}
                </ul>
              </div>
            )}

            {/* Done section */}
            {done.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setDoneOpen(v => !v)}
                  className="flex items-center gap-2 mb-2 w-full text-left"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                    Concluídos ({done.length})
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: 'var(--ink-muted)', transform: doneOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {doneOpen && (
                  <div className="rounded-2xl overflow-hidden opacity-60" style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-border)' }}>
                    <ul>{done.map(renderItem)}</ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-2xl flex items-center justify-center"
        style={{ background: 'var(--gold)', boxShadow: '0 4px 20px rgba(201,154,59,0.45)', color: '#fff' }}
        onClick={() => setSheetOpen(true)}
        aria-label="Adicionar item"
      >
        +
      </button>

      {sheetOpen && (
        <AddItemSheet
          onAdd={handleAdd}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
