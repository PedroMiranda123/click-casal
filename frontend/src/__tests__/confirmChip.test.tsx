import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConfirmChip } from '../components/ConfirmChip';
import type { Category, PaymentMethod } from '../types';
import type { ParsedExpense } from '../lib/parser';

const mockCategories: Category[] = [
  { id: 'cat-super', name: 'Supermercado', icon: 'shopping-cart', color: '#4CAF50', isDefault: true },
  { id: 'cat-trans', name: 'Transporte', icon: 'car', color: '#2196F3', isDefault: true },
];

const mockPaymentMethods: PaymentMethod[] = [
  { id: 'pm-lunar', name: 'Lunar', type: 'DEBIT', isActive: true },
  { id: 'pm-nubank', name: 'Nubank Cartão', type: 'CREDIT', isActive: true },
];

const expenseParsed: ParsedExpense = {
  amount: 25000,
  currency: 'DKK',
  type: 'EXPENSE',
  categoryName: 'Supermercado',
  description: 'Rema',
};

const incomeParsed: ParsedExpense = {
  amount: 300000,
  currency: 'BRL',
  type: 'INCOME',
  categoryName: null,
  description: 'salário',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ConfirmChip', () => {
  it('fires POST /transactions with correct expense payload on Confirmar', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'tx-new' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const onConfirm = vi.fn();

    render(
      <ConfirmChip
        parsed={expenseParsed}
        categories={mockCategories}
        paymentMethods={mockPaymentMethods}
        defaultPaymentMethodId="pm-lunar"
        onConfirm={onConfirm}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/transactions$/);
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string);
    expect(body.type).toBe('EXPENSE');
    expect(body.originalAmount).toBe(25000);
    expect(body.originalCurrency).toBe('DKK');
    expect(body.paymentMethodId).toBe('pm-lunar');
    expect(body.categoryId).toBe('cat-super');
    expect(body.occurredAt).toBeTruthy(); // ISO date

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('fires POST /transactions with correct income payload (no categoryId)', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'tx-income' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <ConfirmChip
        parsed={incomeParsed}
        categories={mockCategories}
        paymentMethods={mockPaymentMethods}
        defaultPaymentMethodId="pm-lunar"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.type).toBe('INCOME');
    expect(body.originalAmount).toBe(300000);
    expect(body.originalCurrency).toBe('BRL');
    expect(body.categoryId).toBeNull();
  });

  it('disables Confirmar when EXPENSE has no category selected', async () => {
    const noCategoryParsed: ParsedExpense = { ...expenseParsed, categoryName: null };

    render(
      <ConfirmChip
        parsed={noCategoryParsed}
        categories={mockCategories}
        paymentMethods={mockPaymentMethods}
        defaultPaymentMethodId="pm-lunar"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    // Category select should default to empty; button should be disabled
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('calls onDismiss when × button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <ConfirmChip
        parsed={expenseParsed}
        categories={mockCategories}
        paymentMethods={mockPaymentMethods}
        defaultPaymentMethodId="pm-lunar"
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole('button', { name: /descartar/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('shows error message on failed POST', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Exchange rate unavailable' }),
    }));

    render(
      <ConfirmChip
        parsed={expenseParsed}
        categories={mockCategories}
        paymentMethods={mockPaymentMethods}
        defaultPaymentMethodId="pm-lunar"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(screen.getByText(/erro ao salvar/i)).toBeInTheDocument();
    });
  });
});
