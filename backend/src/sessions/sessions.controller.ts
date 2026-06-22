import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';
import { EventsGateway } from '../websocket/events.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(
    private sessionsService: SessionsService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.sessionsService.findAll({ from, to, groupId });
  }

  @Get('upcoming')
  upcoming() {
    return this.sessionsService.upcoming();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSessionDto, @CurrentUser() user: AuthUser) {
    const created = await this.sessionsService.create(dto);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'session', entityId: created.id });
    this.events.emit('session_updated', { id: created.id });
    return created;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    const updated = await this.sessionsService.update(id, dto);
    this.events.emit('session_updated', { id });
    return updated;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}
