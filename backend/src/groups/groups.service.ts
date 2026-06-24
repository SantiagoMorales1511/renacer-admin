import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, ProgramType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateOnly } from '../common/date.util';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { SaveMatrixAttendanceDto } from './dto/matrix-attendance.dto';

export type MatrixCellStatus =
  | 'ASISTIO_PAGO'
  | 'ASISTIO_NO_PAGO'
  | 'NO_ASISTIO_PAGO'
  | 'NO_ASISTIO_NO_PAGO'
  | 'SIN_REGISTRO';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  findAll(programId?: string) {
    return this.prisma.group.findMany({
      where: programId ? { programId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        program: { select: { id: true, name: true, type: true } },
        _count: { select: { students: true, sessions: true } },
      },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        program: true,
        students: { orderBy: { fullName: 'asc' } },
        modules: { orderBy: { moduleNumber: 'asc' } },
        sessions: {
          orderBy: { date: 'desc' },
          include: { groupModule: true },
        },
      },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }
    return group;
  }

  async attendanceMatrix(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        students: { orderBy: { fullName: 'asc' } },
        sessions: { include: { attendances: true } },
        payments: true,
      },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const modules = await this.prisma.groupModule.findMany({
      where: { groupId: group.id },
      orderBy: { moduleNumber: 'asc' },
    });

    const paymentByStudentModule = new Map<string, number>();
    for (const payment of group.payments) {
      if (!payment.studentId || !payment.groupModuleId) continue;
      const key = `${payment.studentId}:${payment.groupModuleId}`;
      paymentByStudentModule.set(key, (paymentByStudentModule.get(key) ?? 0) + payment.amount);
    }

    // mapa: studentId -> groupModuleId -> estado de asistencia consolidado
    const attendanceByStudent = new Map<string, Map<string, AttendanceStatus>>();
    for (const student of group.students) {
      attendanceByStudent.set(student.id, new Map());
    }

    for (const session of group.sessions) {
      if (!session.groupModuleId) continue;
      for (const att of session.attendances) {
        const moduleMap = attendanceByStudent.get(att.studentId);
        if (!moduleMap) continue;
        const current = moduleMap.get(session.groupModuleId);
        // si en alguna sesión del módulo asistió, prevalece ASISTIO
        if (current === AttendanceStatus.PRESENT) continue;
        moduleMap.set(session.groupModuleId, att.status);
      }
    }

    const rows = group.students.map((student) => ({
      studentId: student.id,
      fullName: student.fullName,
      cells: modules.map((m) => {
        const attendance = attendanceByStudent.get(student.id)?.get(m.id) ?? null;
        return {
          moduleId: m.id,
          attendance,
          status: this.resolveMatrixCellStatus({
            attendance: attendance ?? undefined,
            paid: (paymentByStudentModule.get(`${student.id}:${m.id}`) ?? 0) >= m.price && m.price > 0,
          }),
        };
      }),
    }));

    return {
      group: { id: group.id, name: group.name, programId: group.programId },
      modules: modules.map((m) => ({ id: m.id, number: m.moduleNumber, name: m.name })),
      rows,
    };
  }

  async saveMatrixAttendance(groupId: string, dto: SaveMatrixAttendanceDto, userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, groupId },
    });
    if (!student) {
      throw new BadRequestException('El estudiante no pertenece a este grupo');
    }

    const groupModule = await this.prisma.groupModule.findFirst({
      where: { id: dto.groupModuleId, groupId },
    });
    if (!groupModule) {
      throw new BadRequestException('El módulo no pertenece a este grupo');
    }

    let sessions = await this.prisma.classSession.findMany({
      where: { groupId, groupModuleId: dto.groupModuleId },
    });

    if (dto.status != null && sessions.length === 0) {
      const session = await this.prisma.classSession.create({
        data: {
          groupId,
          groupModuleId: dto.groupModuleId,
          date: groupModule.date ?? new Date(),
          status: 'DONE',
        },
      });
      sessions = [session];
    }

    const sessionIds = sessions.map((s) => s.id);

    if (dto.status == null) {
      if (sessionIds.length > 0) {
        await this.prisma.attendance.deleteMany({
          where: {
            studentId: dto.studentId,
            sessionId: { in: sessionIds },
          },
        });
      }
      return this.attendanceMatrix(groupId);
    }

    await this.prisma.$transaction(
      sessionIds.map((sessionId) =>
        this.prisma.attendance.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId: dto.studentId },
          },
          update: {
            status: dto.status!,
            registeredById: userId,
          },
          create: {
            sessionId,
            studentId: dto.studentId,
            status: dto.status!,
            registeredById: userId,
          },
        }),
      ),
    );

    return this.attendanceMatrix(groupId);
  }

  private resolveMatrixCellStatus(params: {
    attendance?: AttendanceStatus;
    paid: boolean;
  }): MatrixCellStatus {
    if (params.attendance === AttendanceStatus.PRESENT) {
      return params.paid ? 'ASISTIO_PAGO' : 'ASISTIO_NO_PAGO';
    }
    if (params.attendance === AttendanceStatus.ABSENT) {
      return params.paid ? 'NO_ASISTIO_PAGO' : 'NO_ASISTIO_NO_PAGO';
    }
    return 'SIN_REGISTRO';
  }

  async create(dto: CreateGroupDto) {
    const program = await this.prisma.program.findUnique({ where: { id: dto.programId } });
    if (!program) {
      throw new NotFoundException('Programa no encontrado');
    }

    const autoCreate =
      dto.autoCreateModules !== false && program.type !== ProgramType.ONE_DAY_CONSTELLATION_EVENT;

    const startDate = parseDateOnly(dto.startDate);

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          programId: dto.programId,
          name: dto.name,
          cohort: dto.cohort,
          startDate,
          status: dto.status,
          notes: dto.notes,
        },
      });

      if (autoCreate) {
        const templates = await tx.programModuleTemplate.findMany({
          where: { programId: dto.programId, status: 'ACTIVE' },
          orderBy: { moduleNumber: 'asc' },
        });
        if (templates.length > 0) {
          await tx.groupModule.createMany({
            data: templates.map((t, index) => ({
              groupId: group.id,
              programId: dto.programId,
              name: t.name,
              moduleNumber: t.moduleNumber,
              price: dto.defaultModulePrice ?? t.defaultPrice,
              date: startDate ? moduleSaturday(startDate, index) : null,
            })),
          });
        }
      }

      return group;
    });
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.ensureExists(id);
    return this.prisma.group.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate !== undefined ? parseDateOnly(dto.startDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.group.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(id: string) {
    const g = await this.prisma.group.findUnique({ where: { id } });
    if (!g) {
      throw new NotFoundException('Grupo no encontrado');
    }
  }
}

// Calcula la fecha de un módulo: un sábado al mes a partir del sábado de inicio.
// index 0 = fecha de inicio; cada módulo siguiente es un mes después, ajustado al sábado.
function moduleSaturday(start: Date, index: number): Date {
  const d = new Date(start);
  d.setUTCMonth(d.getUTCMonth() + index);
  const day = d.getUTCDay(); // 0=Dom ... 6=Sáb
  const add = (6 - day + 7) % 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d;
}
