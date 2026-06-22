import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyCashService {
  constructor(private prisma: PrismaService) {}

  async summary(from: Date, to: Date) {
    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: from, lte: to } },
      orderBy: { paidAt: 'desc' },
      include: { student: true, group: true, groupModule: true },
    });

    const byMethod: Record<string, number> = {
      EFECTIVO: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0,
      NEQUI: 0,
      DAVIPLATA: 0,
      OTRO: 0,
    };

    let total = 0;
    for (const p of payments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
      total += p.amount;
    }

    return {
      from,
      to,
      total,
      byMethod: byMethod as Record<PaymentMethod, number>,
      payments: payments.map((p) => ({
        id: p.id,
        studentName: p.student?.fullName ?? p.concept ?? 'Otro ingreso',
        groupName: p.group?.name ?? null,
        moduleName: p.groupModule?.name ?? null,
        method: p.method,
        amount: p.amount,
        paidAt: p.paidAt,
      })),
    };
  }

  todayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
}
