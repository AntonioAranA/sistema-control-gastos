import type {
  Budget,
  BudgetStatus,
  CategoryId,
  CurrencyAmount,
  Movement,
  MovementType,
  MonthlySummary,
  YearMonth
} from '../types';

export const movementsForMonth = (movements: Movement[], month: YearMonth): Movement[] =>
  movements.filter((movement) => movement.date.slice(0, 7) === month);

export const totalByType = (movements: Movement[], type: MovementType): CurrencyAmount =>
  movements
    .filter((movement) => movement.type === type)
    .reduce((total, movement) => total + movement.amount, 0);

export const calculateSummary = (movements: Movement[]): MonthlySummary => {
  const income = totalByType(movements, 'income');
  const expense = totalByType(movements, 'expense');
  return { income, expense, balance: income - expense };
};

export const spentByCategory = (movements: Movement[]): Record<CategoryId, CurrencyAmount> =>
  movements
    .filter((movement) => movement.type === 'expense')
    .reduce<Record<CategoryId, CurrencyAmount>>((totals, movement) => {
      totals[movement.categoryId] = (totals[movement.categoryId] ?? 0) + movement.amount;
      return totals;
    }, {});

export const budgetStatus = (spent: CurrencyAmount, limit: CurrencyAmount): BudgetStatus => ({
  percentage: limit > 0 ? Math.round((spent / limit) * 100) : 0,
  exceeded: limit > 0 && spent > limit,
  remaining: limit - spent
});

export const getBudget = (budgets: Budget[], month: YearMonth): Budget =>
  budgets.find((budget) => budget.month === month) ?? { month, general: 0, byCategory: {} };
