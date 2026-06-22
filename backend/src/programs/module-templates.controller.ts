import { Body, Controller, Delete, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProgramsService } from './programs.service';
import { UpdateModuleTemplateDto } from './dto/module-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('program-module-templates')
export class ModuleTemplatesController {
  constructor(private programsService: ProgramsService) {}

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateModuleTemplateDto) {
    return this.programsService.updateTemplate(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.programsService.removeTemplate(id);
  }
}
