import { useEffect, useRef, useState } from 'react';
import { apiJson } from '../api';
import type { CalendarEvent, EventInput, EventType, RecurrenceType, UserSummary } from '../types';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  BIRTHDAY: '🎂 Aniversário',
  PAYMENT_DUE: '💳 Vencimento',
  SPORTS: '⚽ Esporte',
  EXERCISE: '🏋️ Exercício',
  GENERAL: '📌 Geral',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  BIRTHDAY: '#E879A0',
  PAYMENT_DUE: '#F59E0B',
  SPORTS: '#3B82F6',
  EXERCISE: '#8B5CF6',
  GENERAL: '#6B7280',
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Props {
  users: UserSummary[];
  onCreated: (event: CalendarEvent) => void;
  onClose: () => void;
}

export default function AddEventSheet({ users, onCreated, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('GENERAL');
  const [personId, setPersonId] = useState<string | null>(null);
  const [startAt, setStartAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('NONE');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function toggleDay(day: number) {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const dateStr = allDay ? `${startAt}T00:00:00.000Z` : `${startAt}T${startTime}:00.000Z`;

    const body: EventInput = {
      title: title.trim(),
      type,
      personId,
      startAt: dateStr,
      allDay,
      recurrence,
      recurrenceDays: recurrence === 'WEEKLY' ? recurrenceDays : [],
      description: description.trim() || null,
    };

    setSubmitting(true);
    setError(null);
    try {
      const created = await apiJson<CalendarEvent>('/events', { method: 'POST', body: JSON.stringify(body) });
      onCreated(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar evento');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onPointerDown={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="w-full rounded-t-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--glass-strong)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Novo evento</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
            style={{ color: 'var(--ink-muted)', background: 'rgba(0,0,0,0.08)' }}
            onClick={onClose}
            aria-label="Fechar"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-muted)' }}>Título</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl px-4 py-3 outline-none"
              style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', border: '1px solid var(--glass-border)', fontSize: 16 }}
              placeholder="Nome do evento"
              required
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ink-muted)' }}>Tipo</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: type === t ? EVENT_TYPE_COLORS[t] : 'rgba(0,0,0,0.06)',
                    color: type === t ? '#fff' : 'var(--ink)',
                    border: type === t ? `2px solid ${EVENT_TYPE_COLORS[t]}` : '2px solid transparent',
                  }}
                  onClick={() => setType(t)}
                >
                  {EVENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Person */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ink-muted)' }}>Para quem</label>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: personId === null ? 'var(--blue)' : 'rgba(0,0,0,0.06)',
                  color: personId === null ? '#fff' : 'var(--ink)',
                }}
                onClick={() => setPersonId(null)}
              >Ambos</button>
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: personId === u.id ? 'var(--blue)' : 'rgba(0,0,0,0.06)',
                    color: personId === u.id ? '#fff' : 'var(--ink)',
                  }}
                  onClick={() => setPersonId(u.id)}
                >
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-muted)' }}>Data</label>
              <input
                type="date"
                value={startAt}
                onChange={e => setStartAt(e.target.value)}
                className="w-full rounded-xl px-3 py-3 outline-none"
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  color: 'var(--ink)',
                  border: '1px solid var(--glass-border)',
                  fontSize: 16,
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-muted)' }}>
                <span
                  className="cursor-pointer select-none"
                  onClick={() => setAllDay(v => !v)}
                  style={{ color: allDay ? 'var(--gold)' : 'var(--ink-muted)' }}
                >
                  {allDay ? 'Dia inteiro ✓' : 'Horário'}
                </span>
              </label>
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-xl px-3 py-3 outline-none"
                  style={{
                    background: 'rgba(0,0,0,0.06)',
                    color: 'var(--ink)',
                    border: '1px solid var(--glass-border)',
                    fontSize: 16,
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                />
              )}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ink-muted)' }}>Repetição</label>
            <div className="flex gap-2 mb-2">
              {(['NONE', 'YEARLY', 'WEEKLY'] as RecurrenceType[]).map(r => (
                <button
                  key={r}
                  type="button"
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: recurrence === r ? 'var(--ink)' : 'rgba(0,0,0,0.06)',
                    color: recurrence === r ? 'var(--bg)' : 'var(--ink)',
                  }}
                  onClick={() => { setRecurrence(r); if (r !== 'WEEKLY') setRecurrenceDays([]); }}
                >
                  {{ NONE: 'Nunca', YEARLY: 'Anual', WEEKLY: 'Semanal' }[r]}
                </button>
              ))}
            </div>
            {recurrence === 'WEEKLY' && (
              <div className="flex gap-1 flex-wrap">
                {WEEKDAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    className="w-9 h-9 rounded-full text-xs font-medium"
                    style={{
                      background: recurrenceDays.includes(day) ? 'var(--gold)' : 'rgba(0,0,0,0.06)',
                      color: recurrenceDays.includes(day) ? '#fff' : 'var(--ink)',
                    }}
                    onClick={() => toggleDay(day)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-muted)' }}>Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl px-4 py-3 outline-none resize-none"
              style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', border: '1px solid var(--glass-border)', fontSize: 16 }}
              placeholder="Detalhes…"
            />
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--coral)' }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting || !title.trim() || (recurrence === 'WEEKLY' && recurrenceDays.length === 0)}
            className="w-full py-4 rounded-2xl font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            {submitting ? 'Salvando…' : 'Salvar evento'}
          </button>
        </form>
      </div>
    </div>
  );
}
