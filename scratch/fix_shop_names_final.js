const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.shop.update({
    where: { id: 'cmsfoez15000r67kditvytu6e' },
    data: { slug: 'saniya-fashions-secondary', name: 'Saniya Fashions' },
  });
  console.log('✅ Updated secondary shop slug!');
}

main().finally(() => prisma.$disconnect());
