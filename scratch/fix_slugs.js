const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Fixing shop names and slugs for Saniya Fashions...');

  // 1. Rename old/secondary shop slug to free up 'saniya-fashions'
  await prisma.shop.update({
    where: { id: 'cmsfoez15000r67kditvytu6e' },
    data: { slug: 'saniya-fashions-alt', name: 'Saniya Fashions Alt' },
  });

  // 2. Update primary logged-in account (gurvindersingh0218@gmail.com) shop to 'Saniya Fashions' & slug 'saniya-fashions'
  await prisma.shop.update({
    where: { id: 'cmsemlvi3000412oudep8gasg' },
    data: {
      name: 'Saniya Fashions',
      slug: 'saniya-fashions',
      description:
        'Saniya Fashions Luxury Ethnic Couture on Navya Collection. Designer sarees, bridal lehengas, and handcrafted dupattas.',
    },
  });

  console.log(
    '✅ Updated primary shop for gurvindersingh0218@gmail.com to Saniya Fashions (slug: saniya-fashions)!',
  );

  const updatedShops = await prisma.shop.findMany({
    select: { id: true, name: true, slug: true, owner: { select: { email: true } } },
  });
  console.log('=== ALL SHOPS STATUS ===', JSON.stringify(updatedShops, null, 2));
}

main().finally(() => prisma.$disconnect());
