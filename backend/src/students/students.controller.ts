import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';
import { EventsGateway } from '../websocket/events.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(
    private studentsService: StudentsService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  @Get()
  findAll(
    @Query('groupId') groupId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll({ groupId, status, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @Roles(Role.ASSISTANT)
  async create(@Body() dto: CreateStudentDto, @CurrentUser() user: AuthUser) {
    const created = await this.studentsService.create(dto);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'student', entityId: created.id });
    this.events.emit('student_created', { id: created.id });
    return created;
  }

  @Patch(':id')
  @Roles(Role.ASSISTANT)
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.studentsService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'student', entityId: id });
    return res;
  }
}
