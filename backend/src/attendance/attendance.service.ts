import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async save(dto: SaveAttendanceDto, userId: string) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.attendance.upsert({
          where: {
            sessionId_studentId: { sessionId: dto.sessionId, studentId: item.studentId },
          },
          update: {
            status: item.status,
            observation: item.observation,
            registeredById: userId,
          },
          create: {
            sessionId: dto.sessionId,
            studentId: item.studentId,
            status: item.status,
            observation: item.observation,
            registeredById: userId,
          },
        }),
      ),
    );

    return this.prisma.attendance.findMany({ where: { sessionId: dto.sessionId } });
  }
}
