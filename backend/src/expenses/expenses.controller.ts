import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';
import { EventsGateway } from '../websocket/events.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(
    private expensesService: ExpensesService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.expensesService.findAll({ from, to, groupId });
  }

  @Post()
  @Permissions('canRegisterExpenses')
  async create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    const created = await this.expensesService.create(dto, user.id);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'expense', entityId: created.id });
    this.events.emit('expense_created', { id: created.id });
    return created;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.expensesService.update(id, dto);
    await this.audit.log({ userId: user.id, action: 'update', entity: 'expense', entityId: id });
    this.events.emit('expense_updated', { id });
    return updated;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.expensesService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'expense', entityId: id });
    this.events.emit('expense_deleted', { id });
    return res;
  }
}
