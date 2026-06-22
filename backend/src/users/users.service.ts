import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  canRegisterExpenses: true,
  canViewOtherDays: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        canRegisterExpenses: dto.canRegisterExpenses ?? false,
        canViewOtherDays: dto.canViewOtherDays ?? false,
      },
      select: publicSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id }, data: dto, select: publicSelect });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }
}
