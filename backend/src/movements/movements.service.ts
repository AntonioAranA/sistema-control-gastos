import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseNature, MovementType, Prisma, Recurrence } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { dateOnly, parseDateOnly } from '../common/date';
import type {
  BulkCategoryDto,
  CreateMovementDto,
  MovementQueryDto,
  UpdateMovementDto
} from './dto/movement.dto';

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: string, query: MovementQueryDto) {
    const where = this.where(userId, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.movement.findMany({
        where,
        include: { category: true },
        orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      this.prisma.movement.count({ where })
    ]);
    return {
      items: items.map(serializeMovement),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit)
    };
  }
  async all(userId: string) {
    return (
      await this.prisma.movement.findMany({ where: { userId }, orderBy: { date: 'desc' } })
    ).map(serializeMovement);
  }
  async create(userId: string, dto: CreateMovementDto) {
    await this.requireCategory(userId, dto.categoryId);
    return serializeMovement(await this.prisma.movement.create({ data: this.data(userId, dto) }));
  }
  async update(userId: string, id: string, dto: UpdateMovementDto) {
    await this.requireOwned(userId, id);
    if (dto.categoryId) await this.requireCategory(userId, dto.categoryId);
    const data: Prisma.MovementUpdateInput = {
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.date && { date: parseDateOnly(dto.date) }),
      ...(dto.description !== undefined && { description: dto.description.trim() }),
      ...(dto.notes !== undefined && { notes: dto.notes.trim() || null }),
      ...(dto.type && { type: dto.type as MovementType }),
      ...(dto.expenseNature && { expenseNature: dto.expenseNature as ExpenseNature }),
      ...(dto.recurrence && { recurrence: dto.recurrence as Recurrence }),
      ...(dto.recurrenceEnd && { recurrenceEnd: parseDateOnly(dto.recurrenceEnd) }),
      ...(dto.recurrencePaused !== undefined && { recurrencePaused: dto.recurrencePaused }),
      ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } })
    };
    return serializeMovement(await this.prisma.movement.update({ where: { id }, data }));
  }
  async remove(userId: string, id: string): Promise<void> {
    await this.requireOwned(userId, id);
    await this.prisma.movement.delete({ where: { id } });
  }
  async bulkDelete(userId: string, ids: string[]) {
    const result = await this.prisma.movement.deleteMany({ where: { userId, id: { in: ids } } });
    return { count: result.count };
  }
  async bulkCategory(userId: string, dto: BulkCategoryDto) {
    await this.requireCategory(userId, dto.categoryId);
    const result = await this.prisma.movement.updateMany({
      where: { userId, id: { in: dto.ids } },
      data: { categoryId: dto.categoryId }
    });
    return { count: result.count };
  }
  async import(userId: string, rows: CreateMovementDto[]) {
    const categoryIds = new Set(
      (await this.prisma.category.findMany({ where: { userId }, select: { id: true } })).map(
        ({ id }) => id
      )
    );
    const existing = await this.prisma.movement.findMany({
      where: { userId },
      select: { date: true, amount: true, description: true }
    });
    const fingerprints = new Set(
      existing.map(
        (item) => `${dateOnly(item.date)}|${item.amount}|${item.description.toLowerCase()}`
      )
    );
    const accepted: Prisma.MovementCreateManyInput[] = [];
    const rejected: Array<{ index: number; reason: string }> = [];
    let duplicates = 0;
    rows.forEach((row, index) => {
      if (!categoryIds.has(row.categoryId)) {
        rejected.push({ index, reason: 'La categoría no pertenece al usuario' });
        return;
      }
      const key = `${row.date}|${row.amount}|${row.description.trim().toLowerCase()}`;
      if (fingerprints.has(key)) {
        duplicates += 1;
        return;
      }
      fingerprints.add(key);
      accepted.push(this.data(userId, row));
    });
    if (accepted.length) await this.prisma.movement.createMany({ data: accepted });
    return { imported: accepted.length, duplicates, rejected };
  }
  async csv(userId: string, query: MovementQueryDto): Promise<string> {
    const items = await this.prisma.movement.findMany({
      where: this.where(userId, query),
      include: { category: true },
      orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }]
    });
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    return [
      ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto CLP'],
      ...items.map((item) => [
        dateOnly(item.date),
        item.type === 'income' ? 'Ingreso' : 'Gasto',
        item.category.name,
        item.description,
        item.amount
      ])
    ]
      .map((row) => row.map(escape).join(';'))
      .join('\n');
  }
  private where(userId: string, query: MovementQueryDto): Prisma.MovementWhereInput {
    return {
      userId,
      ...(query.search && {
        OR: [
          { description: { contains: query.search, mode: 'insensitive' } },
          { category: { name: { contains: query.search, mode: 'insensitive' } } }
        ]
      }),
      ...((query.from || query.to) && {
        date: {
          ...(query.from && { gte: parseDateOnly(query.from) }),
          ...(query.to && { lte: parseDateOnly(query.to) })
        }
      }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.type && { type: query.type }),
      ...(query.expenseNature && { expenseNature: query.expenseNature })
    };
  }
  private data(userId: string, dto: CreateMovementDto): Prisma.MovementUncheckedCreateInput {
    return {
      userId,
      categoryId: dto.categoryId,
      amount: dto.amount,
      date: parseDateOnly(dto.date),
      description: dto.description.trim(),
      notes: dto.notes?.trim() || null,
      type: dto.type,
      expenseNature: dto.expenseNature,
      recurrence: dto.recurrence,
      recurrenceEnd: dto.recurrenceEnd ? parseDateOnly(dto.recurrenceEnd) : null,
      recurrencePaused: dto.recurrencePaused ?? false,
      recurrenceSourceId: dto.recurrenceSourceId
    };
  }
  private async requireOwned(userId: string, id: string) {
    const item = await this.prisma.movement.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Movimiento no encontrado');
    return item;
  }
  private async requireCategory(userId: string, id: string): Promise<void> {
    if (!(await this.prisma.category.findFirst({ where: { id, userId } })))
      throw new BadRequestException('La categoría no pertenece al usuario');
  }
}
export const serializeMovement = <T extends { date: Date; recurrenceEnd: Date | null }>(
  item: T
) => ({
  ...item,
  date: dateOnly(item.date),
  recurrenceEnd: item.recurrenceEnd ? dateOnly(item.recurrenceEnd) : undefined
});
