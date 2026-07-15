import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiJson } from '../api';
import AddEventSheet from '../components/AddEventSheet';
import type { CalendarEvent, CalendarCategory, UserSummary } from '../types';

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAY_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month, 1, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<CalendarCategory[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(isoDateKey(today));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmingEventId, setConfirmingEventId] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = monthRange(year, month);
      const data = await apiJson<CalendarEvent[]>(`/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setEvents(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    apiJson<UserSummary[]>('/users').then(setUsers).catch(() => {});
    apiJson<CalendarCategory[]>('/calendar-categories').then(setCategories).catch(() => {});
  }, []);

  async function handleDeleteEvent(id: string) {
    setDeletingEvent(true);
    try {
      const res = await api(`/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir evento');
      setConfirmingEventId(null);
      await loadEvents();
    } finally {
      setDeletingEvent(false);
    }
  }

  // Group events by date key
  const byDate = events.reduce<Record<string, CalendarEvent[]>>((acc, evt) => {
    const key = isoDateKey(new Date(evt.startAt));
    (acc[key] ??= []).push(evt);
    return acc;
  }, {});

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const selectedEvents = selectedDate ? (byDate[selectedDate] ?? []) : [];
  const todayKey = isoDateKey(today);

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
        <h1 className="text-xl font-semibold flex-1" style={{ color: 'var(--ink)' }}>Calendário</h1>
      </div>

      {/* Month navigator */}
      <div className="px-5 flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ color: 'var(--ink)', background: 'rgba(0,0,0,0.06)' }}
          aria-label="Mês anterior"
        >‹</button>
        <span className="font-semibold text-base" style={{ color: 'var(--ink)' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ color: 'var(--ink)', background: 'rgba(0,0,0,0.06)' }}
          aria-label="Próximo mês"
        >›</button>
      </div>

      {/* Calendar grid */}
      <div className="px-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_SHORT.map(d => (
            <div key={d} className="text-center text-xs py-1" style={{ color: 'var(--ink-muted)' }}>{d}</div>
          ))}
        </div>

        {error && (
          <p className="text-center text-sm py-4" style={{ color: 'var(--coral)' }}>{error}</p>
        )}

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = byDate[key] ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className="flex flex-col items-center rounded-xl py-1.5 transition-all"
                style={{
                  background: isSelected
                    ? 'var(--gold)'
                    : isToday
                    ? 'rgba(201,154,59,0.15)'
                    : 'transparent',
                  minHeight: '3.5rem',
                }}
              >
                <span
                  className="text-sm font-medium mb-1"
                  style={{ color: isSelected ? '#fff' : isToday ? 'var(--gold)' : 'var(--ink)' }}
                >
                  {day}
                </span>
                <div className="flex gap-0.5 flex-wrap justify-center max-w-[2rem]">
                  {dayEvents.slice(0, 3).map((evt, ei) => (
                    <span
                      key={ei}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : evt.category.color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Day detail list */}
      {selectedDate && (
        <div className="px-5 mt-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink-muted)' }}>
            {(() => {
              const [, m, d] = selectedDate.split('-').map(Number);
              return `${d} de ${MONTH_NAMES[m - 1]}`;
            })()}
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
              ))}
            </div>
          ) : selectedEvents.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Nenhum evento neste dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((evt, i) => {
                const isConfirming = confirmingEventId === evt.id;
                return (
                  <div
                    key={`${evt.id}-${i}`}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-border)' }}
                  >
                    <div className="p-4 flex items-start gap-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ background: evt.category.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{evt.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{evt.category.icon} {evt.category.name}</span>
                          {!evt.allDay && (
                            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                              {new Date(evt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {evt.person ? (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--blue)', color: '#fff', fontSize: '0.65rem' }}>
                              {evt.person.name.split(' ')[0]}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.08)', color: 'var(--ink-muted)', fontSize: '0.65rem' }}>
                              Ambos
                            </span>
                          )}
                        </div>
                        {evt.description && (
                          <p className="text-xs mt-1 truncate" style={{ color: 'var(--ink-muted)' }}>{evt.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmingEventId(isConfirming ? null : evt.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
                        style={{ color: isConfirming ? 'var(--coral)' : 'var(--ink-faint)', background: isConfirming ? 'var(--coral-bg)' : 'transparent' }}
                        aria-label="Excluir evento"
                      >
                        <EventTrashIcon />
                      </button>
                    </div>
                    {isConfirming && (
                      <div className="px-4 pb-3 flex items-center gap-2 border-t" style={{ borderColor: 'rgba(27,42,56,0.08)' }}>
                        <p className="text-xs flex-1" style={{ color: 'var(--ink-dim)' }}>Excluir evento?</p>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          disabled={deletingEvent}
                          className="text-xs font-semibold px-3 py-1 rounded-lg transition-opacity disabled:opacity-50"
                          style={{ background: 'var(--coral)', color: '#fff' }}
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => setConfirmingEventId(null)}
                          className="text-xs font-medium px-3 py-1 rounded-lg"
                          style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gold FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-2xl flex items-center justify-center"
        style={{ background: 'var(--gold)', boxShadow: '0 4px 20px rgba(201,154,59,0.45)', color: '#fff' }}
        onClick={() => setSheetOpen(true)}
        aria-label="Adicionar evento"
      >
        +
      </button>

      {sheetOpen && (
        <AddEventSheet
          users={users}
          onCreated={() => { loadEvents(); setSheetOpen(false); }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

function EventTrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
