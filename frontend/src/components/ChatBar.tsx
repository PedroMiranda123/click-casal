import { useRef, useState } from 'react';
import { parseExpenseText } from '../lib/parser';
import type { ParsedExpense } from '../lib/parser';

interface Props {
  onParsed: (parsed: ParsedExpense) => void;
}

export function ChatBar({ onParsed }: Props) {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [cameraTooltip, setCameraTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = parseExpenseText(text);
    if (!result.ok) {
      setParseError(result.error);
      return;
    }
    setParseError(null);
    setText('');
    onParsed(result.data);
  }

  function handleCameraClick() {
    setCameraTooltip(true);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setCameraTooltip(false), 2500);
  }

  return (
    <div className="glass-panel-strong border-t-0 rounded-t-3xl px-4 pt-3 pb-4 shadow-lg">
      {parseError && (
        <p className="text-xs mb-2 px-1" style={{ color: 'var(--coral)' }}>
          {parseError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Camera button */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={handleCameraClick}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--gold-bg)', color: 'var(--gold)' }}
            aria-label="Adicionar foto do recibo (em breve)"
          >
            <CameraIcon />
          </button>
          {cameraTooltip && (
            <div
              className="absolute bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-xl shadow-md"
              style={{ background: 'var(--glass-strong)', color: 'var(--ink-dim)', border: '1px solid var(--glass-border)' }}
              role="tooltip"
            >
              Em breve 📷
            </div>
          )}
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); setParseError(null); }}
          placeholder="Ex: Gastei 250 coroas no Rema, mercado"
          className="flex-1 h-10 rounded-xl px-4 text-sm outline-none border"
          style={{
            background: 'rgba(255,255,255,0.7)',
            borderColor: 'var(--glass-border)',
            color: 'var(--ink)',
          }}
          aria-label="Registrar transação"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'var(--gold)', color: '#fff' }}
          aria-label="Enviar"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
