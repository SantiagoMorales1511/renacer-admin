import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProgramType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateOnly } from '../common/date.util';
import { CreateGroupModuleDto, UpdateGroupModuleDto } from './dto/group-module.dto';

@Injectable()
export class GroupModulesService {
  constructor(private prisma: PrismaService) {}

  findAll(params: { programId?: string; groupId?: string }) {
    return this.prisma.groupModule.findMany({
      where: {
        programId: params.programId || undefined,
        groupId: params.groupId || undefined,
      },
      orderBy: [{ groupId: 'asc' }, { moduleNumber: 'asc' }],
      include: {
        group: { select: { id: true, name: true } },
        program: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async tree() {
    const programs = await this.prisma.program.findMany({
      where: { type: { not: ProgramType.ONE_DAY_CONSTELLATION_EVENT } },
      orderBy: { createdAt: 'asc' },
      include: {
        groups: {
          orderBy: { name: 'asc' },
          include: {
            modules: { orderBy: { moduleNumber: 'asc' } },
          },
        },
      },
    });
    return programs;
  }

  async findForGroup(groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }
    const modules = await this.prisma.groupModule.findMany({
      where: { groupId },
      orderBy: { moduleNumber: 'asc' },
    });
    return Promise.all(modules.map((m) => this.withCounts(m)));
  }

  async findOne(id: string) {
    const m = await this.prisma.groupModule.findUnique({
      where: { id },
      include: {
        group: { select: { id: true, name: true } },
        program: { select: { id: true, name: true, type: true } },
      },
    });
    if (!m) {
      throw new NotFoundException('Módulo no encontrado');
    }
    return this.withCounts(m);
  }

  async create(dto: CreateGroupModuleDto) {
    const group = await this.prisma.group.findUnique({ where: { id: dto.groupId } });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const moduleNumber = dto.moduleNumber ?? (await this.nextNumber(dto.groupId));

    const exists = await this.prisma.groupModule.findUnique({
      where: { groupId_moduleNumber: { groupId: dto.groupId, moduleNumber } },
    });
    if (exists) {
      throw new ConflictException(`Ya existe el módulo número ${moduleNumber} en este grupo`);
    }

    return this.prisma.groupModule.create({
      data: {
        groupId: dto.groupId,
        programId: group.programId,
        name: dto.name,
        moduleNumber,
        price: dto.price ?? 0,
        date: parseDateOnly(dto.date),
        description: dto.description,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateGroupModuleDto) {
    const m = await this.prisma.groupModule.findUnique({ where: { id } });
    if (!m) {
      throw new NotFoundException('Módulo no encontrado');
    }

    if (dto.moduleNumber && dto.moduleNumber !== m.moduleNumber) {
      const clash = await this.prisma.groupModule.findUnique({
        where: { groupId_moduleNumber: { groupId: m.groupId, moduleNumber: dto.moduleNumber } },
      });
      if (clash) {
        throw new ConflictException(`Ya existe el módulo número ${dto.moduleNumber} en este grupo`);
      }
    }

    return this.prisma.groupModule.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date !== undefined ? parseDateOnly(dto.date) : undefined,
      },
    });
  }

  async remove(id: string) {
    const m = await this.prisma.groupModule.findUnique({ where: { id } });
    if (!m) {
      throw new NotFoundException('Módulo no encontrado');
    }
    const counts = await this.relatedCounts(id);
    if (counts.sessions > 0 || counts.payments > 0 || counts.attendances > 0) {
      throw new ConflictException(
        'No se puede eliminar un módulo con sesiones, pagos o asistencias asociadas. Desactívalo en su lugar.',
      );
    }
    await this.prisma.groupModule.delete({ where: { id } });
    return { ok: true };
  }

  private async nextNumber(groupId: string) {
    const last = await this.prisma.groupModule.findFirst({
      where: { groupId },
      orderBy: { moduleNumber: 'desc' },
    });
    return (last?.moduleNumber ?? 0) + 1;
  }

  private async relatedCounts(id: string) {
    const [sessions, payments, attendances] = await Promise.all([
      this.prisma.classSession.count({ where: { groupModuleId: id } }),
      this.prisma.payment.count({ where: { groupModuleId: id } }),
      this.prisma.attendance.count({ where: { session: { groupModuleId: id } } }),
    ]);
    return { sessions, payments, attendances };
  }

  private async withCounts<T extends { id: string }>(m: T) {
    const counts = await this.relatedCounts(m.id);
    return { ...m, counts };
  }
}
