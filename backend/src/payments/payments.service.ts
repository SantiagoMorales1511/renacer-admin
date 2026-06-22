import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  findAll(params: { from?: string; to?: string; studentId?: string; groupId?: string }) {
    const where: any = {};
    if (params.studentId) where.studentId = params.studentId;
    if (params.groupId) where.groupId = params.groupId;
    if (params.from || params.to) {
      where.paidAt = {};
      if (params.from) where.paidAt.gte = new Date(params.from);
      if (params.to) where.paidAt.lte = new Date(params.to);
    }
    return this.prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      include: { student: true, group: true, groupModule: true, oneDayEvent: true },
    });
  }

  async create(dto: CreatePaymentDto, userId: string) {
    const student = dto.studentId
      ? await this.prisma.student.findUnique({ where: { id: dto.studentId } })
      : null;
    const groupId = dto.groupId ?? student?.groupId ?? null;

    if (dto.groupModuleId) {
      const groupModule = await this.prisma.groupModule.findUnique({
        where: { id: dto.groupModuleId },
      });
      if (!groupModule) {
        throw new NotFoundException('Módulo no encontrado');
      }
      if (groupId && groupModule.groupId !== groupId) {
        throw new BadRequestException('El módulo no pertenece al grupo del pago');
      }
    }

    return this.prisma.payment.create({
      data: {
        studentId: dto.studentId ?? null,
        groupId,
        groupModuleId: dto.groupModuleId ?? null,
        sessionId: dto.sessionId,
        oneDayEventId: dto.oneDayEventId ?? null,
        concept: dto.concept ?? null,
        amount: dto.amount,
        method: dto.method,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        observation: dto.observation,
        receiptUrl: dto.receiptUrl,
        registeredById: userId,
      },
      include: { student: true, group: true, groupModule: true, oneDayEvent: true },
    });
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const existing = await this.prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Pago no encontrado');
    }

    const data: any = {};

    if (dto.studentId !== undefined) {
      const studentId = dto.studentId || null;
      data.studentId = studentId;
      const student = studentId
        ? await this.prisma.student.findUnique({ where: { id: studentId } })
        : null;
      data.groupId = dto.groupId ?? student?.groupId ?? null;
    } else if (dto.groupId !== undefined) {
      data.groupId = dto.groupId || null;
    }

    if (dto.groupModuleId !== undefined) {
      const groupModuleId = dto.groupModuleId || null;
      if (groupModuleId) {
        const groupModule = await this.prisma.groupModule.findUnique({
          where: { id: groupModuleId },
        });
        if (!groupModule) {
          throw new NotFoundException('Módulo no encontrado');
        }
        const groupId = data.groupId ?? existing.groupId;
        if (groupId && groupModule.groupId !== groupId) {
          throw new BadRequestException('El módulo no pertenece al grupo del pago');
        }
      }
      data.groupModuleId = groupModuleId;
    }

    if (dto.oneDayEventId !== undefined) data.oneDayEventId = dto.oneDayEventId || null;
    if (dto.concept !== undefined) data.concept = dto.concept || null;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.method !== undefined) data.method = dto.method;
    if (dto.paidAt !== undefined) data.paidAt = new Date(dto.paidAt);
    if (dto.observation !== undefined) data.observation = dto.observation || null;

    return this.prisma.payment.update({
      where: { id },
      data,
      include: { student: true, group: true, groupModule: true, oneDayEvent: true },
    });
  }

  async remove(id: string) {
    const p = await this.prisma.payment.findUnique({ where: { id } });
    if (!p) {
      throw new NotFoundException('Pago no encontrado');
    }
    await this.prisma.payment.delete({ where: { id } });
    return { ok: true };
  }
}
