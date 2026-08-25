const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const saniyaShop = await prisma.shop.findFirst({
    where: { slug: 'saniya-fashions' },
    include: { owner: true, sellerProfile: true },
  });
  console.log('--- SANIYA FASHIONS IN DB ---');
  console.log(saniyaShop);

  const jatinShop = await prisma.shop.findFirst({
    where: { slug: 'navya-collection-1' },
    include: { owner: true, sellerProfile: true },
  });
  console.log('--- JATIN SHOP (NAVYA COLLECTION 1) IN DB ---');
  console.log(jatinShop);
}

check().finally(() => prisma.$disconnect());
