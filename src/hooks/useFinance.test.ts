import { describe, expect, it } from 'vitest';
import { recurrenceDates } from './useFinance';
import type { Movement } from '../types';

const movement = (recurrence: Movement['recurrence']): Movement => ({
  id: 'template',
  amount: 1000,
  date: '2026-01-05',
  categoryId: 'otros',
  description: 'Recurrente',
  type: 'expense',
  createdAt: '',
  expenseNature: 'fixed',
  recurrence
});
describe('recurrencias', () => {
  it('genera una fecha mensual', () =>
    expect(recurrenceDates(movement('monthly'), '2026-02')).toEqual(['2026-02-05']));
  it('genera ocurrencias semanales', () =>
    expect(recurrenceDates(movement('weekly'), '2026-02').length).toBeGreaterThanOrEqual(4));
  it('respeta la fecha de término', () =>
    expect(
      recurrenceDates({ ...movement('monthly'), recurrenceEnd: '2026-01-31' }, '2026-02')
    ).toEqual([]));
});
