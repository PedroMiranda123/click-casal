const dkkFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'DKK',
  minimumFractionDigits: 2,
});

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

/** Format minor units (øre) to a display DKK string. */
export function formatDKK(amountOere: number): string {
  return dkkFormatter.format(amountOere / 100);
}

/** Format minor units to a display string in the given currency. */
export function formatAmount(amountMinor: number, currency: 'DKK' | 'BRL'): string {
  const value = amountMinor / 100;
  return currency === 'DKK' ? dkkFormatter.format(value) : brlFormatter.format(value);
}

/** Parse a human-entered decimal string (e.g. "45,90" or "45.90") to minor units integer. */
export function toMinorUnits(humanValue: string): number {
  const normalized = humanValue.replace(',', '.');
  const float = parseFloat(normalized);
  if (Number.isNaN(float) || float <= 0) return 0;
  return Math.round(float * 100);
}

/** Convert minor units to a human decimal string for input display (e.g. 4590 → "45.90"). */
export function toHumanDecimal(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}
