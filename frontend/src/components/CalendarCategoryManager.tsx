import { useEffect, useRef, useState } from 'react';
import { apiJson } from '../api';
import type { CalendarCategory } from '../types';

interface Props {
  onClose: () => void;
}

type EditingId = string | null;

const COLOR_SWATCHES = ['#C99A3B', '#2E6FA3', '#C9613D', '#8B6F9E', '#C9718A', '#5B6EAE', '#6B7280', '#B5654A'];

export default function CalendarCategoryManager({ onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CalendarCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<EditingId>(null);
  const [deletingId, setDeletingId] = useState<EditingId>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await apiJson<CalendarCategory[]>('/calendar-categories');
      setCategories(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    setEditSubmitting(true);
    try {
      const updated = await apiJson<CalendarCategory>(`/calendar-categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName.trim(), color: editColor, icon: editIcon }),
      });
      setCategories(categories.map(c => c.id === id ? updated : c));
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleAddNew() {
    if (!editName.trim()) return;
    setEditSubmitting(true);
    try {
      const created = await apiJson<CalendarCategory>('/calendar-categories', {
        method: 'POST',
        body: JSON.stringify({ name: editName.trim(), color: editColor, icon: editIcon }),
      });
      setCategories([...categories, created]);
      setIsAdding(false);
      setEditName('');
      setEditColor(COLOR_SWATCHES[0]);
      setEditIcon('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    setDeleteError(null);
    try {
      await apiJson(`/calendar-categories/${id}`, { method: 'DELETE' });
      setCategories(categories.filter(c => c.id !== id));
      setDeletingId(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Erro ao deletar';
      if (errMsg.includes('em uso')) {
        const match = errMsg.match(/count[":]\s*(\d+)/i);
        const count = match ? parseInt(match[1]) : 1;
        setDeleteError(`Essa categoria tem ${count} evento(s) — mova ou apague eles primeiro`);
      } else {
        setDeleteError(errMsg);
      }
    }
  }

  function startEdit(cat: CalendarCategory) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIcon(cat.icon);
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Categorias do calendário</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
            style={{ color: 'var(--ink-muted)', background: 'rgba(0,0,0,0.08)' }}
            onClick={onClose}
            aria-label="Fechar"
          >✕</button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'rgba(0,0,0,0.06)' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {categories.map(cat => (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 mb-3 outline-none text-sm"
                      style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', border: '1px solid var(--glass-border)' }}
                      placeholder="Nome"
                    />
                    <div className="mb-3">
                      <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--ink-muted)' }}>Cor</label>
                      <div className="flex gap-2 flex-wrap">
                        {COLOR_SWATCHES.map(c => (
                          <button
                            key={c}
                            type="button"
                            className="w-8 h-8 rounded-lg transition-all"
                            style={{
                              background: c,
                              border: editColor === c ? '2px solid var(--ink)' : '2px solid transparent',
                            }}
                            onClick={() => setEditColor(c)}
                            aria-label={`Cor ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                    <input
                      value={editIcon}
                      onChange={e => setEditIcon(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 outline-none text-sm"
                      style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', border: '1px solid var(--glass-border)' }}
                      placeholder="Ícone (ex: 🎂)"
                      maxLength={4}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={editSubmitting || !editName.trim()}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: 'var(--gold)', color: '#fff' }}
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: 'var(--glass-strong)', border: '1px solid var(--glass-border)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{cat.name}</p>
                      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{cat.color}</p>
                    </div>
                    <button
                      onClick={() => startEdit(cat)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'rgba(0,0,0,0.08)', color: 'var(--ink)' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingId(deletingId === cat.id ? null : cat.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'rgba(201, 97, 61, 0.1)', color: 'var(--coral)' }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
                {deletingId === cat.id && (
                  <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(201, 97, 61, 0.08)', border: '1px solid var(--coral-bg)' }}>
                    {deleteError ? (
                      <p className="text-xs mb-3" style={{ color: 'var(--coral)' }}>{deleteError}</p>
                    ) : (
                      <p className="text-xs mb-3" style={{ color: 'var(--ink-dim)' }}>Deletar "{cat.name}"?</p>
                    )}
                    {!deleteError && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold"
                          style={{ background: 'var(--coral)', color: '#fff' }}
                        >
                          Deletar
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="flex-1 py-2 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isAdding && !loading && (
          <button
            onClick={() => {
              setIsAdding(true);
              setEditName('');
              setEditColor(COLOR_SWATCHES[0]);
              setEditIcon('');
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
            style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)' }}
          >
            + Adicionar categoria
          </button>
        )}

        {isAdding && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Nova categoria</h3>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 mb-3 outline-none text-sm"
              style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', border: '1px solid var(--glass-border)' }}
              placeholder="Nome"
              autoFocus
            />
            <div className="mb-3">
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--ink-muted)' }}>Cor</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_SWATCHES.map(c => (
                  <button
                    key={c}
                    type="button"
                    className="w-8 h-8 rounded-lg transition-all"
                    style={{
                      background: c,
                      border: editColor === c ? '2px solid var(--ink)' : '2px solid transparent',
                    }}
                    onClick={() => setEditColor(c)}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
            <input
              value={editIcon}
              onChange={e => setEditIcon(e.target.value)}
              className="w-full rounded-lg px-3 py-2 mb-3 outline-none text-sm"
              style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', border: '1px solid var(--glass-border)' }}
              placeholder="Ícone (ex: 🎂)"
              maxLength={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAddNew()}
                disabled={editSubmitting || !editName.trim() || !editIcon.trim()}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
                style={{ background: 'var(--gold)', color: '#fff' }}
              >
                Adicionar
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 rounded-xl font-medium text-sm"
                style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {error && !isAdding && <p className="text-sm mt-4" style={{ color: 'var(--coral)' }}>{error}</p>}
      </div>
    </div>
  );
}
