import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { OneDayEventStatus } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  programId: string;

  @IsString()
  title: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  attendeesCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  constellatedCount?: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsEnum(OneDayEventStatus)
  status?: OneDayEventStatus;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  attendeesCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  constellatedCount?: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsEnum(OneDayEventStatus)
  status?: OneDayEventStatus;
}
