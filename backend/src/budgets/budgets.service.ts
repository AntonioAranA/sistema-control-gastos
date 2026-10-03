import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { monthRange } from '../common/date';
import type { UpsertBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: string) {
    return Promise.all(
      (
        await this.prisma.budget.findMany({
          where: { userId },
          include: { categories: true },
          orderBy: { month: 'desc' }
        })
      ).map(toResponse)
    );
  }
  async get(userId: string, month: string) {
    monthRange(month);
    const budget = await this.prisma.budget.findUnique({
      where: { userId_month: { userId, month } },
      include: { categories: true }
    });
    return budget ? toResponse(budget) : { month, general: 0, byCategory: {} };
  }
  async upsert(userId: string, dto: UpsertBudgetDto) {
    monthRange(dto.month);
    if (new Set(dto.categories.map((item) => item.categoryId)).size !== dto.categories.length)
      throw new BadRequestException('No se permiten categorías duplicadas');
    const owned = await this.prisma.category.count({
      where: { userId, id: { in: dto.categories.map((item) => item.categoryId) } }
    });
    if (owned !== dto.categories.length)
      throw new BadRequestException('Una categoría no pertenece al usuario');
    const result = await this.prisma.$transaction(async (tx) => {
      const budget = await tx.budget.upsert({
        where: { userId_month: { userId, month: dto.month } },
        create: { userId, month: dto.month, general: dto.general },
        update: { general: dto.general }
      });
      await tx.categoryBudget.deleteMany({ where: { budgetId: budget.id } });
      if (dto.categories.length)
        await tx.categoryBudget.createMany({
          data: dto.categories.map((item) => ({
            budgetId: budget.id,
            categoryId: item.categoryId,
            amount: item.amount
          }))
        });
      return tx.budget.findUniqueOrThrow({
        where: { id: budget.id },
        include: { categories: true }
      });
    });
    return toResponse(result);
  }
}
const toResponse = (budget: {
  month: string;
  general: number;
  categories: Array<{ categoryId: string; amount: number }>;
}) => ({
  month: budget.month,
  general: budget.general,
  byCategory: Object.fromEntries(budget.categories.map((item) => [item.categoryId, item.amount]))
});
