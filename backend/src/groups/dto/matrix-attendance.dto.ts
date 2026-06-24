import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SaveMatrixAttendanceDto {
  @IsString()
  studentId: string;

  @IsString()
  groupModuleId: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus | null;
}
