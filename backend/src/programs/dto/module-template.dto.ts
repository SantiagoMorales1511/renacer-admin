import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ModuleStatus } from '@prisma/client';

export class CreateModuleTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  moduleNumber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPrice?: number;

  @IsOptional()
  @IsEnum(ModuleStatus)
  status?: ModuleStatus;
}

export class UpdateModuleTemplateDto {
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
  defaultPrice?: number;

  @IsOptional()
  @IsEnum(ModuleStatus)
  status?: ModuleStatus;
}
