import { describe, expect, it } from 'vitest';
import { parseExpenseText } from '../lib/parser';

describe('parseExpenseText', () => {
  // ── Happy paths ──────────────────────────────────────────────────────────

  it('parses a DKK expense with whole amount', () => {
    const r = parseExpenseText('Gastei 250 coroas no Rema, mercado');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.amount).toBe(25000);
    expect(r.data.currency).toBe('DKK');
    expect(r.data.type).toBe('EXPENSE');
    expect(r.data.categoryName).toBe('Supermercado');
  });

  it('parses a DKK expense with decimal comma', () => {
    const r = parseExpenseText('Gastei 45,90 kr no Netto');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.amount).toBe(4590);
    expect(r.data.currency).toBe('DKK');
    expect(r.data.type).toBe('EXPENSE');
    expect(r.data.categoryName).toBe('Supermercado');
  });

  it('parses a BRL income', () => {
    const r = parseExpenseText('Recebi 3000 reais de salário');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.amount).toBe(300000);
    expect(r.data.currency).toBe('BRL');
    expect(r.data.type).toBe('INCOME');
    expect(r.data.categoryName).toBeNull();
  });

  it('parses a DKK income with "ganhei"', () => {
    const r = parseExpenseText('Ganhei 500 kr de freelance');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.amount).toBe(50000);
    expect(r.data.currency).toBe('DKK');
    expect(r.data.type).toBe('INCOME');
  });

  it('detects transport category from "uber"', () => {
    const r = parseExpenseText('Paguei 23 kr de uber');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.type).toBe('EXPENSE');
    expect(r.data.categoryName).toBe('Transporte');
  });

  it('detects transport category from "DSB"', () => {
    const r = parseExpenseText('Comprei passe do DSB por 99 kr');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.categoryName).toBe('Transporte');
  });

  it('detects delivery category from "ifood"', () => {
    const r = parseExpenseText('Paguei 89 reais no iFood');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.currency).toBe('BRL');
    expect(r.data.categoryName).toBe('Delivery / Restaurante');
  });

  it('defaults currency to DKK when ambiguous', () => {
    const r = parseExpenseText('Comprei algo por 100');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.currency).toBe('DKK');
  });

  it('returns null categoryName when no keyword matches', () => {
    const r = parseExpenseText('Gastei 50 kr numa coisa aleatória');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.categoryName).toBeNull();
  });

  it('parses BRL amount with decimal period', () => {
    const r = parseExpenseText('Paguei R$ 19.90 no Spotify');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.amount).toBe(1990);
    expect(r.data.currency).toBe('BRL');
    expect(r.data.categoryName).toBe('Contas');
  });

  it('handles "caiu" as INCOME', () => {
    const r = parseExpenseText('Caiu 1500 kr na conta');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.type).toBe('INCOME');
  });

  // ── Failure paths ────────────────────────────────────────────────────────

  it('returns error when no amount found', () => {
    const r = parseExpenseText('Fui ao supermercado');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBeTruthy();
  });

  it('returns error for empty string', () => {
    const r = parseExpenseText('');
    expect(r.ok).toBe(false);
  });

  it('returns error for whitespace only', () => {
    const r = parseExpenseText('   ');
    expect(r.ok).toBe(false);
  });
});
