import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceItemDto {
  @IsString()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  observation?: string;
}

export class SaveAttendanceDto {
  @IsString()
  sessionId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  items: AttendanceItemDto[];
}
