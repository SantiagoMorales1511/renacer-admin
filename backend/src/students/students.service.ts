import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { moduleBalance } from '../common/module-balance.util';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  findAll(params: { groupId?: string; status?: string; search?: string }) {
    return this.prisma.student.findMany({
      where: {
        groupId: params.groupId || undefined,
        status: (params.status as any) || undefined,
        fullName: params.search ? { contains: params.search, mode: 'insensitive' } : undefined,
      },
      orderBy: { fullName: 'asc' },
      include: { group: true },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        group: true,
        payments: { include: { groupModule: true }, orderBy: { paidAt: 'desc' } },
        attendances: {
          include: { session: { include: { groupModule: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const modules = student.groupId
      ? await this.prisma.groupModule.findMany({
          where: { groupId: student.groupId },
          orderBy: { moduleNumber: 'asc' },
        })
      : [];

    const attendedModuleIds = new Set(
      student.attendances
        .filter((a) => a.status === 'PRESENT')
        .map((a) => a.session.groupModuleId),
    );

    const now = new Date();
    const moduleSummary = modules.map((m) => {
      const paid = student.payments
        .filter((p) => p.groupModuleId === m.id)
        .reduce((sum, p) => sum + p.amount, 0);
      const attended = attendedModuleIds.has(m.id);
      const dictated = m.date ? m.date <= now : true;
      const { balance } = moduleBalance({ price: m.price, paid, attended, dictated });
      return {
        moduleId: m.id,
        number: m.moduleNumber,
        name: m.name,
        baseValue: m.price,
        paid,
        balance,
        isPaid: paid >= m.price && m.price > 0,
        attended,
        dictated,
      };
    });

    const totalBalance = moduleSummary.reduce((s, m) => s + m.balance, 0);

    return { ...student, moduleSummary, totalBalance };
  }

  create(dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        document: dto.document,
        groupId: dto.groupId,
        status: dto.status,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.ensureExists(id);
    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.student.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(id: string) {
    const s = await this.prisma.student.findUnique({ where: { id } });
    if (!s) {
      throw new NotFoundException('Estudiante no encontrado');
    }
  }
}
