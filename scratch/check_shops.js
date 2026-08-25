const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== ALL SHOPS ===');
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      state: true,
      email: true,
      phone: true,
      ownerId: true,
      owner: { select: { id: true, name: true, email: true, role: true } },
      sellerProfile: { select: { id: true, businessName: true, legalName: true } },
    },
  });
  console.log(JSON.stringify(shops, null, 2));

  console.log('=== ALL SELLER PROFILES ===');
  const profiles = await prisma.sellerProfile.findMany({
    select: {
      id: true,
      businessName: true,
      legalName: true,
      city: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  console.log(JSON.stringify(profiles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
