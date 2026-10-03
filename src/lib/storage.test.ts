import { describe, expect, it } from 'vitest';
import { migrateData } from './storage';

describe('migración de almacenamiento', () => {
  it('completa campos nuevos sin perder movimientos antiguos', () => {
    const migrated = migrateData({
      movements: [
        {
          id: '1',
          amount: 1000,
          date: '2026-01-01',
          categoryId: 'otros',
          description: 'Anterior',
          type: 'expense',
          createdAt: ''
        }
      ],
      categories: [{ id: 'otros', name: 'Otros' }],
      budgets: []
    });
    expect(migrated.version).toBe(3);
    expect(migrated.movements[0]).toMatchObject({ expenseNature: 'variable', recurrence: 'none' });
    expect(migrated.savingsGoals).toEqual([]);
  });
});
