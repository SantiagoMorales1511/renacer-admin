import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProgramType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { CreateModuleTemplateDto, UpdateModuleTemplateDto } from './dto/module-template.dto';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.program.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { groups: true, moduleTemplates: true, events: true } },
      },
    });
  }

  async findOne(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        moduleTemplates: { orderBy: { moduleNumber: 'asc' } },
        groups: {
          orderBy: { name: 'asc' },
          include: { _count: { select: { students: true, sessions: true } } },
        },
      },
    });
    if (!program) {
      throw new NotFoundException('Programa no encontrado');
    }

    if (program.type === ProgramType.ONE_DAY_CONSTELLATION_EVENT) {
      const events = await this.prisma.oneDayEvent.findMany({
        where: { programId: id },
        orderBy: { date: 'desc' },
      });
      return { ...program, events };
    }

    return program;
  }

  create(dto: CreateProgramDto) {
    return this.prisma.program.create({ data: dto });
  }

  async update(id: string, dto: UpdateProgramDto) {
    await this.ensureExists(id);
    return this.prisma.program.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.program.delete({ where: { id } });
    return { ok: true };
  }

  listTemplates(programId: string) {
    return this.prisma.programModuleTemplate.findMany({
      where: { programId },
      orderBy: { moduleNumber: 'asc' },
    });
  }

  async createTemplate(programId: string, dto: CreateModuleTemplateDto) {
    await this.ensureExists(programId);
    const moduleNumber = dto.moduleNumber ?? (await this.nextTemplateNumber(programId));
    const exists = await this.prisma.programModuleTemplate.findUnique({
      where: { programId_moduleNumber: { programId, moduleNumber } },
    });
    if (exists) {
      throw new ConflictException(`Ya existe la plantilla número ${moduleNumber} en este programa`);
    }
    return this.prisma.programModuleTemplate.create({
      data: {
        programId,
        moduleNumber,
        name: dto.name,
        defaultPrice: dto.defaultPrice ?? 0,
        status: dto.status,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateModuleTemplateDto) {
    const t = await this.prisma.programModuleTemplate.findUnique({ where: { id } });
    if (!t) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    if (dto.moduleNumber && dto.moduleNumber !== t.moduleNumber) {
      const clash = await this.prisma.programModuleTemplate.findUnique({
        where: { programId_moduleNumber: { programId: t.programId, moduleNumber: dto.moduleNumber } },
      });
      if (clash) {
        throw new ConflictException(`Ya existe la plantilla número ${dto.moduleNumber} en este programa`);
      }
    }
    return this.prisma.programModuleTemplate.update({ where: { id }, data: dto });
  }

  async removeTemplate(id: string) {
    const t = await this.prisma.programModuleTemplate.findUnique({ where: { id } });
    if (!t) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    await this.prisma.programModuleTemplate.delete({ where: { id } });
    return { ok: true };
  }

  private async nextTemplateNumber(programId: string) {
    const last = await this.prisma.programModuleTemplate.findFirst({
      where: { programId },
      orderBy: { moduleNumber: 'desc' },
    });
    return (last?.moduleNumber ?? 0) + 1;
  }

  private async ensureExists(id: string) {
    const p = await this.prisma.program.findUnique({ where: { id } });
    if (!p) {
      throw new NotFoundException('Programa no encontrado');
    }
  }
}
