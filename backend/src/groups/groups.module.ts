import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupModulesModule } from '../group-modules/group-modules.module';

@Module({
  imports: [GroupModulesModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
