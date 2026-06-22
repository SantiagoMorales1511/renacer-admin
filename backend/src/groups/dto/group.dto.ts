import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { GroupStatus } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  programId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  cohort?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultModulePrice?: number;

  @IsOptional()
  @IsBoolean()
  autoCreateModules?: boolean;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  cohort?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
