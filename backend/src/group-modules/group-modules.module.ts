import { Module } from '@nestjs/common';
import { GroupModulesService } from './group-modules.service';
import { GroupModulesController } from './group-modules.controller';

@Module({
  controllers: [GroupModulesController],
  providers: [GroupModulesService],
  exports: [GroupModulesService],
})
export class GroupModulesModule {}
