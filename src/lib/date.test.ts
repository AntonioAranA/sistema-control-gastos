import { describe, expect, it } from 'vitest';
import { shiftDateByMonth } from './date';

describe('cambio de mes de una fecha', () => {
  it('ajusta el día al último válido del mes siguiente', () => {
    expect(shiftDateByMonth('2026-01-31', 1)).toBe('2026-02-28');
  });
});
