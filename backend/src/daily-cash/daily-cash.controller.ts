import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DailyCashService } from './daily-cash.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-cash')
export class DailyCashController {
  constructor(private dailyCashService: DailyCashService) {}

  @Get()
  summary(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const canPickRange = user.role === Role.ADMIN || user.canViewOtherDays;
    const today = this.dailyCashService.todayRange();

    if (!canPickRange || (!from && !to)) {
      return this.dailyCashService.summary(today.start, today.end);
    }

    const start = from ? new Date(`${from}T00:00:00`) : today.start;
    const end = to ? new Date(`${to}T23:59:59`) : today.end;
    return this.dailyCashService.summary(start, end);
  }
}
