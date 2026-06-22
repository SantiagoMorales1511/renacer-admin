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
import { GroupModulesService } from './group-modules.service';
import { CreateGroupModuleDto, UpdateGroupModuleDto } from './dto/group-module.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('group-modules')
export class GroupModulesController {
  constructor(
    private groupModulesService: GroupModulesService,
    private audit: AuditService,
  ) {}

  @Get()
  findAll(@Query('programId') programId?: string, @Query('groupId') groupId?: string) {
    return this.groupModulesService.findAll({ programId, groupId });
  }

  @Get('tree')
  tree() {
    return this.groupModulesService.tree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupModulesService.findOne(id);
  }

  @Post()
  @Roles(Role.ASSISTANT)
  async create(@Body() dto: CreateGroupModuleDto, @CurrentUser() user: AuthUser) {
    const created = await this.groupModulesService.create(dto);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'group_module', entityId: created.id });
    return created;
  }

  @Patch(':id')
  @Roles(Role.ASSISTANT)
  async update(@Param('id') id: string, @Body() dto: UpdateGroupModuleDto, @CurrentUser() user: AuthUser) {
    const updated = await this.groupModulesService.update(id, dto);
    await this.audit.log({ userId: user.id, action: 'update', entity: 'group_module', entityId: id });
    return updated;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.groupModulesService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'group_module', entityId: id });
    return res;
  }
}
