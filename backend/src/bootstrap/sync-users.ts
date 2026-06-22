import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const ADMIN_ID = '90000000-0000-0000-0000-000000000001';
const ASSISTANT_ID = '90000000-0000-0000-0000-000000000002';

const ADMIN_LOGIN = 'renacer';
const ASSISTANT_LOGIN = 'clarena';

const DEMO_USER_EMAILS = ['admin@renacer.com', 'asistente@renacer.com', 'lectura@renacer.com'];

function readPassword(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

async function removeDemoUsers(prisma: PrismaClient) {
  const demoUsers = await prisma.user.findMany({
    where: { email: { in: DEMO_USER_EMAILS } },
    select: { id: true },
  });
  const demoIds = demoUsers.map((u) => u.id);
  if (demoIds.length === 0) return;

  await prisma.auditLog.updateMany({ where: { userId: { in: demoIds } }, data: { userId: null } });
  await prisma.payment.updateMany({ where: { registeredById: { in: demoIds } }, data: { registeredById: null } });
  await prisma.expense.updateMany({ where: { registeredById: { in: demoIds } }, data: { registeredById: null } });
  await prisma.attendance.updateMany({ where: { registeredById: { in: demoIds } }, data: { registeredById: null } });
  await prisma.user.deleteMany({ where: { id: { in: demoIds } } });
}

export async function syncUsers(prisma: PrismaClient): Promise<boolean> {
  const adminPassword = readPassword('SEED_ADMIN_PASSWORD');
  const assistantPassword = readPassword('SEED_ASSISTANT_PASSWORD');

  if (!adminPassword || !assistantPassword) {
    console.warn(
      'Usuarios no sincronizados: define SEED_ADMIN_PASSWORD y SEED_ASSISTANT_PASSWORD en las variables de entorno.',
    );
    return false;
  }

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const assistantHash = await bcrypt.hash(assistantPassword, 10);

  await removeDemoUsers(prisma);

  await prisma.user.upsert({
    where: { email: ADMIN_LOGIN },
    update: {
      name: 'Renacer',
      passwordHash: adminHash,
      role: Role.ADMIN,
      canRegisterExpenses: true,
      canViewOtherDays: true,
    },
    create: {
      id: ADMIN_ID,
      name: 'Renacer',
      email: ADMIN_LOGIN,
      passwordHash: adminHash,
      role: Role.ADMIN,
      canRegisterExpenses: true,
      canViewOtherDays: true,
    },
  });

  await prisma.user.upsert({
    where: { email: ASSISTANT_LOGIN },
    update: {
      name: 'Clarena',
      passwordHash: assistantHash,
      role: Role.ASSISTANT,
      canRegisterExpenses: true,
      canViewOtherDays: false,
    },
    create: {
      id: ASSISTANT_ID,
      name: 'Clarena',
      email: ASSISTANT_LOGIN,
      passwordHash: assistantHash,
      role: Role.ASSISTANT,
      canRegisterExpenses: true,
      canViewOtherDays: false,
    },
  });

  console.log(`Usuarios sincronizados en PostgreSQL: ${ADMIN_LOGIN} (admin), ${ASSISTANT_LOGIN} (assistant)`);
  return true;
}

export const PRODUCTION_LOGINS = {
  admin: ADMIN_LOGIN,
  assistant: ASSISTANT_LOGIN,
} as const;
