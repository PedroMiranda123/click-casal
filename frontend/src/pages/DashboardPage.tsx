import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '../api';
import type { Balance, Category, DailyPoint, PaymentMethod, Summary, Transaction, TransactionList } from '../types';
import { BalanceCard } from '../components/BalanceCard';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { TimelineChart } from '../components/TimelineChart';
import { RecentTransactions } from '../components/RecentTransactions';
import { ChatBar } from '../components/ChatBar';
import { ConfirmChip } from '../components/ConfirmChip';
import { SettingsMenu } from '../components/SettingsMenu';
import type { ParsedExpense } from '../lib/parser';

type LoadState = 'loading' | 'ok' | 'error';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function DashboardPage() {
  // Balance
  const [balance, setBalance] = useState<Balance | null>(null);
  const [balanceState, setBalanceState] = useState<LoadState>('loading');

  // Summary (category breakdown + timeline)
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryState, setSummaryState] = useState<LoadState>('loading');

  // Transactions
  const [txList, setTxList] = useState<Transaction[]>([]);
  const [txState, setTxState] = useState<LoadState>('loading');

  // Reference data (categories + payment methods) — fetched once
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Chat state
  const [pendingExpense, setPendingExpense] = useState<ParsedExpense | null>(null);

  const loadBalance = useCallback(async () => {
    setBalanceState('loading');
    try {
      const data = await apiJson<Balance>('/balance');
      setBalance(data);
      setBalanceState('ok');
    } catch {
      setBalanceState('error');
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryState('loading');
    try {
      const data = await apiJson<Summary>(`/transactions/summary?month=${currentMonth()}`);
      setSummary(data);
      setSummaryState('ok');
    } catch {
      setSummaryState('error');
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxState('loading');
    try {
      const data = await apiJson<TransactionList>('/transactions?limit=10');
      setTxList(data.data);
      setTxState('ok');
    } catch {
      setTxState('error');
    }
  }, []);

  // Load reference data once
  useEffect(() => {
    apiJson<Category[]>('/categories').then(setCategories).catch(() => {});
    apiJson<PaymentMethod[]>('/payment-methods').then(setPaymentMethods).catch(() => {});
  }, []);

  // Load dashboard data on mount
  useEffect(() => { loadBalance(); }, [loadBalance]);
  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  function handleTransactionConfirmed() {
    setPendingExpense(null);
    // Refresh balance + summary + transactions
    loadBalance();
    loadSummary();
    loadTransactions();
  }

  const timeline: DailyPoint[] = summary?.dailyTimeline ?? [];
  const defaultPaymentMethodId = paymentMethods.find((pm) => pm.type === 'DEBIT')?.id ?? paymentMethods[0]?.id ?? '';

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink)' }}>
          Click Casal
        </h1>
        <SettingsMenu />
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
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
        />
      </main>

      {/* Sticky bottom: confirm chip + chat bar */}
      <div className="sticky bottom-0 px-4 pb-2 space-y-2">
        {pendingExpense && defaultPaymentMethodId && (
          <ConfirmChip
            parsed={pendingExpense}
            categories={categories}
            paymentMethods={paymentMethods}
            defaultPaymentMethodId={defaultPaymentMethodId}
            onConfirm={handleTransactionConfirmed}
            onDismiss={() => setPendingExpense(null)}
          />
        )}
        <ChatBar onParsed={setPendingExpense} />
      </div>
    </div>
  );
}
