import {
  PrismaClient,
  ProgramType,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PROGRAMS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Formación en Constelaciones Familiares y Terapia Sistémica',
    type: ProgramType.TRAINING_CONSTELLATIONS,
    moduleCount: 11,
    defaultPrice: 300000,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Certificación en Biodescodificación',
    type: ProgramType.BIODECODING_CERTIFICATION,
    moduleCount: 6,
    defaultPrice: 300000,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Constelaciones de un día',
    type: ProgramType.ONE_DAY_CONSTELLATION_EVENT,
    moduleCount: 0,
    defaultPrice: 0,
  },
];

const ADMIN_ID = '90000000-0000-0000-0000-000000000001';
const ASSISTANT_ID = '90000000-0000-0000-0000-000000000002';

const DEMO_USER_EMAILS = ['admin@renacer.com', 'asistente@renacer.com', 'lectura@renacer.com'];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name} en backend/.env`);
  }
  return value;
}

async function removeDemoUsers() {
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

async function seedProgramsAndUsers() {
  for (const program of PROGRAMS) {
    await prisma.program.upsert({
      where: { id: program.id },
      update: { name: program.name, type: program.type },
      create: { id: program.id, name: program.name, type: program.type },
    });

    for (let n = 1; n <= program.moduleCount; n++) {
      await prisma.programModuleTemplate.upsert({
        where: { programId_moduleNumber: { programId: program.id, moduleNumber: n } },
        update: { name: `Módulo ${n}`, defaultPrice: program.defaultPrice },
        create: {
          programId: program.id,
          moduleNumber: n,
          name: `Módulo ${n}`,
          defaultPrice: program.defaultPrice,
        },
      });
    }
  }

  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');
  const assistantPassword = requireEnv('SEED_ASSISTANT_PASSWORD');
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const assistantHash = await bcrypt.hash(assistantPassword, 10);

  await removeDemoUsers();

  await prisma.user.upsert({
    where: { email: 'renacer' },
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
      email: 'renacer',
      passwordHash: adminHash,
      role: Role.ADMIN,
      canRegisterExpenses: true,
      canViewOtherDays: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'clarena' },
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
      email: 'clarena',
      passwordHash: assistantHash,
      role: Role.ASSISTANT,
      canRegisterExpenses: true,
      canViewOtherDays: false,
    },
  });
}

async function main() {
  console.log('Programas, plantillas y usuarios...');
  await seedProgramsAndUsers();
  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
