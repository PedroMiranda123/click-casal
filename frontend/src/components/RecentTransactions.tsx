import { useState } from 'react';
import type { Category, PaymentMethod, Transaction } from '../types';
import { formatAmount } from '../lib/format';
import { ErrorCard } from './ErrorCard';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export function RecentTransactions({ transactions, categories, paymentMethods, loading, error, onRetry, onDelete }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const catById = new Map(categories.map((c) => [c.id, c]));
  const pmById = new Map(paymentMethods.map((p) => [p.id, p]));

  async function handleDelete(id: string) {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setDeleting(false);
      setConfirmingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flat-panel rounded-2xl p-4">
        <div className="skeleton rounded h-4 w-44 mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="skeleton rounded-xl w-10 h-10 flex-shrink-0" />
            <div className="flex-1">
              <div className="skeleton rounded h-3 w-32 mb-1.5" />
              <div className="skeleton rounded h-2.5 w-20" />
            </div>
            <div className="skeleton rounded h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorCard message="Não foi possível carregar as transações." onRetry={onRetry} />;
  }

  if (transactions.length === 0) {
    return (
      <div className="flat-panel rounded-2xl p-4">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Transações recentes</p>
        <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Nenhuma transação registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="flat-panel rounded-2xl p-4">
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Transações recentes</p>
      <ul className="space-y-1">
        {transactions.map((tx) => {
          const cat = tx.categoryId ? catById.get(tx.categoryId) : null;
          const pm = pmById.get(tx.paymentMethodId);
          const isIncome = tx.type === 'INCOME';
          const color = isIncome ? 'var(--blue)' : 'var(--coral)';
          const bgColor = isIncome ? 'var(--blue-bg)' : 'var(--coral-bg)';
          const sign = isIncome ? '+' : '−';

          const isConfirming = confirmingId === tx.id;

          return (
            <li key={tx.id} className="border-b last:border-0" style={{ borderColor: 'rgba(27,42,56,0.06)' }}>
              <div className="flex items-center gap-3 py-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: bgColor, color }}
                  aria-hidden="true"
                >
                  {isIncome ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
                    {tx.description ?? cat?.name ?? (isIncome ? 'Receita' : 'Gasto')}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--ink-faint)' }}>
                    {cat?.name ?? '—'}
                    {pm ? ` · ${pm.name}` : ''}
                    {' · '}
                    {new Date(tx.occurredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="font-amount text-sm font-medium flex-shrink-0" style={{ color }}>
                  {sign}{formatAmount(tx.originalAmount, tx.originalCurrency)}
                </span>
                {onDelete && (
                  <button
                    onClick={() => setConfirmingId(isConfirming ? null : tx.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
                    style={{ color: isConfirming ? 'var(--coral)' : 'var(--ink-faint)', background: isConfirming ? 'var(--coral-bg)' : 'transparent' }}
                    aria-label="Excluir lançamento"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              {isConfirming && (
                <div className="flex items-center gap-2 pb-2 pl-13">
                  <p className="text-xs flex-1" style={{ color: 'var(--ink-dim)' }}>Excluir este lançamento?</p>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deleting}
                    className="text-xs font-semibold px-3 py-1 rounded-lg transition-opacity disabled:opacity-50"
                    style={{ background: 'var(--coral)', color: '#fff' }}
                  >
                    Excluir
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
        })}
      </ul>
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
