export interface User {
  id: string;
  name: string;
  email: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'DEBIT' | 'CREDIT';
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  paymentMethodId: string;
  categoryId: string | null;
  type: 'INCOME' | 'EXPENSE';
  /** Amount in minor units (øre / centavos) */
  originalAmount: number;
  originalCurrency: 'DKK' | 'BRL';
  /** Amount in minor units (øre) */
  amountDkk: number;
  exchangeRate: string | null;
  description: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  /** Total balance in minor units (øre) */
  balanceDkk: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  /** In minor units (øre) */
  totalDkk: number;
}

export interface DailyPoint {
  date: string;
  /** In minor units (øre) */
  balanceDkk: number;
}

export interface Summary {
  categoryBreakdown: CategoryBreakdown[];
  dailyTimeline: DailyPoint[];
}

export interface TransactionList {
  data: Transaction[];
  pagination: { page: number; limit: number; total: number };
}

export interface TransactionInput {
  type: 'INCOME' | 'EXPENSE';
  /** Minor units (øre / centavos) */
  originalAmount: number;
  originalCurrency: 'DKK' | 'BRL';
  paymentMethodId: string;
  categoryId: string | null;
  occurredAt: string;
  description: string | null;
}
