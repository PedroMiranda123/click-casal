import { useEffect, useRef, useState } from 'react';
import { parseExpenseText } from '../lib/parser';
import type { ParsedExpense } from '../lib/parser';
import type { Category, PaymentMethod } from '../types';
import { ConfirmChip } from './ConfirmChip';

interface Props {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function AddExpenseSheet({ categories, paymentMethods, defaultPaymentMethodId, onConfirm, onClose }: Props) {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [pending, setPending] = useState<ParsedExpense | null>(null);
  const [cameraTooltip, setCameraTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus the input when the sheet opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = parseExpenseText(text);
    if (!result.ok) {
      setParseError(result.error);
      return;
    }
    setParseError(null);
    setPending(result.data);
  }

  function handleConfirm() {
    onConfirm(); // triggers refetch in parent
    onClose();
  }

  function handleCameraClick() {
    setCameraTooltip(true);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setCameraTooltip(false), 2500);
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-40 flex flex-col justify-end"
      style={{ background: 'rgba(27,42,56,0.25)', backdropFilter: 'blur(2px)' }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Adicionar transação"
    >
      {/* Sheet */}
      <div
        className="glass-panel-strong rounded-t-3xl px-4 pt-5 pb-8 w-full max-w-lg mx-auto space-y-3"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
            Registrar transação
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

        {/* Confirm chip or input form */}
        {pending ? (
          <ConfirmChip
            parsed={pending}
            categories={categories}
            paymentMethods={paymentMethods}
            defaultPaymentMethodId={defaultPaymentMethodId}
            onConfirm={handleConfirm}
            onDismiss={() => { setPending(null); setText(''); }}
          />
        ) : (
          <>
            {parseError && (
              <p className="text-xs px-1" style={{ color: 'var(--coral)' }}>
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

              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => { setText(e.target.value); setParseError(null); }}
                placeholder="Ex: Gastei 250 coroas no Rema, mercado"
                className="flex-1 h-10 rounded-xl px-4 outline-none border"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  borderColor: 'var(--glass-border)',
                  color: 'var(--ink)',
                  fontSize: 16,
                }}
                aria-label="Registrar transação"
              />

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
          </>
        )}
      </div>
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
