import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ModuleStatus } from '@prisma/client';

export class CreateGroupModuleDto {
  @IsString()
  groupId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  moduleNumber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ModuleStatus)
  status?: ModuleStatus;
}

export class UpdateGroupModuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  moduleNumber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ModuleStatus)
  status?: ModuleStatus;
}
