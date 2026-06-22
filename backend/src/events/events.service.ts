import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  findAll(programId?: string) {
    return this.prisma.oneDayEvent.findMany({
      where: programId ? { programId } : undefined,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.oneDayEvent.findUnique({
      where: { id },
      include: { program: true },
    });
    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }
    return event;
  }

  create(dto: CreateEventDto) {
    return this.prisma.oneDayEvent.create({
      data: {
        programId: dto.programId,
        title: dto.title,
        date: new Date(dto.date),
        attendeesCount: dto.attendeesCount ?? 0,
        constellatedCount: dto.constellatedCount ?? 0,
        observations: dto.observations,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.ensureExists(id);
    return this.prisma.oneDayEvent.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.oneDayEvent.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(id: string) {
    const e = await this.prisma.oneDayEvent.findUnique({ where: { id } });
    if (!e) {
      throw new NotFoundException('Evento no encontrado');
    }
  }
}
