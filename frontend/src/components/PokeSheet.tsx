import { useEffect, useRef, useState } from 'react';
import { apiJson } from '../api';

interface Props {
  onClose: () => void;
}

interface PokeMessage {
  id: string;
  text: string;
  emoji: string;
}

export default function PokeSheet({ onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<PokeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [customText, setCustomText] = useState('');
  const textLength = customText.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);

    fetchMessages();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function fetchMessages() {
    try {
      const data = await apiJson<PokeMessage[]>('/push/poke-messages');
      setMessages(data);
      setLoading(false);
    } catch (err) {
      setError('Não foi possível carregar as cutucadas');
      setLoading(false);
    }
  }

  async function handlePoke(messageId: string) {
    setSending(messageId);
    setSendError(null);
    try {
      await apiJson('/push/poke', {
        method: 'POST',
        body: JSON.stringify({ messageId }),
      });
      setSent(true);
      setTimeout(onClose, 1000);
    } catch (err) {
      if (err instanceof Error && err.message.includes('429')) {
        setSendError('Você tá sendo inconveniente. Tente novamente daqui 1h');
      } else {
        setSendError('Não foi possível enviar a cutucada');
      }
      setSending(null);
    }
  }

  async function handleCustomPoke() {
    const text = customText.trim();
    if (!text) return;

    setSending('custom');
    setSendError(null);
    try {
      await apiJson('/push/poke', {
        method: 'POST',
        body: JSON.stringify({ customText: text }),
      });
      setSent(true);
      setCustomText('');
      setTimeout(onClose, 1000);
    } catch (err) {
      if (err instanceof Error && err.message.includes('429')) {
        setSendError('Você tá sendo inconveniente. Tente novamente daqui 1h');
      } else {
        setSendError('Não foi possível enviar a cutucada');
      }
      setSending(null);
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
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Cutucar</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
            style={{ color: 'var(--ink-muted)', background: 'rgba(0,0,0,0.08)' }}
            onClick={onClose}
            aria-label="Fechar"
          >✕</button>
        </div>

        {loading && (
          <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>Carregando...</p>
        )}

        {error && (
          <p className="text-center text-sm" style={{ color: 'var(--coral)' }}>{error}</p>
        )}

        {sent && (
          <p className="text-center text-sm" style={{ color: 'var(--gold)' }}>Enviado! 💛</p>
        )}

        {!loading && !error && !sent && (
          <>
            {/* Grid de mensagens prontas */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => handlePoke(msg.id)}
                  disabled={sending !== null}
                  className="flat-panel rounded-2xl p-4 text-center transition-all active:scale-[0.97] disabled:opacity-50"
                  style={{ opacity: sending && sending !== msg.id ? 0.5 : 1 }}
                >
                  <div className="text-3xl mb-2">{msg.emoji}</div>
                  <p className="text-xs leading-snug" style={{ color: 'var(--ink)' }}>
                    {msg.text}
                  </p>
                </button>
              ))}
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-3 my-4">
              <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
              <span style={{ color: 'var(--ink-faint)', fontSize: '0.75rem' }}>ou escreva a sua</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
            </div>

            {/* Campo de texto livre */}
            <div className="space-y-2">
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                maxLength={140}
                disabled={sending !== null}
                className="w-full rounded-xl px-4 py-3 outline-none resize-none disabled:opacity-50"
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  color: 'var(--ink)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '14px',
                }}
                placeholder="Escreve algo pra ela/ele..."
                rows={3}
              />
              <div className="flex justify-between items-center">
                <div />
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: textLength > 120 ? 'var(--coral)' : 'var(--ink-faint)',
                  }}
                >
                  {textLength}/140
                </span>
              </div>
              <button
                onClick={handleCustomPoke}
                disabled={sending !== null || !customText.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
                style={{ background: 'var(--gold)', color: '#fff' }}
              >
                {sending === 'custom' ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </>
        )}

        {sendError && (
          <p className="text-xs text-center mt-4" style={{ color: 'var(--coral)' }}>{sendError}</p>
        )}
      </div>
    </div>
  );
}
