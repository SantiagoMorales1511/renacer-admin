import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProgramsService } from './programs.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { CreateModuleTemplateDto, UpdateModuleTemplateDto } from './dto/module-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs')
export class ProgramsController {
  constructor(
    private programsService: ProgramsService,
    private audit: AuditService,
  ) {}

  @Get()
  findAll() {
    return this.programsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findOne(id);
  }

  @Get(':id/module-templates')
  listTemplates(@Param('id') id: string) {
    return this.programsService.listTemplates(id);
  }

  @Post(':id/module-templates')
  @Roles(Role.ADMIN)
  async createTemplate(@Param('id') id: string, @Body() dto: CreateModuleTemplateDto) {
    return this.programsService.createTemplate(id, dto);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateProgramDto, @CurrentUser() user: AuthUser) {
    const created = await this.programsService.create(dto);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'program', entityId: created.id });
    return created;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.programsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.programsService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'program', entityId: id });
    return res;
  }
}
