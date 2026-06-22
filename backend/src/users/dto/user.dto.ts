import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsBoolean()
  canRegisterExpenses?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewOtherDays?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  canRegisterExpenses?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewOtherDays?: boolean;
}
