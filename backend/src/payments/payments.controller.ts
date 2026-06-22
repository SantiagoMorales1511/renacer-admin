import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';
import { EventsGateway } from '../websocket/events.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('studentId') studentId?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.paymentsService.findAll({ from, to, studentId, groupId });
  }

  @Post()
  async create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    const created = await this.paymentsService.create(dto, user.id);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'payment', entityId: created.id });
    this.events.emit('payment_created', { id: created.id });
    return created;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.paymentsService.update(id, dto);
    await this.audit.log({ userId: user.id, action: 'update', entity: 'payment', entityId: id });
    this.events.emit('payment_updated', { id });
    return updated;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.paymentsService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'payment', entityId: id });
    return res;
  }
}
