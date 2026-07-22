import type { DailyPoint } from '../types';
import { formatDKK, maskAmount } from '../lib/format';

interface Props {
  balanceDkk: number | null;
  timeline: DailyPoint[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  hidden?: boolean;
}

function PulseLine({ timeline }: { timeline: DailyPoint[] }) {
  if (timeline.length < 2) return null;

  const values = timeline.map((p) => p.balanceDkk);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 300;
  const H = 48;
  const pad = 4;

  const pts = timeline
    .map((p, i) => {
      const x = (i / (timeline.length - 1)) * W;
      const y = H - pad - ((p.balanceDkk - min) / range) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const fillPts = `0,${H} ${pts} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pulse-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={fillPts} fill="url(#pulse-fill)" stroke="none" />
      <polyline points={pts} fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

export function BalanceCard({ balanceDkk, timeline, loading, error, onRetry, hidden = false }: Props) {
  if (loading) {
    return (
      <div className="glass-panel rounded-3xl px-5 pt-5 pb-2 h-36">
        <div className="skeleton rounded-lg h-3 w-24 mb-3" />
        <div className="skeleton rounded-lg h-10 w-48 mb-4" />
        <div className="skeleton rounded-lg h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-3xl px-5 py-5 flex flex-col gap-3">
        <p className="text-sm" style={{ color: 'var(--coral)' }}>
          Não foi possível carregar o saldo.
        </p>
        <button onClick={onRetry} className="btn-ghost self-start text-xs" style={{ color: 'var(--coral)' }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl px-5 pt-5 pb-2 overflow-hidden">
      <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--ink-faint)' }}>
        Saldo atual
      </p>
      <p
        className="font-display text-4xl font-semibold leading-none mb-4"
        style={{ color: 'var(--ink)', opacity: hidden ? 0.5 : 1, transition: 'opacity 200ms' }}
      >
        {hidden ? maskAmount('DKK') : formatDKK(balanceDkk ?? 0)}
      </p>
      <PulseLine timeline={timeline} />
    </div>
  );
}
