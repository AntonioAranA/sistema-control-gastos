import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    });
  }
  async create(userId: string, dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const slug = slugify(name);
    if (await this.prisma.category.findUnique({ where: { userId_slug: { userId, slug } } }))
      throw new ConflictException('Ya existe una categoría con ese nombre');
    return this.prisma.category.create({ data: { userId, name, slug } });
  }
  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.requireOwned(userId, id);
    if (category.isDefault)
      throw new ConflictException('Las categorías iniciales no se pueden editar');
    const name = dto.name.trim();
    return this.prisma.category.update({ where: { id }, data: { name, slug: slugify(name) } });
  }
  async remove(userId: string, id: string): Promise<void> {
    const category = await this.requireOwned(userId, id);
    if (category.isDefault)
      throw new ConflictException('Las categorías iniciales no se pueden eliminar');
    if (await this.prisma.movement.count({ where: { userId, categoryId: id } }))
      throw new ConflictException('No se puede eliminar una categoría con movimientos asociados');
    if (await this.prisma.categoryBudget.count({ where: { categoryId: id, budget: { userId } } }))
      throw new ConflictException('No se puede eliminar una categoría utilizada en presupuestos');
    await this.prisma.category.delete({ where: { id } });
  }
  private async requireOwned(userId: string, id: string) {
    const item = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('Categoría no encontrada');
    return item;
  }
}
