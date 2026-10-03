import { describe, expect, it } from 'vitest';
import { previewCsvImport } from './dataTransfer';
import type { Movement } from '../types';

const existing: Movement = {
  id: '1',
  date: '2026-01-01',
  amount: 1000,
  description: 'Compra',
  categoryId: 'otros',
  type: 'expense',
  expenseNature: 'variable',
  recurrence: 'none',
  createdAt: ''
};
describe('importación CSV', () => {
  it('omite duplicados y reporta filas inválidas', () => {
    const csv =
      'Fecha;Tipo;Categoría;Descripción;Monto CLP;Naturaleza\n2026-01-01;Gasto;Otros;Compra;1000;Variable\n2026-01-02;Gasto;Otros;Nueva;2000;Variable\nfila;mala';
    const result = previewCsvImport(csv, [{ id: 'otros', name: 'Otros' }], [existing]);
    expect(result.accepted).toHaveLength(1);
    expect(result.duplicateCount).toBe(1);
    expect(result.rejected).toHaveLength(1);
  });
});
