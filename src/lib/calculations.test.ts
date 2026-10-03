import { describe, expect, it } from 'vitest';
import type { Movement } from '../types';
import { budgetStatus, calculateSummary, movementsForMonth } from './calculations';

const movements: Movement[] = [
  {
    id: '1',
    amount: 900000,
    date: '2026-09-01',
    categoryId: 'sueldo',
    description: 'Sueldo',
    type: 'income',
    createdAt: '',
    expenseNature: 'fixed',
    recurrence: 'monthly'
  },
  {
    id: '2',
    amount: 120000,
    date: '2026-09-03',
    categoryId: 'vivienda',
    description: 'Arriendo',
    type: 'expense',
    createdAt: '',
    expenseNature: 'fixed',
    recurrence: 'monthly'
  },
  {
    id: '3',
    amount: 30000,
    date: '2026-08-20',
    categoryId: 'salud',
    description: 'Consulta',
    type: 'expense',
    createdAt: '',
    expenseNature: 'variable',
    recurrence: 'none'
  }
];

describe('cálculos financieros', () => {
  it('calcula ingresos, gastos y saldo', () => {
    expect(calculateSummary(movements)).toEqual({
      income: 900000,
      expense: 150000,
      balance: 750000
    });
  });
  it('filtra por mes sin depender de UTC', () => {
    expect(movementsForMonth(movements, '2026-09').map(({ id }) => id)).toEqual(['1', '2']);
  });
  it('detecta presupuestos superados y calcula porcentaje', () => {
    expect(budgetStatus(120000, 100000)).toEqual({
      percentage: 120,
      exceeded: true,
      remaining: -20000
    });
  });
  it('evita porcentajes inválidos sin presupuesto', () => {
    expect(budgetStatus(1000, 0)).toEqual({ percentage: 0, exceeded: false, remaining: -1000 });
  });
});
