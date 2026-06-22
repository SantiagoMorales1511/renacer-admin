import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  findAll(params: { from?: string; to?: string; groupId?: string }) {
    const where: any = {};
    if (params.groupId) where.groupId = params.groupId;
    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date.gte = new Date(params.from);
      if (params.to) where.date.lte = new Date(params.to);
    }
    return this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { group: true },
    });
  }

  create(dto: CreateExpenseDto, userId: string) {
    return this.prisma.expense.create({
      data: {
        date: dto.date ? new Date(dto.date) : new Date(),
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        groupId: dto.groupId,
        sessionId: dto.sessionId,
        registeredById: userId,
      },
      include: { group: true },
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Gasto no encontrado');
    }

    const data: any = {};
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.groupId !== undefined) data.groupId = dto.groupId || null;

    return this.prisma.expense.update({
      where: { id },
      data,
      include: { group: true },
    });
  }

  async remove(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }
    await this.prisma.expense.delete({ where: { id } });
    return { ok: true };
  }
}
