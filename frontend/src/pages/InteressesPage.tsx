import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Interest {
  id: string;
  label: string;
  createdAt: string;
}

const API = import.meta.env.VITE_API_URL ?? 'https://api.clickcasal.com.br';

const SUGGESTIONS = [
  'Jazz', 'Cinema', 'Corrida', 'Sauna', 'Yoga', 'Teatro',
  'Exposições', 'Música ao vivo', 'Comédia', 'Dança',
  'Gastronomia', 'Mercados', 'Futebol', 'Basquete', 'Ciclismo',
  'Workshops', 'Literatura', 'Festivais', 'Cerveja artesanal', 'Vinho',
];

export default function InteressesPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/interests`, { credentials: 'include' });
      if (res.ok) setInterests(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterests(); }, []);

  const addInterest = async (label: string) => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/interests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setInterests(prev => [...prev, created]);
        setInput('');
      }
    } finally {
      setSaving(false);
    }
  };

  const removeInterest = async (id: string) => {
    try {
      await fetch(`${API}/api/interests/${id}`, { method: 'DELETE', credentials: 'include' });
      setInterests(prev => prev.filter(i => i.id !== id));
    } catch {}
  };

  const existingLabels = new Set(interests.map(i => i.label.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f0eae3)', paddingBottom: 48 }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px 20px 16px', marginBottom: 8, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/eventos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-dim)', fontSize: 14, padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Eventos
        </button>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
          Meus Interesses
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>
          O que você curte? Usamos isso pra filtrar eventos e filmes pra você.
        </p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Current interests */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Seus interesses</div>
          {loading ? (
            <div className="skeleton" style={{ height: 44, borderRadius: 12 }} />
          ) : interests.length === 0 ? (
            <div style={{ color: 'var(--ink-dim)', fontSize: 14 }}>Nenhum interesse adicionado ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {interests.map(i => (
                <div
                  key={i.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: '#fff', borderRadius: 20, padding: '6px 12px', fontSize: 14, fontWeight: 600 }}
                >
                  {i.label}
                  <button
                    onClick={() => removeInterest(i.id)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, marginLeft: 2 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add custom */}
        <div className="flat-panel" style={{ padding: 16, borderRadius: 16, marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 10, color: 'var(--ink)' }}>Adicionar interesse</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addInterest(input)}
              placeholder="Ex: Jazz, Cinema, Corrida..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--glass-border)', background: 'white', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
            />
            <button
              onClick={() => addInterest(input)}
              disabled={saving || !input.trim()}
              className="btn-primary"
              style={{ padding: '10px 18px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}
            >
              +
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Sugestões</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.filter(s => !existingLabels.has(s.toLowerCase())).map(s => (
              <button
                key={s}
                onClick={() => addInterest(s)}
                disabled={saving}
                style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--gold)', background: 'var(--gold-bg)', color: 'var(--ink)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
