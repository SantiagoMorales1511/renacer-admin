import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  groupId?: string;
}
