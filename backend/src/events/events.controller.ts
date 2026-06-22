import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';
import { EventsGateway } from '../websocket/events.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(
    private eventsService: EventsService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  @Get()
  findAll(@Query('programId') programId?: string) {
    return this.eventsService.findAll(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @Roles(Role.ASSISTANT)
  async create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthUser) {
    const created = await this.eventsService.create(dto);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'event', entityId: created.id });
    this.events.emit('event_created', { id: created.id });
    return created;
  }

  @Patch(':id')
  @Roles(Role.ASSISTANT)
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    const updated = await this.eventsService.update(id, dto);
    this.events.emit('event_updated', { id });
    return updated;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.eventsService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'event', entityId: id });
    return res;
  }
}
