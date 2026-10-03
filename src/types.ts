export const MOVEMENT_TYPES = ['income', 'expense'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const SCREENS = ['dashboard', 'movements', 'budgets', 'reports', 'categories'] as const;
export type Screen = (typeof SCREENS)[number];

export type CategoryId = string;
export type IsoDate = string;
export type YearMonth = string;
export type CurrencyAmount = number;
export type ExpenseNature = 'fixed' | 'variable';
export type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Category {
  id: CategoryId;
  name: string;
  isDefault?: boolean;
}

export interface Movement {
  id: string;
  amount: CurrencyAmount;
  date: IsoDate;
  categoryId: CategoryId;
  description: string;
  type: MovementType;
  createdAt: string;
  expenseNature: ExpenseNature;
  recurrence: Recurrence;
  recurrenceSourceId?: string;
  recurrenceEnd?: IsoDate;
  recurrencePaused?: boolean;
  notes?: string;
}

export interface Budget {
  month: YearMonth;
  general: CurrencyAmount;
  byCategory: Record<CategoryId, CurrencyAmount>;
}

export interface AppData {
  version: 3;
  movements: Movement[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: CurrencyAmount;
  savedAmount: CurrencyAmount;
  targetDate?: IsoDate;
  contributions: SavingsContribution[];
}

export interface SavingsContribution {
  id: string;
  amount: CurrencyAmount;
  date: IsoDate;
}

export interface MonthlySummary {
  income: CurrencyAmount;
  expense: CurrencyAmount;
  balance: CurrencyAmount;
}

export interface BudgetStatus {
  percentage: number;
  exceeded: boolean;
  remaining: CurrencyAmount;
}
