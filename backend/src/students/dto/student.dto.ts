import { IsDateString, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsDateString()
  enrolledAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsDateString()
  enrolledAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
