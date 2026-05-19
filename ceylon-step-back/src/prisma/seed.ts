import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  for (const name of ['USER', 'ADMIN', 'SUPER_ADMIN', 'GUIDE', 'TRANSPORT_PROVIDER']) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

