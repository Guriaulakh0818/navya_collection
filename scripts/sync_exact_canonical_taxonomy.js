const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Load the canonical taxonomy from src/config/categories.config.ts
// We define it directly here to ensure reliable standalone execution
const { CATEGORY_TAXONOMY } = require('../src/config/categories.config.ts');

async function syncTaxonomy() {
  console.log('🚀 Starting Exact Canonical Taxonomy Synchronization...');

  let groupCount = 0;
  let subCount = 0;
  let leafCount = 0;

  // 1. Process 5 Root Groups
  for (const group of CATEGORY_TAXONOMY) {
    console.log(`\n📁 Processing Main Group: ${group.name} (${group.slug})`);

    // Check if category exists by slug
    let mainCat = await prisma.category.findUnique({
      where: { slug: group.slug },
    });

    if (mainCat) {
      mainCat = await prisma.category.update({
        where: { id: mainCat.id },
        data: {
          name: group.name,
          parentId: null,
          status: 'active',
          deletedAt: null,
          description: `${group.name} category collection at Navya Collection.`,
        },
      });
    } else {
      mainCat = await prisma.category.create({
        data: {
          id: group.id,
          name: group.name,
          slug: group.slug,
          parentId: null,
          status: 'active',
          description: `${group.name} category collection at Navya Collection.`,
        },
      });
    }
    groupCount++;

    // 2. Process Sections & Subcategories
    for (const section of group.sections) {
      for (const sub of section.subCategories) {
        let subCat = await prisma.category.findUnique({
          where: { slug: sub.slug },
        });

        if (subCat) {
          subCat = await prisma.category.update({
            where: { id: subCat.id },
            data: {
              name: sub.name,
              parentId: mainCat.id,
              status: 'active',
              deletedAt: null,
              description: `${sub.name} in ${group.name} > ${section.title}.`,
            },
          });
        } else {
          subCat = await prisma.category.create({
            data: {
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              parentId: mainCat.id,
              status: 'active',
              description: `${sub.name} in ${group.name} > ${section.title}.`,
            },
          });
        }
        subCount++;

        // 3. Process Leaf Items (if present)
        if (sub.items && sub.items.length > 0) {
          for (const item of sub.items) {
            let leafCat = await prisma.category.findUnique({
              where: { slug: item.slug },
            });

            if (leafCat) {
              await prisma.category.update({
                where: { id: leafCat.id },
                data: {
                  name: item.name,
                  parentId: subCat.id,
                  status: 'active',
                  deletedAt: null,
                  description: `${item.name} in ${group.name} > ${section.title} > ${sub.name}.`,
                },
              });
            } else {
              await prisma.category.create({
                data: {
                  id: item.id,
                  name: item.name,
                  slug: item.slug,
                  parentId: subCat.id,
                  status: 'active',
                  description: `${item.name} in ${group.name} > ${section.title} > ${sub.name}.`,
                },
              });
            }
            leafCount++;
          }
        }
      }
    }
  }

  console.log(
    `\n✅ Taxonomy Synced: ${groupCount} Groups, ${subCount} Subcategories, ${leafCount} Leaf categories.`,
  );

  // 4. Product Remapping
  console.log('\n📦 Remapping all 33 products to canonical categories...');

  // Helper map: Product Title Substring -> Target Category Slug
  const productMappings = [
    // Sarees
    { match: 'Banarasi Silk Saree', slug: 'women-sarees' },
    { match: 'Organza Silk Saree', slug: 'women-sarees' },
    { match: 'Zari Woven Silk Saree', slug: 'women-sarees' },
    { match: 'Saree', slug: 'women-sarees' },

    // Lehengas
    { match: 'Bridal Lehenga', slug: 'women-lehengas' },
    { match: 'Partywear Lehenga', slug: 'women-lehengas' },
    { match: 'Designer Lehenga', slug: 'women-lehengas' },
    { match: 'Lehenga', slug: 'women-lehengas' },

    // Anarkalis, Kurtis & Suits
    { match: 'Anarkali Suit', slug: 'women-kurta-sets' },
    { match: 'Sharara Suit', slug: 'women-kurta-sets' },
    { match: 'Festive Kurti & Pant Set', slug: 'women-kurta-sets' },
    { match: 'Embroidered Kurti Set', slug: 'women-kurta-sets' },
    { match: 'Kurti', slug: 'women-kurtas' },

    // Dupattas
    { match: 'Phulkari Dupatta', slug: 'women-scarves-stoles' },
    { match: 'Dupatta', slug: 'women-scarves-stoles' },

    // Men Kurtas & Ethnic
    { match: 'Designer Kurta Pajama', slug: 'men-kurta-sets' },
    { match: 'Nehru Jacket', slug: 'men-nehru-jackets' },
    { match: 'Sherwani Set', slug: 'boys-ethnic-wear' },

    // Kids & Baby (Must be before generic Shirt/T-Shirt)
    { match: 'Baby Boys Printed T-Shirt', slug: 'baby-boys' },
    { match: 'Baby Boys', slug: 'baby-boys' },

    // Men T-Shirts (Must be before generic Shirt)
    { match: 'Adidas Blue Graphic White T-Shirt', slug: 'men-t-shirts' },
    { match: 'Graphic Print Cotton T-Shirt', slug: 'men-t-shirts' },
    { match: 'T-Shirt', slug: 'men-t-shirts' },

    // Men Shirts
    { match: 'Casual Shirt', slug: 'men-shirts' },
    { match: 'Casual Full Sleeve Shirt', slug: 'men-shirts' },
    { match: 'Striped Full Sleeve Shirt', slug: 'men-shirts' },
    { match: 'Printed Full Sleeve Casual Shirt', slug: 'men-shirts' },
    { match: 'Checkered Casual Shirt', slug: 'men-shirts' },
    { match: 'Shirt', slug: 'men-shirts' },

    // Western Dresses
    { match: 'Western Maxi Dress', slug: 'women-dresses' },

    // Test & Fallbacks
    { match: 'Orphan Recovery Item', slug: 'women-ethnic-dresses' },
    { match: 'Idempotent Item', slug: 'women-ethnic-dresses' },
    { match: 'Reconciliation Item', slug: 'women-ethnic-dresses' },
  ];

  const products = await prisma.product.findMany({
    select: { id: true, name: true, categoryId: true },
  });

  let remappedCount = 0;
  for (const prod of products) {
    let targetSlug = null;
    for (const m of productMappings) {
      if (prod.name.toLowerCase().includes(m.match.toLowerCase())) {
        targetSlug = m.slug;
        break;
      }
    }

    if (!targetSlug) {
      targetSlug = 'women-clothing'; // default fallback
    }

    const targetCat = await prisma.category.findUnique({
      where: { slug: targetSlug },
    });

    if (targetCat) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { categoryId: targetCat.id },
      });
      remappedCount++;
      console.log(`  ✓ Product "${prod.name}" -> Category "${targetCat.name}" (${targetCat.slug})`);
    } else {
      console.warn(`  ⚠️ Target category slug "${targetSlug}" not found in DB!`);
    }
  }

  console.log(`\n🎉 Successfully remapped ${remappedCount} of ${products.length} products!`);

  // Final DB Check
  const totalDbCats = await prisma.category.count({ where: { deletedAt: null } });
  console.log(`\n📊 Final Active Categories in DB: ${totalDbCats}`);
}

syncTaxonomy()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
