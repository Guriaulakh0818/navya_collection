const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Upserting NAVYA15VIP coupon in Supabase database...');

  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 2); // Valid for 2 years

  const coupon = await prisma.coupon.upsert({
    where: { code: 'NAVYA15VIP' },
    update: {
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 3000,
      isActive: true,
      validUntil,
    },
    create: {
      code: 'NAVYA15VIP',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 3000,
      isActive: true,
      validUntil,
    },
  });

  console.log(
    '✅ NAVYA15VIP Coupon record created/updated in Supabase:',
    JSON.stringify(coupon, null, 2),
  );
}

main().finally(() => prisma.$disconnect());
