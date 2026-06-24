import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GroupsService } from './groups.service';
import { GroupModulesService } from '../group-modules/group-modules.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { SaveMatrixAttendanceDto } from './dto/matrix-attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';
import { EventsGateway } from '../websocket/events.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    private groupModulesService: GroupModulesService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  @Get()
  findAll(@Query('programId') programId?: string) {
    return this.groupsService.findAll(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Get(':id/modules')
  modules(@Param('id') id: string) {
    return this.groupModulesService.findForGroup(id);
  }

  @Get(':id/attendance-matrix')
  attendanceMatrix(@Param('id') id: string) {
    return this.groupsService.attendanceMatrix(id);
  }

  @Patch(':id/attendance-matrix')
  @Roles(Role.ASSISTANT)
  async saveMatrixAttendance(
    @Param('id') id: string,
    @Body() dto: SaveMatrixAttendanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.groupsService.saveMatrixAttendance(id, dto, user.id);
    await this.audit.log({
      userId: user.id,
      action: 'save',
      entity: 'attendance',
      entityId: `${dto.studentId}:${dto.groupModuleId}`,
    });
    this.events.emit('attendance_updated', { groupId: id });
    return result;
  }

  @Post()
  @Roles(Role.ASSISTANT)
  async create(@Body() dto: CreateGroupDto, @CurrentUser() user: AuthUser) {
    const created = await this.groupsService.create(dto);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'group', entityId: created.id });
    this.events.emit('group_created', { id: created.id });
    return created;
  }

  @Patch(':id')
  @Roles(Role.ASSISTANT)
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.groupsService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'group', entityId: id });
    return res;
  }
}
