import { useState } from 'react';
import { api } from '../api';
import type { WorkoutType, WorkoutIntensity } from '../types';

interface Props {
  onCreated: () => void;
  onClose: () => void;
}

const WORKOUT_TYPES: { value: WorkoutType; label: string; emoji: string }[] = [
  { value: 'MUSCULACAO', label: 'Musculação', emoji: '💪' },
  { value: 'CORRIDA', label: 'Corrida', emoji: '🏃' },
  { value: 'NATACAO', label: 'Natação', emoji: '🏊' },
  { value: 'YOGA', label: 'Yoga', emoji: '🧘' },
  { value: 'CAMINHADA', label: 'Caminhada', emoji: '🚶' },
  { value: 'FUTEBOL', label: 'Futebol', emoji: '⚽' },
  { value: 'BASQUETE', label: 'Basquete', emoji: '🏀' },
  { value: 'OUTRO', label: 'Outro', emoji: '🏋️' },
];

const INTENSITIES: WorkoutIntensity[] = ['LEVE', 'MODERADO', 'INTENSO'];

export default function AddWorkoutSheet({ onCreated, onClose }: Props) {
  const [type, setType] = useState<WorkoutType>('CORRIDA');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<WorkoutIntensity | ''>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!type) {
      setError('Selecione um tipo de treino');
      return;
    }

    try {
      setPending(true);
      // Parse date string (YYYY-MM-DD) and create UTC midnight timestamp
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

      const res = await api('/fitness/logs', {
        method: 'POST',
        body: JSON.stringify({
          type,
          durationMinutes: duration ? parseInt(duration, 10) : null,
          intensity: intensity || null,
          note: note || null,
          date: dateObj.toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao criar treino');
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col justify-end"
      style={{ background: 'rgba(27,42,56,0.25)', backdropFilter: 'blur(2px)' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Adicionar treino"
    >
      <div
        className="glass-panel-strong rounded-t-3xl px-4 pt-5 pb-8 w-full max-w-lg mx-auto space-y-3"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
            Registrar treino
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-lg leading-none transition-colors"
            style={{ color: 'var(--ink-faint)' }}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="text-xs px-1" style={{ color: 'var(--coral)' }}>
            {error}
          </p>
        )}

        {/* Type selector */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink-dim)' }}>Tipo</p>
          <div className="grid grid-cols-4 gap-2">
            {WORKOUT_TYPES.map(wt => (
              <button
                key={wt.value}
                onClick={() => setType(wt.value)}
                className="rounded-lg p-2 text-center transition-all"
                style={{
                  background: type === wt.value ? 'var(--gold)' : 'rgba(0,0,0,0.06)',
                  color: type === wt.value ? '#fff' : 'var(--ink-dim)',
                }}
              >
                <div className="text-lg mb-1">{wt.emoji}</div>
                <p className="text-xs font-medium line-clamp-1">{wt.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-medium" style={{ color: 'var(--ink-dim)' }}>
            Duração (minutos)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
            className="w-full h-10 rounded-xl px-4 outline-none border mt-1"
            style={{
              background: 'rgba(255,255,255,0.7)',
              borderColor: 'var(--glass-border)',
              color: 'var(--ink)',
              fontSize: 16,
            }}
          />
        </div>

        {/* Intensity */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink-dim)' }}>Intensidade</p>
          <div className="flex gap-2">
            {INTENSITIES.map(int => (
              <button
                key={int}
                onClick={() => setIntensity(intensity === int ? '' : int)}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: intensity === int ? 'var(--blue)' : 'rgba(0,0,0,0.06)',
                  color: intensity === int ? '#fff' : 'var(--ink-dim)',
                }}
              >
                {int.charAt(0) + int.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium" style={{ color: 'var(--ink-dim)' }}>
            Notas (opcional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="Ex: com amigos"
            className="w-full h-10 rounded-xl px-4 outline-none border mt-1"
            style={{
              background: 'rgba(255,255,255,0.7)',
              borderColor: 'var(--glass-border)',
              color: 'var(--ink)',
              fontSize: 16,
            }}
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-medium" style={{ color: 'var(--ink-dim)' }}>
            Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-10 rounded-xl px-4 outline-none border mt-1"
            style={{
              background: 'rgba(255,255,255,0.7)',
              borderColor: 'var(--glass-border)',
              color: 'var(--ink)',
              fontSize: 16,
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={pending || !type}
          className="w-full h-10 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#fff' }}
        >
          {pending ? 'Salvando...' : 'Registrar'}
        </button>
      </div>
    </div>
  );
}
