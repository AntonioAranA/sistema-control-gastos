import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';
import { BudgetsService } from '../src/budgets/budgets.service';

describe('BudgetsService', () => {
  it('rechaza categorías duplicadas', async () => {
    const service = new BudgetsService({} as PrismaService);
    await expect(
      service.upsert('user-a', {
        month: '2026-09',
        general: 100000,
        categories: [
          { categoryId: 'same', amount: 10 },
          { categoryId: 'same', amount: 20 }
        ]
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('consulta el presupuesto usando usuario y mes', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const prisma = { budget: { findUnique } } as unknown as PrismaService;
    await new BudgetsService(prisma).get('user-a', '2026-09');
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_month: { userId: 'user-a', month: '2026-09' } } })
    );
  });
});
