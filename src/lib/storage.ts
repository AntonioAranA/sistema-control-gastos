import type { AppData, Movement, YearMonth } from '../types';
import { isAppData, isBudget, isCategory, isMovement, isRecord, isSavingsGoal } from './typeGuards';

const STORAGE_KEY = 'expense-control-data-v3';
const PREVIOUS_STORAGE_KEYS = [
  'expense-control-data-v2',
  'expense-control-data-v1',
  ['cla', 'ro-finanzas-v1'].join('')
];

export const initialCategories = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Salud',
  'Entretenimiento',
  'Compras',
  'Sueldo',
  'Otros'
].map((name) => ({
  id: name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase(),
  name
}));

export const emptyData: AppData = {
  version: 3,
  movements: [],
  categories: initialCategories,
  budgets: [],
  savingsGoals: []
};

const migrateMovement = (value: unknown): Movement | null => {
  if (!isRecord(value)) return null;
  const candidate: unknown = {
    ...value,
    expenseNature: value.expenseNature === 'fixed' ? 'fixed' : 'variable',
    recurrence: ['weekly', 'biweekly', 'monthly', 'yearly'].includes(String(value.recurrence))
      ? value.recurrence
      : 'none',
    recurrencePaused: value.recurrencePaused === true,
    notes: typeof value.notes === 'string' ? value.notes : ''
  };
  return isMovement(candidate) ? candidate : null;
};

export const migrateData = (value: unknown): AppData => {
  if (isAppData(value)) return value;
  if (!isRecord(value)) return emptyData;
  const movements = Array.isArray(value.movements)
    ? value.movements.map(migrateMovement).filter((item): item is Movement => item !== null)
    : [];
  const categories = Array.isArray(value.categories)
    ? value.categories.filter(isCategory)
    : initialCategories;
  const budgets = Array.isArray(value.budgets) ? value.budgets.filter(isBudget) : [];
  const savingsGoals = Array.isArray(value.savingsGoals)
    ? value.savingsGoals
        .map((goal): unknown =>
          isRecord(goal)
            ? {
                ...goal,
                contributions: Array.isArray(goal.contributions) ? goal.contributions : []
              }
            : null
        )
        .filter(isSavingsGoal)
    : [];
  return { version: 3, movements, categories, budgets, savingsGoals };
};

export const loadData = (): AppData => {
  try {
    const value =
      localStorage.getItem(STORAGE_KEY) ??
      PREVIOUS_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    return value ? migrateData(JSON.parse(value) as unknown) : emptyData;
  } catch {
    return emptyData;
  }
};

export const saveData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  PREVIOUS_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getLocalDataForImport = (): AppData | null => {
  const hasStoredData =
    localStorage.getItem(STORAGE_KEY) !== null ||
    PREVIOUS_STORAGE_KEYS.some((key) => localStorage.getItem(key) !== null);
  return hasStoredData ? loadData() : null;
};

export const clearLocalFinancialData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  PREVIOUS_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const demoData = (month: YearMonth): AppData => {
  const at = (day: number): string => `${month}-${String(day).padStart(2, '0')}`;
  const samples = [
    ['Sueldo mensual', 1650000, 1, 'sueldo', 'income', 'fixed', 'monthly'],
    ['Arriendo', 520000, 2, 'vivienda', 'expense', 'fixed', 'monthly'],
    ['Supermercado', 86500, 4, 'alimentacion', 'expense', 'variable', 'none'],
    ['Cuenta de luz', 42100, 6, 'servicios', 'expense', 'fixed', 'monthly'],
    ['Carga bip!', 30000, 8, 'transporte', 'expense', 'variable', 'none'],
    ['Cena', 38500, 12, 'entretenimiento', 'expense', 'variable', 'none'],
    ['Farmacia', 22990, 15, 'salud', 'expense', 'variable', 'none'],
    ['Trabajo independiente', 180000, 18, 'otros', 'income', 'variable', 'none']
  ] as const;
  return {
    version: 3,
    categories: initialCategories,
    budgets: [
      {
        month,
        general: 950000,
        byCategory: { alimentacion: 240000, transporte: 90000, entretenimiento: 100000 }
      }
    ],
    savingsGoals: [
      {
        id: 'demo-goal',
        name: 'Fondo de emergencia',
        targetAmount: 1500000,
        savedAmount: 350000,
        contributions: [{ id: 'demo-contribution', amount: 350000, date: at(5) }]
      }
    ],
    movements: samples.map(
      ([description, amount, day, categoryId, type, expenseNature, recurrence], index) => ({
        id: `demo-${index}`,
        description,
        amount,
        date: at(day),
        categoryId,
        type,
        expenseNature,
        recurrence,
        createdAt: new Date().toISOString()
      })
    )
  };
};
