const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.shop.updateMany({
    where: {
      name: { contains: 'Alt' },
    },
    data: {
      name: 'Saniya Fashions',
    },
  });

  const shops = await prisma.shop.findMany({ select: { id: true, name: true, slug: true } });
  console.log('=== CLEANED SHOPS ===', JSON.stringify(shops, null, 2));
}

main().finally(() => prisma.$disconnect());
