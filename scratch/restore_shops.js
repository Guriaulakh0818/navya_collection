const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Restoring distinct shop names in PostgreSQL database...');

  // 1. Restore Navya Collection (owned by gurvindersingh0218@gmail.com)
  await prisma.shop.update({
    where: { id: 'cmsemlvi3000412oudep8gasg' },
    data: {
      name: 'Navya Collection',
      slug: 'navya-collection',
      description:
        'Navya Collection Flagship Store. Luxury Indian ethnic couture, handcrafted sarees, anarkalis and lehengas.',
      city: 'Chandigarh',
      state: 'Punjab',
      fullAddress: 'Chandigarh University, NH-05, Ludhiana',
    },
  });

  // 2. Restore Saniya Fashions (owned by gurvinderaulakh497@gmail.com)
  await prisma.shop.update({
    where: { id: 'cmsfoez15000r67kditvytu6e' },
    data: {
      name: 'Saniya Fashions',
      slug: 'saniya-fashions',
      description:
        'Saniya Fashions Luxury Ethnic Couture on Navya Collection. Designer sarees, bridal lehengas, and handcrafted dupattas.',
      city: 'Chandigarh',
      state: 'Punjab',
      fullAddress: 'Chandigarh University, NH-05, Ludhiana',
    },
  });

  const shops = await prisma.shop.findMany({
    select: { id: true, name: true, slug: true, owner: { select: { email: true } } },
  });

  console.log('=== RESTORED DISTINCT SHOPS ===');
  console.log(JSON.stringify(shops, null, 2));
}

main().finally(() => prisma.$disconnect());
