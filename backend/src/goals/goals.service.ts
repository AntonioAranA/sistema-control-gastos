import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { dateOnly, parseDateOnly } from '../common/date';
import type { CreateContributionDto, CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: string) {
    return Promise.all(
      (
        await this.prisma.savingsGoal.findMany({
          where: { userId },
          include: { contributions: { orderBy: { date: 'desc' } } }
        })
      ).map(goalResponse)
    );
  }
  async create(userId: string, dto: CreateGoalDto) {
    return goalResponse(
      await this.prisma.savingsGoal.create({
        data: {
          userId,
          name: dto.name.trim(),
          targetAmount: dto.targetAmount,
          targetDate: dto.targetDate ? parseDateOnly(dto.targetDate) : null
        },
        include: { contributions: true }
      })
    );
  }
  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.requireOwned(userId, id);
    return goalResponse(
      await this.prisma.savingsGoal.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.targetAmount && { targetAmount: dto.targetAmount }),
          ...(dto.targetDate && { targetDate: parseDateOnly(dto.targetDate) })
        },
        include: { contributions: true }
      })
    );
  }
  async remove(userId: string, id: string): Promise<void> {
    await this.requireOwned(userId, id);
    await this.prisma.savingsGoal.delete({ where: { id } });
  }
  async contribute(userId: string, id: string, dto: CreateContributionDto) {
    await this.requireOwned(userId, id);
    await this.prisma.savingsContribution.create({
      data: { goalId: id, amount: dto.amount, date: parseDateOnly(dto.date) }
    });
    return goalResponse(
      await this.prisma.savingsGoal.findUniqueOrThrow({
        where: { id },
        include: { contributions: { orderBy: { date: 'desc' } } }
      })
    );
  }
  private async requireOwned(userId: string, id: string) {
    const item = await this.prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Meta no encontrada');
    return item;
  }
}
const goalResponse = async (goal: {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date | null;
  contributions: Array<{ id: string; amount: number; date: Date }>;
}) => ({
  id: goal.id,
  name: goal.name,
  targetAmount: goal.targetAmount,
  targetDate: goal.targetDate ? dateOnly(goal.targetDate) : undefined,
  savedAmount: goal.contributions.reduce((sum, item) => sum + item.amount, 0),
  contributions: goal.contributions.map((item) => ({
    id: item.id,
    amount: item.amount,
    date: dateOnly(item.date)
  }))
});
