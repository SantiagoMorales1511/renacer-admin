import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(2)
  email: string;

  @IsString()
  @MinLength(4)
  password: string;
}
