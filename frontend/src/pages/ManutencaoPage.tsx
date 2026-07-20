import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchMaintenanceTasks, logMaintenanceTask } from '../api';
import type { MaintenanceTask } from '../types';

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  SEMESTRAL: 'Semestral',
  YEARLY: 'Anual',
};

const FREQ_ORDER = ['DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTRAL', 'YEARLY'];

// Quantos dias cada frequência "cobre" para considerar feito recentemente
const FREQ_DAYS: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  SEMESTRAL: 180,
  YEARLY: 365,
};

function daysSince(dateStr: string): number {
  const now = new Date();
  const done = new Date(dateStr);
  // Compare calendar dates, not elapsed hours
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const doneDay = new Date(done.getFullYear(), done.getMonth(), done.getDate());
  return Math.floor((nowDay.getTime() - doneDay.getTime()) / 86_400_000);
}

function TaskCard({
  task,
  onDone,
}: {
  task: MaintenanceTask;
  onDone: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const lastLog = task.logs[0];
  const days = lastLog ? daysSince(lastLog.doneAt) : null;
  const threshold = FREQ_DAYS[task.frequency];
  const isDone = days !== null && days < threshold;
  const isOverdue = days !== null && days > threshold * 1.5;

  const statusColor = isDone
    ? 'var(--blue)'
    : isOverdue
    ? 'var(--coral)'
    : 'var(--gold)';

  const daysLabel = days === 0 ? 'hoje' : days === 1 ? 'ontem' : `há ${days}d`;
  const statusLabel = isDone
    ? `✓ Feito ${daysLabel} por ${lastLog!.doneBy.name.split(' ')[0]}`
    : lastLog
    ? `Última vez ${daysLabel}`
    : 'Nunca feito';

  async function handleDone(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      await onDone(task.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 10,
        cursor: 'pointer',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: statusColor,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--ink)',
              marginBottom: 2,
            }}
          >
            {task.title}
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 12,
              color: statusColor,
            }}
          >
            {statusLabel}
          </div>
        </div>
        {!isDone && (
          <button
            onClick={handleDone}
            disabled={loading}
            style={{
              background: loading ? 'rgba(201,154,59,0.3)' : 'var(--gold)',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              flexShrink: 0,
            }}
          >
            {loading ? '...' : 'Feito ✓'}
          </button>
        )}
      </div>

      {/* Expanded description */}
      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.4)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 13,
            color: 'var(--ink-dim)',
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {task.category}
          </div>
          {task.description}
        </div>
      )}
    </div>
  );
}

export default function ManutencaoPage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFreq, setActiveFreq] = useState('MONTHLY');

  const load = useCallback(async () => {
    try {
      const data = await fetchMaintenanceTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDone(taskId: string) {
    await logMaintenanceTask(taskId);
    await load();
  }

  const filtered = tasks.filter((t) => t.frequency === activeFreq);

  const tabCounts = FREQ_ORDER.reduce<Record<string, { total: number; done: number }>>(
    (acc, freq) => {
      const group = tasks.filter((t) => t.frequency === freq);
      const threshold = FREQ_DAYS[freq];
      const done = group.filter((t) => {
        const last = t.logs[0];
        return last && daysSince(last.doneAt) < threshold;
      }).length;
      acc[freq] = { total: group.length, done };
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <Link
          to="/"
          className="text-sm font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all active:scale-95"
          style={{ color: 'var(--ink-dim)', background: 'rgba(27,42,56,0.07)' }}
        >← Início</Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--ink)' }}>
            Manutenção do AP
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-dim)' }}>Checklist de cuidados da casa</p>
        </div>
      </header>
      <main className="flex-1 pb-10">

      {/* Frequency tabs */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 8,
          padding: '16px 20px 4px',
          scrollbarWidth: 'none',
        }}
      >
        {FREQ_ORDER.map((freq) => {
          const counts = tabCounts[freq] ?? { total: 0, done: 0 };
          const isActive = freq === activeFreq;
          const allDone = counts.total > 0 && counts.done === counts.total;
          return (
            <button
              key={freq}
              onClick={() => setActiveFreq(freq)}
              style={{
                flexShrink: 0,
                background: isActive ? 'var(--gold)' : 'var(--glass)',
                color: isActive ? '#fff' : 'var(--ink)',
                border: '1px solid',
                borderColor: isActive ? 'var(--gold)' : 'var(--glass-border)',
                borderRadius: 20,
                padding: '7px 14px',
                fontSize: 13,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {FREQ_LABELS[freq]}
              {counts.total > 0 && (
                <span
                  style={{
                    background: allDone ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {counts.done}/{counts.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div style={{ padding: '16px 20px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-dim)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-dim)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Nenhuma tarefa nesta frequência.
          </div>
        ) : (
          filtered.map((task) => (
            <TaskCard key={task.id} task={task} onDone={handleDone} />
          ))
        )}
      </div>
      </main>
    </div>
  );
}
