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

export type RecurrenceType = 'NONE' | 'YEARLY' | 'WEEKLY';

export interface UserSummary {
  id: string;
  name: string;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: CalendarCategory;
  categoryId: string;
  person: UserSummary | null;
  personId: string | null;
  startAt: string;
  allDay: boolean;
  recurrence: RecurrenceType;
  recurrenceDays: number[];
  description: string | null;
  createdBy: UserSummary;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventInput {
  title: string;
  categoryId: string;
  personId: string | null;
  startAt: string;
  allDay: boolean;
  recurrence: RecurrenceType;
  recurrenceDays: number[];
  description: string | null;
}

export interface FlyerOffer {
  id: string;
  externalId: string;
  dealerId: string;
  dealerName: string;
  name: string;
  priceOre: number;
  prePriceOre: number | null;
  validFrom: string;
  validUntil: string;
}

export interface ShoppingListItem {
  id: string;
  userId: string;
  name: string;
  checked: boolean;
  matchedOfferId: string | null;
  matchedAt: string | null;
  matchNote: string | null;
  matchedOffer: FlyerOffer | null;
  user?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
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

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTRAL' | 'YEARLY';
  category: string;
  order: number;
  logs: MaintenanceLog[];
}

export interface MaintenanceLog {
  id: string;
  taskId: string;
  doneAt: string;
  doneBy: { id: string; name: string };
}
