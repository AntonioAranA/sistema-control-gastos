import type { AppData, Budget, Category, Movement, SavingsGoal } from '../types';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
export const isCategory = (value: unknown): value is Category =>
  isRecord(value) && isString(value.id) && isString(value.name);
export const isBudget = (value: unknown): value is Budget =>
  isRecord(value) &&
  isString(value.month) &&
  isNonNegativeNumber(value.general) &&
  isRecord(value.byCategory) &&
  Object.values(value.byCategory).every(isNonNegativeNumber);
export const isMovement = (value: unknown): value is Movement =>
  isRecord(value) &&
  isString(value.id) &&
  isNonNegativeNumber(value.amount) &&
  value.amount > 0 &&
  isString(value.date) &&
  isString(value.categoryId) &&
  isString(value.description) &&
  (value.type === 'income' || value.type === 'expense') &&
  isString(value.createdAt) &&
  (value.expenseNature === 'fixed' || value.expenseNature === 'variable') &&
  ['none', 'weekly', 'biweekly', 'monthly', 'yearly'].includes(String(value.recurrence)) &&
  (value.recurrenceSourceId === undefined || isString(value.recurrenceSourceId)) &&
  (value.recurrenceEnd === undefined || isString(value.recurrenceEnd)) &&
  (value.recurrencePaused === undefined || typeof value.recurrencePaused === 'boolean') &&
  (value.notes === undefined || isString(value.notes));
export const isSavingsGoal = (value: unknown): value is SavingsGoal =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isNonNegativeNumber(value.targetAmount) &&
  value.targetAmount > 0 &&
  isNonNegativeNumber(value.savedAmount) &&
  (value.targetDate === undefined || isString(value.targetDate)) &&
  Array.isArray(value.contributions) &&
  value.contributions.every(
    (item) =>
      isRecord(item) && isString(item.id) && isNonNegativeNumber(item.amount) && isString(item.date)
  );
export const isAppData = (value: unknown): value is AppData =>
  isRecord(value) &&
  value.version === 3 &&
  Array.isArray(value.movements) &&
  value.movements.every(isMovement) &&
  Array.isArray(value.categories) &&
  value.categories.every(isCategory) &&
  Array.isArray(value.budgets) &&
  value.budgets.every(isBudget) &&
  Array.isArray(value.savingsGoals) &&
  value.savingsGoals.every(isSavingsGoal);
