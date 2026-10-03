import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';
import { MovementsService } from '../src/movements/movements.service';

describe('MovementsService: aislamiento y filtros', () => {
  it('incluye siempre el usuario autenticado al listar', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      movement: { findMany, count },
      $transaction: jest
        .fn()
        .mockImplementation(async (items: Array<Promise<unknown>>) => Promise.all(items))
    } as unknown as PrismaService;
    const service = new MovementsService(prisma);
    await service.list('user-a', {
      page: 1,
      limit: 25,
      search: 'arriendo',
      type: 'expense',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-a', type: 'expense' })
      })
    );
  });
  it('impide eliminar un movimiento de otro usuario', async () => {
    const remove = jest.fn();
    const prisma = {
      movement: { findFirst: jest.fn().mockResolvedValue(null), delete: remove }
    } as unknown as PrismaService;
    await expect(
      new MovementsService(prisma).remove('user-a', 'movement-b')
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(remove).not.toHaveBeenCalled();
  });
  it('omite duplicados durante la importación', async () => {
    const prisma = {
      category: { findMany: jest.fn().mockResolvedValue([{ id: 'category-a' }]) },
      movement: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { date: new Date('2026-09-01T00:00:00Z'), amount: 1000, description: 'Compra' }
          ]),
        createMany: jest.fn()
      }
    } as unknown as PrismaService;
    const result = await new MovementsService(prisma).import('user-a', [
      {
        amount: 1000,
        date: '2026-09-01',
        categoryId: 'category-a',
        description: 'Compra',
        type: 'expense',
        expenseNature: 'variable',
        recurrence: 'none'
      }
    ]);
    expect(result).toEqual({ imported: 0, duplicates: 1, rejected: [] });
  });
});
