import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../api';
import AddWorkoutSheet from '../components/AddWorkoutSheet';
import type { FitnessStats, WorkoutLog } from '../types';

export default function FitnessPage() {
  const [stats, setStats] = useState<FitnessStats | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, logsData] = await Promise.all([
        apiJson<FitnessStats>('/fitness/stats'),
        apiJson<WorkoutLog[]>('/fitness/logs'),
      ]);
      setStats(statsData);
      setLogs(logsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/fitness/logs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      setDeletingId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <Link
          to="/"
          className="text-sm font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all active:scale-95"
          style={{ color: 'var(--ink-dim)', background: 'rgba(27,42,56,0.07)' }}
        >← Início</Link>
        <h1 className="flex-1 text-xl font-semibold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--ink)' }}>
          Fitness
        </h1>
      </header>
      <main className="flex-1 pb-24">

      {error && (
        <p className="px-5 text-sm py-3" style={{ color: 'var(--coral)', background: 'var(--coral-bg)' }}>
          {error}
        </p>
      )}

      {loading || !stats ? (
        <div className="px-5 space-y-3 pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Streaks */}
          <div className="px-5 mt-4">
            <h2 className="text-xs font-semibold mb-2.5" style={{ color: 'var(--ink-muted)' }}>
              SEQUÊNCIAS
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel-strong rounded-2xl p-4">
                <p className="text-xs mb-1" style={{ color: 'var(--ink-dim)' }}>Pedro</p>
                <p className="text-2xl font-semibold" style={{ color: 'var(--blue)' }}>
                  {stats.streaks.pedro.current}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>
                  dias • melhor: {stats.streaks.pedro.best}
                </p>
              </div>
              <div className="glass-panel-strong rounded-2xl p-4">
                <p className="text-xs mb-1" style={{ color: 'var(--ink-dim)' }}>Ana</p>
                <p className="text-2xl font-semibold" style={{ color: 'var(--plum)' }}>
                  {stats.streaks.ana.current}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>
                  dias • melhor: {stats.streaks.ana.best}
                </p>
              </div>
            </div>
          </div>

          {/* Current week */}
          <div className="px-5 mt-6">
            <h2 className="text-xs font-semibold mb-2.5" style={{ color: 'var(--ink-muted)' }}>
              ESTA SEMANA
            </h2>
            <div className="glass-panel-strong rounded-2xl p-4">
              <div className="flex items-end justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: 'var(--ink-dim)' }}>Pedro</p>
                  <p className="text-3xl font-semibold" style={{ color: 'var(--blue)' }}>
                    {stats.currentWeek.countPedro}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium" style={{ color: 'var(--ink-faint)' }}>
                    {stats.currentWeek.countPedro > stats.currentWeek.countAna ? '🏆 Pedro' : stats.currentWeek.countAna > stats.currentWeek.countPedro ? '🏆 Ana' : '⚖️ Empatado'}
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs mb-1" style={{ color: 'var(--ink-dim)' }}>Ana</p>
                  <p className="text-3xl font-semibold" style={{ color: 'var(--plum)' }}>
                    {stats.currentWeek.countAna}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly wins */}
          <div className="px-5 mt-6">
            <h2 className="text-xs font-semibold mb-2.5" style={{ color: 'var(--ink-muted)' }}>
              SEMANAS GANHAS
            </h2>
            <div className="glass-panel-strong rounded-2xl p-4 flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>Pedro</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--blue)' }}>{stats.weeklyWins.pedro}</p>
              </div>
              <div style={{ width: '1px', height: '2rem', background: 'rgba(0,0,0,0.1)' }} />
              <div className="text-center flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--plum)' }}>Ana</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--plum)' }}>{stats.weeklyWins.ana}</p>
              </div>
            </div>
          </div>

          {/* Recent workouts */}
          <div className="px-5 mt-6">
            <h2 className="text-xs font-semibold mb-2.5" style={{ color: 'var(--ink-muted)' }}>
              ÚLTIMOS TREINOS
            </h2>
            {logs.length === 0 ? (
              <p className="text-sm py-4" style={{ color: 'var(--ink-muted)' }}>Nenhum treino registrado.</p>
            ) : (
              <div className="space-y-2">
                {logs.map(log => {
                  const isDeleting = deletingId === log.id;
                  const workoutEmoji: Record<string, string> = {
                    MUSCULACAO: '💪', CORRIDA: '🏃', NATACAO: '🏊', YOGA: '🧘',
                    CAMINHADA: '🚶', FUTEBOL: '⚽', BASQUETE: '🏀', OUTRO: '🏋️'
                  };
                  return (
                    <div
                      key={log.id}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-border)' }}
                    >
                      <div className="p-4 flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{workoutEmoji[log.type] || '🏃'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                            {log.person.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-dim)' }}>
                            {log.type.charAt(0) + log.type.slice(1).toLowerCase().replace('_', ' ')}
                            {log.durationMinutes && ` • ${log.durationMinutes} min`}
                            {log.intensity && ` • ${log.intensity.toLowerCase()}`}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>
                            {new Date(log.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => setDeletingId(isDeleting ? null : log.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
                          style={{ color: isDeleting ? 'var(--coral)' : 'var(--ink-faint)', background: isDeleting ? 'var(--coral-bg)' : 'transparent' }}
                          aria-label="Excluir"
                        >
                          ✕
                        </button>
                      </div>
                      {isDeleting && (
                        <div className="px-4 pb-3 flex items-center gap-2 border-t" style={{ borderColor: 'rgba(27,42,56,0.08)' }}>
                          <p className="text-xs flex-1" style={{ color: 'var(--ink-dim)' }}>Excluir treino?</p>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="text-xs font-semibold px-3 py-1 rounded-lg transition-opacity"
                            style={{ background: 'var(--coral)', color: '#fff' }}
                          >
                            Excluir
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
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
        </>
      )}

      {/* Gold FAB */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-2xl flex items-center justify-center"
        style={{ background: 'var(--gold)', boxShadow: '0 4px 20px rgba(201,154,59,0.45)', color: '#fff' }}
        onClick={() => setSheetOpen(true)}
        aria-label="Adicionar treino"
      >
        +
      </button>

      {sheetOpen && (
        <AddWorkoutSheet
          onCreated={() => { loadData(); setSheetOpen(false); }}
          onClose={() => setSheetOpen(false)}
        />
      )}
      </main>
    </div>
  );
}
