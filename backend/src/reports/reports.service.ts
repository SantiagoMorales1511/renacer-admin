import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { moduleBalance } from '../common/module-balance.util';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfYear(d = new Date()) {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async sumPayments(from: Date, to: Date) {
    const res = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: from, lte: to } },
    });
    return res._sum.amount ?? 0;
  }

  private async sumExpenses(from: Date, to: Date) {
    const res = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: from, lte: to } },
    });
    return res._sum.amount ?? 0;
  }

  // Deuda visible si hay saldo pendiente y (hay abono vinculado al módulo o asistió y ya se dictó).
  private async studentModuleBalances() {
    const now = new Date();
    const [students, groupModules, payments, attendances] = await Promise.all([
      this.prisma.student.findMany({ where: { status: 'ACTIVE' }, include: { group: true } }),
      this.prisma.groupModule.findMany({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.findMany({ where: { studentId: { not: null } } }),
      this.prisma.attendance.findMany({
        where: { status: 'PRESENT' },
        include: { session: { select: { groupModuleId: true } } },
      }),
    ]);

    const modulesByGroup = new Map<string, typeof groupModules>();
    for (const m of groupModules) {
      const list = modulesByGroup.get(m.groupId) ?? [];
      list.push(m);
      modulesByGroup.set(m.groupId, list);
    }

    const attendedKey = new Set<string>();
    for (const a of attendances) {
      const moduleId = a.session?.groupModuleId;
      if (moduleId) attendedKey.add(`${a.studentId}:${moduleId}`);
    }

    const paidByStudentModule = new Map<string, number>();
    for (const p of payments) {
      if (!p.studentId || !p.groupModuleId) continue;
      const key = `${p.studentId}:${p.groupModuleId}`;
      paidByStudentModule.set(key, (paidByStudentModule.get(key) ?? 0) + p.amount);
    }

    return students.map((s) => {
      const modules = s.groupId ? modulesByGroup.get(s.groupId) ?? [] : [];
      const moduleRows = modules.map((m) => {
        const key = `${s.id}:${m.id}`;
        const paid = paidByStudentModule.get(key) ?? 0;
        const dictated = m.date ? m.date <= now : true;
        const attended = attendedKey.has(key);
        const { balance } = moduleBalance({ price: m.price, paid, attended, dictated });
        return {
          moduleId: m.id,
          moduleNumber: m.moduleNumber,
          moduleName: m.name,
          moduleDate: m.date,
          baseValue: m.price,
          paid,
          balance,
        };
      });
      return {
        id: s.id,
        fullName: s.fullName,
        groupId: s.groupId,
        groupName: s.group?.name ?? null,
        phone: s.phone ?? null,
        modules: moduleRows,
      };
    });
  }

  private async studentBalances() {
    const students = await this.studentModuleBalances();
    return students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      groupName: s.groupName,
      paid: s.modules.reduce((sum, m) => sum + m.paid, 0),
      balance: s.modules.reduce((sum, m) => sum + m.balance, 0),
    }));
  }

  async cartera(groupId?: string) {
    const students = await this.studentModuleBalances();

    const items = students
      .filter((s) => !groupId || s.groupId === groupId)
      .flatMap((s) =>
        s.modules
          .filter((m) => m.balance > 0)
          .map((m) => ({
            studentId: s.id,
            fullName: s.fullName,
            groupId: s.groupId,
            groupName: s.groupName,
            phone: s.phone,
            moduleId: m.moduleId,
            moduleNumber: m.moduleNumber,
            moduleName: m.moduleName,
            moduleDate: m.moduleDate,
            baseValue: m.baseValue,
            paid: m.paid,
            balance: m.balance,
            paymentStatus: m.paid > 0 ? 'partial' : 'none',
          })),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName) || a.moduleNumber - b.moduleNumber);

    const totalDebt = items.reduce((s, i) => s + i.balance, 0);
    const debtorCount = new Set(items.map((i) => i.studentId)).size;

    return {
      summary: {
        totalDebt,
        debtorCount,
        pendingModulesCount: items.length,
      },
      items,
    };
  }

  async dashboard() {
    const now = new Date();
    const [
      nextSession,
      activeStudents,
      incomeToday,
      incomeMonth,
      incomeYear,
      expensesMonth,
      groups,
    ] = await Promise.all([
      this.prisma.classSession.findFirst({
        where: { date: { gte: startOfDay() }, status: 'SCHEDULED' },
        orderBy: { date: 'asc' },
        include: { group: true, groupModule: true, oneDayEvent: true },
      }),
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.sumPayments(startOfDay(), endOfDay()),
      this.sumPayments(startOfMonth(), endOfMonth()),
      this.sumPayments(startOfYear(), endOfDay()),
      this.sumExpenses(startOfMonth(), endOfMonth()),
      this.prisma.group.findMany({ include: { _count: { select: { students: true } } } }),
    ]);

    const balances = await this.studentBalances();
    const debtors = balances.filter((b) => b.balance > 0);
    const pendingTotal = debtors.reduce((s, b) => s + b.balance, 0);

    const groupSummary = await Promise.all(
      groups.map(async (g) => {
        const income = (
          await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { groupId: g.id } })
        )._sum.amount ?? 0;
        return { id: g.id, name: g.name, students: g._count.students, income };
      }),
    );

    return {
      nextSession,
      activeStudents,
      pendingPaymentsCount: debtors.length,
      pendingPaymentsTotal: pendingTotal,
      incomeToday,
      incomeMonth,
      incomeYear,
      expensesMonth,
      estimatedProfit: incomeMonth - expensesMonth,
      groupSummary,
      now,
    };
  }

  async assistantHome() {
    const [nextSession, todaySessions, paymentsToday, activeStudents] = await Promise.all([
      this.prisma.classSession.findFirst({
        where: { date: { gte: startOfDay() }, status: 'SCHEDULED' },
        orderBy: { date: 'asc' },
        include: { group: true, groupModule: true, oneDayEvent: true },
      }),
      this.prisma.classSession.findMany({
        where: { date: { gte: startOfDay(), lte: endOfDay() } },
        orderBy: { date: 'asc' },
        include: { group: { include: { _count: { select: { students: true } } } }, groupModule: true, attendances: true },
      }),
      this.prisma.payment.findMany({
        where: { paidAt: { gte: startOfDay(), lte: endOfDay() } },
        include: { student: true, groupModule: true },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
    ]);

    const incomeToday = paymentsToday.reduce((s, p) => s + p.amount, 0);

    const pendingAttendance = todaySessions
      .filter((s) => s.group && s.groupModule)
      .map((s) => ({
        sessionId: s.id,
        group: s.group!.name,
        module: s.groupModule!.name,
        totalStudents: s.group!._count.students,
        registered: s.attendances.length,
        pending: Math.max(s.group!._count.students - s.attendances.length, 0),
      }))
      .filter((s) => s.pending > 0);

    return {
      nextSession,
      todaySessions: todaySessions.map((s) => ({
        id: s.id,
        title: s.title,
        group: s.group?.name ?? null,
        module: s.groupModule?.name ?? null,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        place: s.place,
        status: s.status,
      })),
      pendingAttendance,
      paymentsToday: paymentsToday.map((p) => ({
        id: p.id,
        studentName: p.student?.fullName ?? p.concept ?? 'Otro ingreso',
        moduleName: p.groupModule?.name ?? null,
        method: p.method,
        amount: p.amount,
        paidAt: p.paidAt,
      })),
      incomeToday,
      activeStudents,
    };
  }

  async cashFlow(fromStr?: string, toStr?: string) {
    const from = fromStr ? new Date(`${fromStr}T00:00:00`) : startOfMonth();
    const to = toStr ? new Date(`${toStr}T23:59:59`) : endOfMonth();

    const [payments, expenses, groups] = await Promise.all([
      this.prisma.payment.findMany({ where: { paidAt: { gte: from, lte: to } }, include: { group: true } }),
      this.prisma.expense.findMany({ where: { date: { gte: from, lte: to } }, include: { group: true } }),
      this.prisma.group.findMany(),
    ]);

    const income = payments.reduce((s, p) => s + p.amount, 0);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

    const incomeByGroup = groups.map((g) => ({
      group: g.name,
      income: payments.filter((p) => p.groupId === g.id).reduce((s, p) => s + p.amount, 0),
      expenses: expenses.filter((e) => e.groupId === g.id).reduce((s, e) => s + e.amount, 0),
    })).map((r) => ({ ...r, profit: r.income - r.expenses }));

    const expensesByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {});

    const balances = await this.studentBalances();
    const pending = balances.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0);

    return {
      from,
      to,
      income,
      expenses: expenseTotal,
      profit: income - expenseTotal,
      pending,
      incomeByGroup,
      expensesByCategory,
    };
  }

  async reports(fromStr?: string, toStr?: string) {
    const from = fromStr ? new Date(`${fromStr}T00:00:00`) : startOfMonth();
    const to = toStr ? new Date(`${toStr}T23:59:59`) : endOfMonth();

    const balances = await this.studentBalances();
    const debtors = balances.filter((b) => b.balance > 0);

    const attendances = await this.prisma.attendance.findMany({
      where: { status: 'PRESENT' },
      include: { session: true },
    });
    const payments = await this.prisma.payment.findMany();

    const paidStudentModule = new Set(
      payments
        .filter((p) => p.studentId && p.groupModuleId)
        .map((p) => `${p.studentId}:${p.groupModuleId}`),
    );
    const attendedStudentModule = new Set(
      attendances
        .filter((a) => a.session.groupModuleId)
        .map((a) => `${a.studentId}:${a.session.groupModuleId}`),
    );

    const studentsMap = new Map(
      (await this.prisma.student.findMany({ include: { group: true } })).map((s) => [s.id, s]),
    );
    const modulesMap = new Map(
      (await this.prisma.groupModule.findMany()).map((m) => [m.id, m]),
    );

    const attendedNotPaid: any[] = [];
    for (const key of attendedStudentModule) {
      if (!paidStudentModule.has(key)) {
        const [studentId, moduleId] = key.split(':');
        const st = studentsMap.get(studentId);
        attendedNotPaid.push({
          studentName: st?.fullName,
          groupName: st?.group?.name ?? null,
          moduleName: modulesMap.get(moduleId)?.name,
        });
      }
    }

    const paidNotAttended: any[] = [];
    for (const key of paidStudentModule) {
      if (!attendedStudentModule.has(key)) {
        const [studentId, moduleId] = key.split(':');
        const st = studentsMap.get(studentId);
        paidNotAttended.push({
          studentName: st?.fullName,
          groupName: st?.group?.name ?? null,
          moduleName: modulesMap.get(moduleId)?.name,
        });
      }
    }

    const paymentsInRange = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: from, lte: to } },
    });
    const expensesInRange = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: from, lte: to } },
    });

    return {
      debtors,
      attendedNotPaid,
      paidNotAttended,
      paymentsTotal: paymentsInRange._sum.amount ?? 0,
      expensesTotal: expensesInRange._sum.amount ?? 0,
      from,
      to,
    };
  }
}
