import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Moving seller products to pending_approval for admin moderation queue...');
  const updated = await prisma.product.updateMany({
    where: {
      deletedAt: null,
      status: 'active',
    },
    data: {
      status: 'pending_approval',
    },
  });
  console.log(`✅ Successfully updated ${updated.count} products to "pending_approval" status!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
