import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiJson } from '../api';
import type { Balance, Category, DailyPoint, PaymentMethod, Summary, Transaction, TransactionList } from '../types';
import { BalanceCard } from '../components/BalanceCard';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { TimelineChart } from '../components/TimelineChart';
import { RecentTransactions } from '../components/RecentTransactions';
import { AddExpenseSheet } from '../components/AddExpenseSheet';
import { SettingsMenu } from '../components/SettingsMenu';

type LoadState = 'loading' | 'ok' | 'error';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function DashboardPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [balanceState, setBalanceState] = useState<LoadState>('loading');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryState, setSummaryState] = useState<LoadState>('loading');

  const [txList, setTxList] = useState<Transaction[]>([]);
  const [txState, setTxState] = useState<LoadState>('loading');

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [sheetOpen, setSheetOpen] = useState(false);

  const loadBalance = useCallback(async () => {
    setBalanceState('loading');
    try {
      setBalance(await apiJson<Balance>('/balance'));
      setBalanceState('ok');
    } catch {
      setBalanceState('error');
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryState('loading');
    try {
      setSummary(await apiJson<Summary>(`/transactions/summary?month=${currentMonth()}`));
      setSummaryState('ok');
    } catch {
      setSummaryState('error');
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxState('loading');
    try {
      setTxList((await apiJson<TransactionList>('/transactions?limit=10')).data);
      setTxState('ok');
    } catch {
      setTxState('error');
    }
  }, []);

  useEffect(() => {
    apiJson<Category[]>('/categories').then(setCategories).catch(() => {});
    apiJson<PaymentMethod[]>('/payment-methods').then(setPaymentMethods).catch(() => {});
  }, []);

  useEffect(() => { loadBalance(); }, [loadBalance]);
  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  function handleTransactionConfirmed() {
    loadBalance();
    loadSummary();
    loadTransactions();
  }

  async function handleTransactionDeleted(id: string) {
    const res = await api(`/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir lançamento');
    loadBalance();
    loadSummary();
    loadTransactions();
  }

  const timeline: DailyPoint[] = summary?.dailyTimeline ?? [];
  const defaultPaymentMethodId =
    paymentMethods.find((pm) => pm.type === 'DEBIT')?.id ?? paymentMethods[0]?.id ?? '';

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--ink-dim)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Início
          </Link>
          <span style={{ color: 'var(--ink-faint)', fontSize: '0.75rem' }}>·</span>
          <h1 className="font-display text-lg font-semibold leading-none" style={{ color: 'var(--ink)' }}>
            Finanças
          </h1>
        </div>
        <SettingsMenu />
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24 space-y-3">
        <BalanceCard
          balanceDkk={balance?.balanceDkk ?? null}
          timeline={timeline}
          loading={balanceState === 'loading'}
          error={balanceState === 'error'}
          onRetry={loadBalance}
        />
        <CategoryBreakdown
          breakdown={summary?.categoryBreakdown ?? []}
          loading={summaryState === 'loading'}
          error={summaryState === 'error'}
          onRetry={loadSummary}
        />
        <TimelineChart
          timeline={timeline}
          loading={summaryState === 'loading'}
          error={summaryState === 'error'}
          onRetry={loadSummary}
        />
        <RecentTransactions
          transactions={txList}
          categories={categories}
          paymentMethods={paymentMethods}
          loading={txState === 'loading'}
          error={txState === 'error'}
          onRetry={loadTransactions}
          onDelete={handleTransactionDeleted}
        />
      </main>

      {/* Floating action button */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-light transition-all active:scale-95 hover:brightness-110 z-30"
        style={{
          background: 'var(--gold)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(201,154,59,0.45)',
        }}
        aria-label="Adicionar transação"
      >
        +
      </button>

      {sheetOpen && (
        <AddExpenseSheet
          categories={categories}
          paymentMethods={paymentMethods}
          defaultPaymentMethodId={defaultPaymentMethodId}
          onConfirm={handleTransactionConfirmed}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
