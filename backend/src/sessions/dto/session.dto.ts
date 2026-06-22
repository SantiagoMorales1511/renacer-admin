import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  groupModuleId?: string;

  @IsOptional()
  @IsString()
  oneDayEventId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  groupModuleId?: string;

  @IsOptional()
  @IsString()
  oneDayEventId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
