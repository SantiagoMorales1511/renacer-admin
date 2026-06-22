import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN)
  dashboard() {
    return this.reportsService.dashboard();
  }

  @Get('assistant-home')
  assistantHome() {
    return this.reportsService.assistantHome();
  }

  @Get('cartera')
  cartera(@Query('groupId') groupId?: string) {
    return this.reportsService.cartera(groupId);
  }

  @Get('cash-flow')
  @Roles(Role.ADMIN)
  cashFlow(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.cashFlow(from, to);
  }

  @Get()
  @Roles(Role.ADMIN)
  reports(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.reports(from, to);
  }
}
