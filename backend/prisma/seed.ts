import { PrismaClient, ProgramType } from '@prisma/client';
import { syncUsers } from '../src/bootstrap/sync-users';

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

async function seedPrograms() {
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
}

async function main() {
  console.log('Programas y plantillas...');
  await seedPrograms();
  console.log('Usuarios...');
  const ok = await syncUsers(prisma);
  if (!ok) {
    throw new Error('Faltan SEED_ADMIN_PASSWORD y SEED_ASSISTANT_PASSWORD');
  }
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
