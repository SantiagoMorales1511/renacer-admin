import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { EventsModule } from './websocket/events.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProgramsModule } from './programs/programs.module';
import { GroupsModule } from './groups/groups.module';
import { StudentsModule } from './students/students.module';
import { GroupModulesModule } from './group-modules/group-modules.module';
import { OneDayEventsModule } from './events/events.module';
import { SessionsModule } from './sessions/sessions.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PaymentsModule } from './payments/payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DailyCashModule } from './daily-cash/daily-cash.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    EventsModule,
    AuthModule,
    UsersModule,
    ProgramsModule,
    GroupsModule,
    StudentsModule,
    GroupModulesModule,
    OneDayEventsModule,
    SessionsModule,
    AttendanceModule,
    PaymentsModule,
    ExpensesModule,
    DailyCashModule,
    ReportsModule,
  ],
})
export class AppModule {}
