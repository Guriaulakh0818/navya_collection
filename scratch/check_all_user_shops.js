const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      ownedShops: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
        },
      },
    },
  });

  console.log('=== ALL USERS & OWNED SHOPS ===');
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
