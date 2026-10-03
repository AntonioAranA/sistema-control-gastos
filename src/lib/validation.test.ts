import { describe, expect, it } from 'vitest';
import { validateMovementDraft } from './validation';

describe('validación de movimientos', () => {
  it('rechaza campos vacíos', () =>
    expect(
      validateMovementDraft({ amount: '100', date: '', categoryId: '', description: '' }).valid
    ).toBe(false));
  it('rechaza montos negativos', () =>
    expect(
      validateMovementDraft({
        amount: '-10',
        date: '2026-01-01',
        categoryId: 'otros',
        description: 'Prueba'
      }).valid
    ).toBe(false));
  it('normaliza un movimiento válido', () =>
    expect(
      validateMovementDraft({
        amount: '1200.4',
        date: '2026-01-01',
        categoryId: 'otros',
        description: 'Prueba'
      })
    ).toEqual({ valid: true, amount: 1200 }));
});
