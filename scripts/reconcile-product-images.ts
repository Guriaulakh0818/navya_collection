import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env.local or .env if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath) && typeof (process as any).loadEnvFile === 'function') {
  (process as any).loadEnvFile(envLocalPath);
} else if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === 'function') {
  (process as any).loadEnvFile(envPath);
}

const prisma = new PrismaClient();

async function reconcileProductImages() {
  console.log('🔄 Starting Product Images Reconciliation...');
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { deletedAt: null },
        },
      },
    });

    console.log(`📦 Found ${products.length} products to evaluate.`);

    let fixedCount = 0;
    let totalImagesReindexed = 0;

    for (const product of products) {
      const images = product.images;
      if (!images || images.length === 0) continue;

      // 1. Identify primary image
      // Preference:
      // a) Image explicitly marked as isPrimary === true with lowest sortOrder
      // b) First image in the array (sortOrder: 0)
      const primaryIdx = images.findIndex((img) => img.isPrimary);
      const chosenPrimary = primaryIdx >= 0 ? images[primaryIdx] : images[0];

      // 2. Build desired order: chosenPrimary at index 0, followed by the rest
      const remaining = images.filter((img) => img.id !== chosenPrimary.id);
      const reordered = [chosenPrimary, ...remaining];

      // 3. Check if anything actually needs to change
      let needsUpdate = false;
      for (let i = 0; i < reordered.length; i++) {
        const targetImg = reordered[i];
        const expectedIsPrimary = i === 0;
        const expectedSortOrder = i;

        if (
          targetImg.isPrimary !== expectedIsPrimary ||
          targetImg.sortOrder !== expectedSortOrder
        ) {
          needsUpdate = true;
          break;
        }
      }

      if (needsUpdate) {
        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < reordered.length; i++) {
            const targetImg = reordered[i];
            await tx.productImage.update({
              where: { id: targetImg.id },
              data: {
                isPrimary: i === 0,
                sortOrder: i,
              },
            });
            totalImagesReindexed++;
          }

          // Also ensure variants with empty imageUrl link to the primary image
          const primaryUrl = chosenPrimary.imageUrl;
          if (primaryUrl && product.variants && product.variants.length > 0) {
            for (const v of product.variants) {
              if (!v.imageUrl) {
                await tx.productVariant.update({
                  where: { id: v.id },
                  data: { imageUrl: primaryUrl },
                });
              }
            }
          }
        });

        fixedCount++;
        console.log(
          `  ✅ Fixed product: "${product.name}" (${product.id}) -> Primary Image set to: ${chosenPrimary.imageUrl.slice(0, 60)}...`,
        );
      }
    }

    console.log('\n=============================================');
    console.log(`🎉 RECONCILIATION COMPLETE!`);
    console.log(`Total Products Scanned: ${products.length}`);
    console.log(`Products Fixed: ${fixedCount}`);
    console.log(`Images Re-indexed: ${totalImagesReindexed}`);
    console.log('=============================================\n');
  } catch (error) {
    console.error('❌ Error during product images reconciliation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reconcileProductImages();
