import type { PrismaService } from '../src/prisma/prisma.service';
import { AnalyticsService } from '../src/analytics/analytics.service';

describe('AnalyticsService', () => {
  it('calcula resumen mensual sin aceptar totales del cliente', async () => {
    const groupBy = jest.fn().mockResolvedValue([
      { type: 'income', _sum: { amount: 100000 } },
      { type: 'expense', _sum: { amount: 40000 } }
    ]);
    const prisma = {
      movement: { groupBy },
      budget: { findUnique: jest.fn().mockResolvedValue({ general: 80000 }) }
    } as unknown as PrismaService;
    const result = await new AnalyticsService(prisma).summary('user-a', '2026-09');
    expect(result).toMatchObject({
      income: 100000,
      expense: 40000,
      balance: 60000,
      budgetPercentage: 50
    });
    expect(groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-a' }) })
    );
  });
  it('devuelve porcentaje nulo si no hay presupuesto', async () => {
    const prisma = {
      movement: { groupBy: jest.fn().mockResolvedValue([]) },
      budget: { findUnique: jest.fn().mockResolvedValue(null) }
    } as unknown as PrismaService;
    expect(
      (await new AnalyticsService(prisma).summary('user-a', '2026-09')).budgetPercentage
    ).toBeNull();
  });
});
