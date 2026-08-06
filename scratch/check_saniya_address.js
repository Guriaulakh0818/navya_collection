const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst({
    where: {
      OR: [{ slug: 'saniya-fashions' }, { name: { contains: 'Saniya', mode: 'insensitive' } }],
    },
    include: {
      sellerProfile: true,
      addresses: true,
    },
  });

  console.log('=== SANIYA FASHIONS CURRENT DB ADDRESS ===');
  console.log(JSON.stringify(shop, null, 2));

  // Let's update all Saniya Fashions shop records in DB to have accurate address:
  // City: Ludhiana, State: Punjab, Pincode: 140413, FullAddress: Chandigarh University, NH-05, Ludhiana
  await prisma.shop.updateMany({
    where: {
      OR: [{ slug: 'saniya-fashions' }, { name: { contains: 'Saniya', mode: 'insensitive' } }],
    },
    data: {
      city: 'Ludhiana',
      state: 'Punjab',
      pincode: '140413',
      fullAddress: 'Chandigarh University, NH-05, Ludhiana',
    },
  });

  console.log('✅ Updated Saniya Fashions address in database to Ludhiana, Punjab!');
}

main().finally(() => prisma.$disconnect());
