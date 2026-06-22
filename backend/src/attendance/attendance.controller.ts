import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { SaveAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';
import { EventsGateway } from '../websocket/events.gateway';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  @Post()
  async save(@Body() dto: SaveAttendanceDto, @CurrentUser() user: AuthUser) {
    const result = await this.attendanceService.save(dto, user.id);
    await this.audit.log({ userId: user.id, action: 'save', entity: 'attendance', entityId: dto.sessionId });
    this.events.emit('attendance_updated', { sessionId: dto.sessionId });
    return result;
  }
}
