import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { ModuleTemplatesController } from './module-templates.controller';

@Module({
  controllers: [ProgramsController, ModuleTemplatesController],
  providers: [ProgramsService],
})
export class ProgramsModule {}
