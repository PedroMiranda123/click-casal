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
}

export function RecentTransactions({ transactions, categories, paymentMethods, loading, error, onRetry }: Props) {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const pmById = new Map(paymentMethods.map((p) => [p.id, p]));

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

          return (
            <li key={tx.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'rgba(27,42,56,0.06)' }}>
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
              <span
                className="font-amount text-sm font-medium flex-shrink-0"
                style={{ color }}
              >
                {sign}{formatAmount(tx.originalAmount, tx.originalCurrency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
