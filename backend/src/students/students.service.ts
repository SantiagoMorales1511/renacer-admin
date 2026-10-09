import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { moduleBalance } from '../common/module-balance.util';
import { modulePriceFor } from '../common/student-price.util';
import { CreateStudentDto, StudentPricingDto, UpdateStudentDto } from './dto/student.dto';

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
        modulePrices: true,
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
      const price = modulePriceFor(student, m);
      const { balance } = moduleBalance({ price, paid, attended, dictated });
      return {
        moduleId: m.id,
        number: m.moduleNumber,
        name: m.name,
        baseValue: price,
        groupPrice: m.price,
        hasModulePrice: student.modulePrices.some((p) => p.groupModuleId === m.id),
        paid,
        balance,
        isPaid: paid >= price && price > 0,
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
    const existing = await this.ensureExists(id);
    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
      },
    });

    if (dto.groupId !== undefined && (dto.groupId || null) !== existing.groupId) {
      await this.prisma.studentModulePrice.deleteMany({ where: { studentId: id } });
    }

    return updated;
  }

  async setPricing(id: string, dto: StudentPricingDto) {
    await this.ensureExists(id);
    const price = dto.price ?? null;

    if (dto.scope === 'all') {
      await this.prisma.$transaction([
        this.prisma.student.update({ where: { id }, data: { customPrice: price } }),
        this.prisma.studentModulePrice.deleteMany({ where: { studentId: id } }),
      ]);
      return this.findOne(id);
    }

    if (!dto.groupModuleId) {
      throw new BadRequestException('Falta el módulo');
    }
    const groupModule = await this.prisma.groupModule.findUnique({
      where: { id: dto.groupModuleId },
    });
    if (!groupModule) {
      throw new NotFoundException('Módulo no encontrado');
    }

    if (price === null) {
      await this.prisma.studentModulePrice.deleteMany({
        where: { studentId: id, groupModuleId: dto.groupModuleId },
      });
    } else {
      await this.prisma.studentModulePrice.upsert({
        where: { studentId_groupModuleId: { studentId: id, groupModuleId: dto.groupModuleId } },
        update: { price },
        create: { studentId: id, groupModuleId: dto.groupModuleId, price },
      });
    }

    return this.findOne(id);
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
    return s;
  }
}
