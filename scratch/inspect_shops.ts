import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  console.log('=== ALL SHOPS IN DATABASE ===');
  console.log(JSON.stringify(shops, null, 2));

  // Also check if any shop has slug 'navya-collection' and update it to 'saniya-fashions' if name is 'Saniya Fashions'
  for (const shop of shops) {
    if (shop.name.toLowerCase().includes('saniya') && shop.slug !== 'saniya-fashions') {
      console.log(`Fixing shop ${shop.id} slug from '${shop.slug}' to 'saniya-fashions'...`);
      await prisma.shop.update({
        where: { id: shop.id },
        data: { slug: 'saniya-fashions', name: 'Saniya Fashions' },
      });
    }
  }

  const updatedShops = await prisma.shop.findMany({
    select: { id: true, name: true, slug: true },
  });
  console.log('=== UPDATED SHOPS ===', JSON.stringify(updatedShops, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
