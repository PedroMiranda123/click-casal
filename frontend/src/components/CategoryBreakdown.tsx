import type { CategoryBreakdown as CB } from '../types';
import { formatDKK } from '../lib/format';
import { ErrorCard } from './ErrorCard';

interface Props {
  breakdown: CB[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

// Cycle blue → gold → coral for bar colors (no semantic meaning, just variety)
const BAR_COLORS = ['var(--blue)', 'var(--gold)', 'var(--coral)'];
const BAR_BG_COLORS = ['var(--blue-bg)', 'var(--gold-bg)', 'var(--coral-bg)'];

export function CategoryBreakdown({ breakdown, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="flat-panel rounded-2xl p-4">
        <div className="skeleton rounded h-4 w-40 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="skeleton rounded w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <div className="skeleton rounded h-3 w-28 mb-1.5" />
              <div className="skeleton rounded-full h-2 w-full" />
            </div>
            <div className="skeleton rounded h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorCard
        message="Não foi possível carregar as categorias."
        onRetry={onRetry}
      />
    );
  }

  if (breakdown.length === 0) {
    return (
      <div className="flat-panel rounded-2xl p-4">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Gastos por categoria</p>
        <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Nenhum gasto este mês ainda.</p>
      </div>
    );
  }

  const max = Math.max(...breakdown.map((b) => b.totalDkk));

  return (
    <div className="flat-panel rounded-2xl p-4">
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Gastos por categoria</p>
      <ul className="space-y-3">
        {breakdown.map((item, i) => {
          const color = BAR_COLORS[i % BAR_COLORS.length];
          const bgColor = BAR_BG_COLORS[i % BAR_BG_COLORS.length];
          const pct = max > 0 ? (item.totalDkk / max) * 100 : 0;
          return (
            <li key={item.categoryId} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: bgColor, color }}>
                ●
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate mb-1" style={{ color: 'var(--ink-dim)' }}>
                  {item.categoryName}
                </p>
                <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(27,42,56,0.07)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
              <span className="font-amount text-xs font-medium flex-shrink-0" style={{ color: 'var(--ink)' }}>
                {formatDKK(item.totalDkk)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
