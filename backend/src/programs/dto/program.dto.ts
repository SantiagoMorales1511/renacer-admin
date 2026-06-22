import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProgramStatus, ProgramType } from '@prisma/client';

export class CreateProgramDto {
  @IsString()
  name: string;

  @IsEnum(ProgramType)
  type: ProgramType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ProgramType)
  type?: ProgramType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}
