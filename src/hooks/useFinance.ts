import { useCallback, useEffect, useState } from 'react';
import type { AppData, Budget, Category, Movement, SavingsGoal, YearMonth } from '../types';
import { shiftDateByMonth, shiftMonth } from '../lib/date';
import { api } from '../lib/api';
import { demoData } from '../lib/storage';
import { isAppData } from '../lib/typeGuards';

const EMPTY_DATA: AppData = {
  version: 3,
  movements: [],
  categories: [],
  budgets: [],
  savingsGoals: []
};
export interface FinanceStore {
  data: AppData;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  saveMovement: (movement: Movement) => void;
  duplicateMovement: (movement: Movement) => void;
  moveToNextMonth: (movement: Movement) => void;
  deleteMovement: (id: string) => void;
  deleteMovements: (ids: string[]) => void;
  recategorizeMovements: (ids: string[], categoryId: string) => void;
  addCategory: (category: Category) => Promise<Category>;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  saveBudget: (budget: Budget) => void;
  copyPreviousBudget: (month: YearMonth) => Promise<boolean>;
  saveGoal: (goal: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
  generateRecurring: (month: YearMonth) => Promise<number>;
  toggleRecurrence: (id: string) => void;
  replaceData: (value: unknown) => void;
  importMovements: (movements: Movement[]) => void;
  importSnapshot: (data: AppData) => Promise<void>;
  loadDemo: (month: YearMonth) => void;
  clearData: () => void;
}

export const useFinance = (enabled = true): FinanceStore => {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      setData(await api.snapshot());
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void api
      .snapshot()
      .then((snapshot) => {
        if (active) setData(snapshot);
      })
      .catch((cause) => {
        if (active) setError(messageOf(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled]);
  const execute = (operation: () => Promise<unknown>): void => {
    setError('');
    void operation()
      .then(refresh)
      .catch((cause) => setError(messageOf(cause)));
  };
  const importSnapshot = async (source: AppData): Promise<void> => {
    const categoryIds = new Set(source.categories.map(({ id }) => id));
    const missingMovementCategory = source.movements.some(
      ({ categoryId }) => !categoryIds.has(categoryId)
    );
    const missingBudgetCategory = source.budgets.some((budget) =>
      Object.keys(budget.byCategory).some((id) => !categoryIds.has(id))
    );
    if (missingMovementCategory || missingBudgetCategory)
      throw new Error(
        'El respaldo contiene movimientos o presupuestos con categorías inexistentes. No se importó ningún dato.'
      );
    const serverCategories = await api.categories();
    const categoryMap = new Map<string, string>();
    for (const local of source.categories) {
      let server = serverCategories.find(
        (item) => item.name.toLocaleLowerCase('es') === local.name.toLocaleLowerCase('es')
      );
      if (!server) {
        server = await api.createCategory(local);
        serverCategories.push(server);
      }
      categoryMap.set(local.id, server.id);
    }
    const movementResult = await api.importMovements(
      source.movements.map((item) => ({
        ...item,
        categoryId: categoryMap.get(item.categoryId) ?? item.categoryId
      }))
    );
    if (movementResult.rejected.length)
      throw new Error(
        `La API rechazó ${movementResult.rejected.length} movimiento(s). Tus datos locales se conservaron; puedes reintentar la importación.`
      );
    for (const budget of source.budgets)
      await api.saveBudget({
        ...budget,
        byCategory: Object.fromEntries(
          Object.entries(budget.byCategory).flatMap(([id, amount]) => {
            const mapped = categoryMap.get(id);
            return mapped ? [[mapped, amount]] : [];
          })
        )
      });
    const currentGoals = await api.goals();
    for (const goal of source.savingsGoals)
      if (
        !currentGoals.some(
          (item) => item.name === goal.name && item.targetAmount === goal.targetAmount
        )
      ) {
        const created = await api.createGoal(goal);
        for (const contribution of goal.contributions)
          await api.contribute(created.id, contribution.amount, contribution.date);
      }
    await refresh();
  };
  return {
    data,
    loading,
    error,
    refresh,
    saveMovement: (movement) =>
      execute(() =>
        data.movements.some(({ id }) => id === movement.id)
          ? api.updateMovement(movement)
          : api.createMovement(movement)
      ),
    duplicateMovement: (movement) =>
      execute(() =>
        api.createMovement({
          ...movement,
          id: crypto.randomUUID(),
          description: `${movement.description} (copia)`,
          recurrenceSourceId: undefined
        })
      ),
    moveToNextMonth: (movement) =>
      execute(() =>
        api.createMovement({
          ...movement,
          id: crypto.randomUUID(),
          date: shiftDateByMonth(movement.date, 1),
          recurrenceSourceId: undefined
        })
      ),
    deleteMovement: (id) => execute(() => api.deleteMovement(id)),
    deleteMovements: (ids) => execute(() => api.bulkDelete(ids)),
    recategorizeMovements: (ids, categoryId) => execute(() => api.bulkCategory(ids, categoryId)),
    addCategory: async (category) => {
      setError('');
      try {
        const created = await api.createCategory(category);
        await refresh();
        return created;
      } catch (cause) {
        setError(messageOf(cause));
        throw cause;
      }
    },
    updateCategory: (category) => execute(() => api.updateCategory(category)),
    deleteCategory: (id) => execute(() => api.deleteCategory(id)),
    saveBudget: (budget) => execute(() => api.saveBudget(budget)),
    copyPreviousBudget: async (month) => {
      const previous = data.budgets.find((item) => item.month === shiftMonth(month, -1));
      if (!previous) return false;
      await api.saveBudget({ ...previous, month });
      await refresh();
      return true;
    },
    saveGoal: (goal) =>
      execute(async () => {
        const existing = data.savingsGoals.find(({ id }) => id === goal.id);
        if (!existing) return api.createGoal(goal);
        const newContribution = goal.contributions.find(
          (item) => !existing.contributions.some(({ id }) => id === item.id)
        );
        return newContribution
          ? api.contribute(goal.id, newContribution.amount, newContribution.date)
          : api.updateGoal(goal);
      }),
    deleteGoal: (id) => execute(() => api.deleteGoal(id)),
    generateRecurring: async (month) => {
      const templates = data.movements.filter(
        (item) =>
          item.recurrence !== 'none' && !item.recurrencePaused && item.date.slice(0, 7) <= month
      );
      const generated = templates.flatMap((template) =>
        recurrenceDates(template, month)
          .filter(
            (date) =>
              !data.movements.some(
                (item) =>
                  item.date === date &&
                  item.recurrenceSourceId === (template.recurrenceSourceId ?? template.id)
              )
          )
          .map((date) => ({
            ...template,
            id: crypto.randomUUID(),
            date,
            recurrence: 'none' as const,
            recurrenceSourceId: template.recurrenceSourceId ?? template.id
          }))
      );
      await Promise.all(generated.map(api.createMovement));
      await refresh();
      return generated.length;
    },
    toggleRecurrence: (id) => {
      const item = data.movements.find((movement) => movement.id === id);
      if (item)
        execute(() => api.updateMovement({ ...item, recurrencePaused: !item.recurrencePaused }));
    },
    replaceData: (value) => {
      if (!isAppData(value)) {
        setError('El respaldo no tiene un formato válido');
        return;
      }
      void importSnapshot(value).catch((cause) => setError(messageOf(cause)));
    },
    importMovements: (movements) => execute(() => api.importMovements(movements)),
    importSnapshot,
    loadDemo: (month) => {
      void importSnapshot(demoData(month)).catch((cause) => setError(messageOf(cause)));
    },
    clearData: () => execute(() => api.clearData())
  };
};

const messageOf = (cause: unknown): string =>
  cause instanceof Error ? cause.message : 'No fue posible completar la operación';
export const recurrenceDates = (movement: Movement, month: YearMonth): string[] => {
  const start = new Date(`${movement.date}T12:00:00`);
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return [];
  const from = new Date(year, monthNumber - 1, 1, 12);
  const to = new Date(year, monthNumber, 0, 12);
  const end = movement.recurrenceEnd ? new Date(`${movement.recurrenceEnd}T12:00:00`) : to;
  const dates: string[] = [];
  if (movement.recurrence === 'monthly')
    return [
      shiftDateByMonth(
        movement.date,
        (year - start.getFullYear()) * 12 + monthNumber - 1 - start.getMonth()
      )
    ].filter((date) => date > movement.date && new Date(`${date}T12:00:00`) <= end);
  if (movement.recurrence === 'yearly')
    return start.getMonth() === monthNumber - 1 && year > start.getFullYear()
      ? [`${year}-${movement.date.slice(5)}`]
      : [];
  const step = movement.recurrence === 'weekly' ? 7 : 14;
  const cursor = new Date(start);
  while (cursor <= to && cursor <= end) {
    if (cursor >= from && cursor > start) dates.push(cursor.toLocaleDateString('en-CA'));
    cursor.setDate(cursor.getDate() + step);
  }
  return dates;
};
