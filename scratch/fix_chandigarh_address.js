const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Setting exact address to Chandigarh, Punjab across all shop records...');

  // Update all Shop records
  await prisma.shop.updateMany({
    data: {
      city: 'Chandigarh',
      state: 'Punjab',
      pincode: '140413',
      fullAddress: 'Chandigarh University, NH-05, Ludhiana',
    },
  });

  // Update all SellerProfile records
  await prisma.sellerProfile.updateMany({
    data: {
      city: 'Chandigarh',
      state: 'Punjab',
      pincode: '140413',
      businessAddress: 'Chandigarh University, NH-05, Ludhiana',
    },
  });

  const shops = await prisma.shop.findMany({
    select: { id: true, name: true, city: true, state: true, fullAddress: true },
  });
  console.log('=== UPDATED SHOPS ===', JSON.stringify(shops, null, 2));
}

main().finally(() => prisma.$disconnect());
