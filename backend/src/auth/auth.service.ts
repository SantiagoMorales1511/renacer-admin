import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });

    return {
      accessToken: token,
      user: this.toPublic(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toPublic(user);
  }

  private toPublic(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    canRegisterExpenses: boolean;
    canViewOtherDays: boolean;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      canRegisterExpenses: user.canRegisterExpenses,
      canViewOtherDays: user.canViewOtherDays,
    };
  }
}
