import { PrismaClient } from '@prisma/client';
import { syncUsers } from '../bootstrap/sync-users';

async function main() {
  const prisma = new PrismaClient();
  try {
    const ok = await syncUsers(prisma);
    if (!ok) process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
