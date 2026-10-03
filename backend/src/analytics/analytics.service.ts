import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { currentSantiagoMonth, monthRange } from '../common/date';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}
  async summary(userId: string, month = currentSantiagoMonth()) {
    const { start, end } = monthRange(month);
    const grouped = await this.prisma.movement.groupBy({
      by: ['type'],
      where: { userId, date: { gte: start, lt: end } },
      _sum: { amount: true }
    });
    const income = grouped.find((item) => item.type === 'income')?._sum.amount ?? 0;
    const expense = grouped.find((item) => item.type === 'expense')?._sum.amount ?? 0;
    const budget = await this.prisma.budget.findUnique({
      where: { userId_month: { userId, month } }
    });
    return {
      month,
      income,
      expense,
      balance: income - expense,
      budget: budget?.general ?? null,
      budgetPercentage: budget?.general ? Math.round((expense / budget.general) * 100) : null
    };
  }
  async byCategory(userId: string, month = currentSantiagoMonth()) {
    const { start, end } = monthRange(month);
    const grouped = await this.prisma.movement.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'expense', date: { gte: start, lt: end } },
      _sum: { amount: true }
    });
    const categories = await this.prisma.category.findMany({
      where: { userId, id: { in: grouped.map((item) => item.categoryId) } },
      select: { id: true, name: true }
    });
    const names = new Map(categories.map((item) => [item.id, item.name]));
    return grouped.map((item) => ({
      categoryId: item.categoryId,
      category: names.get(item.categoryId),
      amount: item._sum.amount ?? 0
    }));
  }
  async evolution(userId: string, month = currentSantiagoMonth()) {
    const [year, number] = month.split('-').map(Number);
    if (!year || !number) monthRange(month);
    const start = new Date(Date.UTC(year!, number! - 6, 1));
    const end = new Date(Date.UTC(year!, number!, 1));
    const items = await this.prisma.movement.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { date: true, amount: true, type: true }
    });
    const result = new Map<string, { month: string; income: number; expense: number }>();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(Date.UTC(year!, number! - 1 - offset, 1));
      const key = date.toISOString().slice(0, 7);
      result.set(key, { month: key, income: 0, expense: 0 });
    }
    items.forEach((item) => {
      const row = result.get(item.date.toISOString().slice(0, 7));
      if (row) row[item.type] += item.amount;
    });
    return [...result.values()];
  }
}
