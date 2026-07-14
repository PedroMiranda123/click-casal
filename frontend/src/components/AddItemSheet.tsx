import { useEffect, useRef, useState } from 'react';

interface Props {
  onAdd: (name: string) => Promise<void>;
  onClose: () => void;
}

export default function AddItemSheet({ onAdd, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(name);
      onClose();
    } catch {
      setError('Não foi possível adicionar o item.');
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
        className="w-full rounded-t-2xl p-6 pb-10"
        style={{ background: 'var(--glass-strong)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Adicionar item</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
            style={{ color: 'var(--ink-muted)', background: 'rgba(0,0,0,0.08)' }}
            onClick={onClose}
            aria-label="Fechar"
          >✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full rounded-xl px-4 py-3 outline-none"
            style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', border: '1px solid var(--glass-border)', fontSize: 16 }}
            placeholder="Ex: leite, ovos, peito de frango"
            autoComplete="off"
          />
          {error && <p className="text-sm" style={{ color: 'var(--coral)' }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting || !value.trim()}
            className="w-full py-4 rounded-2xl font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            {submitting ? 'Adicionando…' : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  );
}
