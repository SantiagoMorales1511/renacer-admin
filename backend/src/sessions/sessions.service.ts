import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateOnly } from '../common/date.util';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';

const sessionInclude = {
  group: true,
  groupModule: true,
  oneDayEvent: true,
} as const;

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  findAll(params: { from?: string; to?: string; groupId?: string }) {
    const where: any = {};
    if (params.groupId) where.groupId = params.groupId;
    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date.gte = new Date(`${params.from}T00:00:00.000Z`);
      if (params.to) where.date.lte = new Date(`${params.to}T23:59:59.999Z`);
    }
    return this.prisma.classSession.findMany({
      where,
      orderBy: { date: 'asc' },
      include: sessionInclude,
    });
  }

  upcoming(limit = 5) {
    return this.prisma.classSession.findMany({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'SCHEDULED' },
      orderBy: { date: 'asc' },
      take: limit,
      include: sessionInclude,
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id },
      include: {
        group: { include: { students: { orderBy: { fullName: 'asc' } } } },
        groupModule: true,
        oneDayEvent: true,
        attendances: true,
      },
    });
    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }
    return session;
  }

  async create(dto: CreateSessionDto) {
    const isOther = !!dto.title && !dto.groupId;
    const isRegular = !!dto.groupId && !!dto.groupModuleId;

    if (!isOther && !isRegular) {
      throw new BadRequestException(
        'Indica grupo y módulo para una sesión de formación, o un título para otro tipo de sesión',
      );
    }

    if (isRegular) {
      const groupModule = await this.prisma.groupModule.findUnique({
        where: { id: dto.groupModuleId },
      });
      if (!groupModule || groupModule.groupId !== dto.groupId) {
        throw new BadRequestException('El módulo no pertenece al grupo indicado');
      }
    }

    return this.prisma.classSession.create({
      data: {
        groupId: isRegular ? dto.groupId : null,
        groupModuleId: isRegular ? dto.groupModuleId : null,
        oneDayEventId: dto.oneDayEventId ?? null,
        title: isOther ? dto.title : null,
        date: parseDateOnly(dto.date)!,
        startTime: dto.startTime,
        endTime: dto.endTime,
        place: dto.place,
        status: dto.status,
        notes: dto.notes,
      },
      include: sessionInclude,
    });
  }

  async update(id: string, dto: UpdateSessionDto) {
    await this.ensureExists(id);
    return this.prisma.classSession.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? parseDateOnly(dto.date)! : undefined,
      },
      include: sessionInclude,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.classSession.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(id: string) {
    const s = await this.prisma.classSession.findUnique({ where: { id } });
    if (!s) {
      throw new NotFoundException('Sesión no encontrada');
    }
  }
}
