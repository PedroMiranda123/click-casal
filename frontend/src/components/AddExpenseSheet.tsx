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
  const [mode, setMode] = useState<'text' | 'form'>('text');
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [pending, setPending] = useState<ParsedExpense | null>(null);
  const [cameraTooltip, setCameraTooltip] = useState(false);

  // Form mode states
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState<'DKK' | 'BRL'>('DKK');
  const [formDescription, setFormDescription] = useState('');
  const [descMode, setDescMode] = useState<'mercado' | 'metro' | 'bar' | 'outro' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  function handleModeChange(newMode: 'text' | 'form') {
    setMode(newMode);
    setParseError(null);
    setPending(null);
    setText('');
    setFormAmount('');
    setFormDescription('');
    setDescMode(null);
    setFormError(null);
  }

  function handleFormSubmit() {
    setFormError(null);

    const amount = parseFloat(formAmount);
    if (!formAmount.trim() || isNaN(amount) || amount <= 0) {
      setFormError('Digite um valor válido');
      return;
    }

    if (!descMode) {
      setFormError('Selecione uma categoria');
      return;
    }

    let description = '';
    let categoryName: string | null = null;

    if (descMode === 'mercado') {
      description = 'Mercado';
      categoryName = 'Supermercado';
    } else if (descMode === 'metro') {
      description = 'Metrô';
      categoryName = 'Transporte';
    } else if (descMode === 'bar') {
      description = 'Bar';
      categoryName = 'Lazer / Entretenimento';
    } else if (descMode === 'outro') {
      const trimmed = formDescription.trim();
      if (!trimmed) {
        setFormError('Digite uma descrição');
        return;
      }
      description = trimmed;
      categoryName = null;
    }

    const parsed: ParsedExpense = {
      amount: Math.round(amount * 100),
      currency: formCurrency,
      type: formType,
      categoryName,
      description,
    };

    setPending(parsed);
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

        {/* Mode toggle */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleModeChange('text')}
            style={{
              background: mode === 'text' ? 'var(--gold)' : 'rgba(0,0,0,0.06)',
              color: mode === 'text' ? '#fff' : 'var(--ink-dim)',
              border: 'none',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 13,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Descrever
          </button>
          <button
            onClick={() => handleModeChange('form')}
            style={{
              background: mode === 'form' ? 'var(--gold)' : 'rgba(0,0,0,0.06)',
              color: mode === 'form' ? '#fff' : 'var(--ink-dim)',
              border: 'none',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 13,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Formulário
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
            onDismiss={() => { setPending(null); setText(''); setFormAmount(''); setFormDescription(''); }}
          />
        ) : mode === 'text' ? (
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
        ) : (
          <>
            {formError && (
              <p className="text-xs px-1" style={{ color: 'var(--coral)' }}>
                {formError}
              </p>
            )}
            <div className="space-y-3">
              {/* Tipo */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFormType('EXPENSE')}
                  style={{
                    flex: 1,
                    background: formType === 'EXPENSE' ? 'var(--coral)' : 'rgba(0,0,0,0.06)',
                    color: formType === 'EXPENSE' ? '#fff' : 'var(--ink-dim)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '6px 16px',
                    fontSize: 13,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Gasto
                </button>
                <button
                  onClick={() => setFormType('INCOME')}
                  style={{
                    flex: 1,
                    background: formType === 'INCOME' ? 'var(--blue)' : 'rgba(0,0,0,0.06)',
                    color: formType === 'INCOME' ? '#fff' : 'var(--ink-dim)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '6px 16px',
                    fontSize: 13,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Receita
                </button>
              </div>

              {/* Valor + Moeda */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formAmount}
                  onChange={(e) => { setFormAmount(e.target.value); setFormError(null); }}
                  placeholder="0"
                  className="flex-1 h-10 rounded-xl px-4 outline-none border"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    borderColor: 'var(--glass-border)',
                    color: 'var(--ink)',
                    fontSize: 16,
                  }}
                />
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value as 'DKK' | 'BRL')}
                  className="rounded-xl px-3 py-2 outline-none border font-medium text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    borderColor: 'var(--glass-border)',
                    color: 'var(--ink)',
                  }}
                >
                  <option value="DKK">DKK</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>

              {/* Categoria — botões atalho */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setDescMode('mercado')}
                  style={{
                    flex: 1,
                    minWidth: '48%',
                    background: descMode === 'mercado' ? 'var(--gold)' : 'rgba(0,0,0,0.06)',
                    color: descMode === 'mercado' ? '#fff' : 'var(--ink-dim)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 13,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  🛒 Mercado
                </button>
                <button
                  onClick={() => setDescMode('metro')}
                  style={{
                    flex: 1,
                    minWidth: '48%',
                    background: descMode === 'metro' ? 'var(--gold)' : 'rgba(0,0,0,0.06)',
                    color: descMode === 'metro' ? '#fff' : 'var(--ink-dim)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 13,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  🚇 Metrô
                </button>
                <button
                  onClick={() => setDescMode('bar')}
                  style={{
                    flex: 1,
                    minWidth: '48%',
                    background: descMode === 'bar' ? 'var(--gold)' : 'rgba(0,0,0,0.06)',
                    color: descMode === 'bar' ? '#fff' : 'var(--ink-dim)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 13,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  🍺 Bar
                </button>
                <button
                  onClick={() => setDescMode('outro')}
                  style={{
                    flex: 1,
                    minWidth: '48%',
                    background: descMode === 'outro' ? 'var(--gold)' : 'rgba(0,0,0,0.06)',
                    color: descMode === 'outro' ? '#fff' : 'var(--ink-dim)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 13,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Outro
                </button>
              </div>

              {/* Descrição customizada — só se descMode === 'outro' */}
              {descMode === 'outro' && (
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => { setFormDescription(e.target.value); setFormError(null); }}
                  placeholder="Descreve..."
                  className="w-full h-10 rounded-xl px-4 outline-none border"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    borderColor: 'var(--glass-border)',
                    color: 'var(--ink)',
                    fontSize: 16,
                  }}
                />
              )}

              {/* Botão Continuar */}
              <button
                onClick={handleFormSubmit}
                className="w-full h-10 rounded-xl font-semibold text-sm transition-all active:scale-95"
                style={{ background: 'var(--gold)', color: '#fff' }}
              >
                Continuar
              </button>
            </div>
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
