import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private audit: AuditService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    const created = await this.usersService.create(dto);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'user', entityId: created.id });
    return created;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    const updated = await this.usersService.update(id, dto);
    await this.audit.log({ userId: user.id, action: 'update', entity: 'user', entityId: id });
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.usersService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'user', entityId: id });
    return res;
  }
}
