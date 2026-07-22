import type { DailyPoint } from '../types';
import { formatDKK, maskAmount } from '../lib/format';
import { ErrorCard } from './ErrorCard';

interface Props {
  timeline: DailyPoint[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  hidden?: boolean;
}

export function TimelineChart({ timeline, loading, error, onRetry, hidden = false }: Props) {
  if (loading) {
    return (
      <div className="flat-panel rounded-2xl p-4">
        <div className="skeleton rounded h-4 w-40 mb-3" />
        <div className="skeleton rounded h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorCard message="Não foi possível carregar o gráfico." onRetry={onRetry} />;
  }

  if (timeline.length < 2) {
    return (
      <div className="flat-panel rounded-2xl p-4">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Evolução do saldo</p>
        <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Dados insuficientes para exibir o gráfico.</p>
      </div>
    );
  }

  const values = timeline.map((p) => p.balanceDkk);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 400;
  const H = 96;
  const padX = 2;
  const padY = 8;

  const toXY = (i: number, v: number) => ({
    x: padX + (i / (timeline.length - 1)) * (W - padX * 2),
    y: H - padY - ((v - min) / range) * (H - padY * 2),
  });

  const pts = timeline.map((p, i) => {
    const { x, y } = toXY(i, p.balanceDkk);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePts = pts.join(' ');
  const fillPts = `${padX},${H} ${linePts} ${W - padX},${H}`;

  const lastPt = toXY(timeline.length - 1, values[values.length - 1]);
  const isPositive = values[values.length - 1] >= 0;

  return (
    <div className="flat-panel rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Evolução do saldo</p>
        <span
          className="font-amount text-xs font-medium"
          style={{ color: isPositive ? 'var(--blue)' : 'var(--coral)', opacity: hidden ? 0.5 : 1, transition: 'opacity 200ms' }}
        >
          {hidden ? maskAmount('DKK') : formatDKK(values[values.length - 1])}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="timeline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Zero line if balance goes negative */}
        {min < 0 && max > 0 && (
          <line
            x1={padX} y1={toXY(0, 0).y}
            x2={W - padX} y2={toXY(0, 0).y}
            stroke="var(--ink-faint)"
            strokeWidth="0.5"
            strokeDasharray="4 3"
          />
        )}
        <polyline points={fillPts} fill="url(#timeline-fill)" stroke="none" />
        <polyline points={linePts} fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Last point dot */}
        <circle cx={lastPt.x} cy={lastPt.y} r="3" fill="var(--gold)" />
      </svg>

      {/* Date range labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
          {new Date(timeline[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
        <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
          {new Date(timeline[timeline.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </div>
  );
}
