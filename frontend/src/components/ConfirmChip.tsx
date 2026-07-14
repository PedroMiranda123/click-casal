import { useState } from 'react';
import type { Category, PaymentMethod } from '../types';
import type { ParsedExpense } from '../lib/parser';
import { api } from '../api';
import { formatAmount, toHumanDecimal, toMinorUnits } from '../lib/format';

interface Props {
  parsed: ParsedExpense;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

type Status = 'idle' | 'submitting' | 'error';

export function ConfirmChip({ parsed, categories, paymentMethods, defaultPaymentMethodId, onConfirm, onDismiss }: Props) {
  const guessedCat = categories.find((c) => c.name === parsed.categoryName);

  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(parsed.type);
  const [amountInput, setAmountInput] = useState(toHumanDecimal(parsed.amount));
  const [currency, setCurrency] = useState(parsed.currency);
  const [categoryId, setCategoryId] = useState<string>(guessedCat?.id ?? '');
  const [paymentMethodId, setPaymentMethodId] = useState(defaultPaymentMethodId);
  const [description, setDescription] = useState(parsed.description);
  const [status, setStatus] = useState<Status>('idle');

  const expenseCategories = categories.filter(() => true); // all categories shown

  const canConfirm = type === 'INCOME' || !!categoryId;

  async function handleConfirm() {
    const amount = toMinorUnits(amountInput);
    if (amount <= 0) return;

    setStatus('submitting');
    try {
      const body = {
        type,
        originalAmount: amount,
        originalCurrency: currency,
        paymentMethodId,
        categoryId: type === 'EXPENSE' ? (categoryId || null) : null,
        occurredAt: new Date().toISOString(),
        description: description || null,
      };

      const res = await api('/transactions', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setStatus('error');
        return;
      }

      onConfirm();
    } catch {
      setStatus('error');
    }
  }

  const displayAmount = toMinorUnits(amountInput);

  return (
    <div
      className="glass-panel-strong rounded-2xl p-4 shadow-sm"
      role="region"
      aria-label="Confirmar transação"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')}
                className="text-xs rounded-lg px-2 py-1 border"
                style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-strong)', color: 'var(--ink)' }}
              >
                <option value="EXPENSE">Gasto</option>
                <option value="INCOME">Receita</option>
              </select>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="font-amount text-lg font-semibold w-28 rounded-lg px-2 py-1 border"
                style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-strong)', color: 'var(--ink)' }}
                aria-label="Valor"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'DKK' | 'BRL')}
                className="text-xs rounded-lg px-2 py-1 border"
                style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-strong)', color: 'var(--ink)' }}
              >
                <option value="DKK">DKK</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                className="font-amount text-2xl font-semibold"
                style={{ color: type === 'INCOME' ? 'var(--blue)' : 'var(--coral)' }}
              >
                {type === 'INCOME' ? '+' : '−'}
                {formatAmount(displayAmount, currency)}
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--ink-faint)' }}>
                {type === 'INCOME' ? 'receita' : 'gasto'}
              </span>
            </div>
          )}

          {parsed.description ? (
            editing ? (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full text-sm rounded-lg px-2 py-1 border"
                style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-strong)', color: 'var(--ink)' }}
                placeholder="Descrição"
                aria-label="Descrição"
              />
            ) : (
              <p className="text-sm mt-0.5" style={{ color: 'var(--ink-dim)' }}>{description}</p>
            )
          ) : null}
        </div>

        <button
          onClick={onDismiss}
          className="text-lg leading-none p-1 rounded-lg"
          style={{ color: 'var(--ink-faint)' }}
          aria-label="Descartar"
        >
          ×
        </button>
      </div>

      {/* Category + payment method */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {type === 'EXPENSE' && (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 text-xs rounded-xl px-3 py-2 font-medium border"
            style={{ borderColor: 'var(--glass-border)', background: 'var(--glass)', color: categoryId ? 'var(--ink)' : 'var(--ink-faint)' }}
            aria-label="Categoria"
          >
            <option value="">Categoria…</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <select
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
          className="flex-1 text-xs rounded-xl px-3 py-2 font-medium border"
          style={{ borderColor: 'var(--glass-border)', background: 'var(--glass)', color: 'var(--ink)' }}
          aria-label="Forma de pagamento"
        >
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.name}</option>
          ))}
        </select>
      </div>

      {/* EXPENSE with no category warning */}
      {type === 'EXPENSE' && !categoryId && (
        <p className="text-xs mb-2" style={{ color: 'var(--coral)' }}>
          Selecione uma categoria para continuar.
        </p>
      )}

      {status === 'error' && (
        <p className="text-xs mb-2" style={{ color: 'var(--coral)' }}>
          Erro ao salvar. Tente novamente.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || status === 'submitting'}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Salvando…' : 'Confirmar'}
        </button>
        <button
          onClick={() => setEditing((e) => !e)}
          className="btn-ghost px-4"
        >
          {editing ? 'Feito' : 'Editar'}
        </button>
      </div>
    </div>
  );
}
