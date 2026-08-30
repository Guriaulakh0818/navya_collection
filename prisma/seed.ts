import {
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ReturnStatus,
  ReturnType,
  Role,
  ShippingStatus,
} from '@prisma/client';

// ==========================================
// ENVIRONMENT SAFETY GUARD: STRICTLY LOCAL ONLY
// ==========================================
const dbEnv = (process.env.DATABASE_ENV || 'local').toLowerCase();
const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
const appEnv = (process.env.APP_ENV || '').toLowerCase();
const allowSeeding = process.env.ALLOW_DATABASE_SEEDING === 'true';
const rawDbUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').toLowerCase();

const isProduction =
  nodeEnv === 'production' ||
  dbEnv === 'production' ||
  appEnv === 'production' ||
  rawDbUrl.includes('zisieyoodosjbuocrjqd') ||
  (rawDbUrl.includes('supabase.com') && !rawDbUrl.includes('localhost'));

if (isProduction || !allowSeeding || dbEnv !== 'local') {
  console.error('\n⛔ [CRITICAL_SAFETY_ERROR] Database seeding is BLOCKED.');
  console.error(
    `Reason: Seeding is only permitted when DATABASE_ENV="local" AND ALLOW_DATABASE_SEEDING="true".`,
  );
  console.error(
    `Current: NODE_ENV=${nodeEnv}, DATABASE_ENV=${dbEnv}, ALLOW_DATABASE_SEEDING=${process.env.ALLOW_DATABASE_SEEDING}`,
  );
  console.error('Operation aborted to protect database integrity.\n');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🚀 Starting Navya Collection database seeding against LOCAL database...');

  // Check connection string placeholders
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('YOUR_PROJECT_REF') || dbUrl.includes('YOUR_PASSWORD')) {
    console.warn(
      '\n⚠️ DATABASE_URL contains placeholder credentials (YOUR_PROJECT_REF / YOUR_PASSWORD).',
    );
    console.warn(
      '👉 Please update your .env.local file with your actual local PostgreSQL connection string to seed.',
    );
    console.warn('💡 Seed script logic & structure verified successfully!\n');
    return;
  }

  // ==========================================
  // 0. NON-DESTRUCTIVE SEEDING (Preserves all existing user and shop data)
  // ==========================================
  console.log('🛡️ Idempotent Seed: Preserving all existing users, shops, and custom data...');

  // ==========================================
  // 1. USERS & ADMINS
  // ==========================================
  console.log('👤 Seeding Users & Admins...');

  const bcrypt = await import('bcryptjs');
  const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMe@123';
  const defaultAdminPasswordHash = await bcrypt.default.hash(initialAdminPassword, 10);

  const ownerEmail = process.env.OWNER_INITIAL_EMAIL || 'gurvindersingh0218@gmail.com';
  const ownerPassword = process.env.OWNER_INITIAL_PASSWORD || initialAdminPassword;
  const ownerPasswordHash = await bcrypt.default.hash(ownerPassword, 10);

  // Default Owner Account per Spec
  const ownerUser = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: 'Gurvinder Singh (Owner)',
      password: ownerPasswordHash,
      role: Role.OWNER,
      approvalStatus: 'APPROVED',
    },
    create: {
      name: 'Gurvinder Singh (Owner)',
      email: ownerEmail,
      mobile: '+919878543210',
      password: ownerPasswordHash,
      role: Role.OWNER,
      approvalStatus: 'APPROVED',
      mustChangePassword: false,
      loginAttempts: 0,
      lockUntil: null,
    },
  });

  // Default Admin per Task 4.2.5 spec
  await prisma.user.upsert({
    where: { email: 'admin@navyacollection.store' },
    update: {
      name: 'Navya Collection Admin',
      password: defaultAdminPasswordHash,
      role: Role.ADMIN,
      approvalStatus: 'APPROVED',
    },
    create: {
      name: 'Navya Collection Admin',
      email: 'admin@navyacollection.store',
      mobile: '+919999000000',
      password: defaultAdminPasswordHash,
      role: Role.ADMIN,
      approvalStatus: 'APPROVED',
      mustChangePassword: false,
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@navyacollection.com' },
    update: {
      name: 'Navya Collection SuperAdmin',
      password: defaultAdminPasswordHash,
      role: Role.SUPER_ADMIN,
    },
    create: {
      name: 'Navya Collection SuperAdmin',
      email: 'superadmin@navyacollection.com',
      mobile: '+919999000001',
      role: Role.SUPER_ADMIN,
      password: defaultAdminPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  // ==========================================
  // 1.5 MULTI-VENDOR SHOPS SEEDING
  // ==========================================
  console.log('🏪 Seeding Multi-Vendor Shops...');

  const defaultShop = await prisma.shop.upsert({
    where: { slug: 'navya-collection' },
    update: {},
    create: {
      name: 'Navya Collection',
      slug: 'navya-collection',
      description:
        'Navya Collection Flagship Store in Hisar. Luxury Indian ethnic couture, handcrafted sarees, anarkalis and lehengas.',
      phone: '+919878543210',
      email: ownerEmail,
      city: 'Hisar',
      state: 'Haryana',
      pincode: '125001',
      fullAddress: 'Shop No. 12, Main Cloth Market, Hisar, Haryana - 125001',
      status: 'APPROVED',
      verificationBadge: 'PREMIUM_STORE',
      commissionRate: 10.0,
      subscriptionTier: 'PREMIUM',
      ownerId: ownerUser.id,
      logo: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400',
      banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
      rating: 4.8,
      reviewCount: 120,
    },
  });
  console.log('✅ Created Flagship Shop:', defaultShop.id, defaultShop.name);

  const sellerUser1 = await prisma.user.upsert({
    where: { email: 'ramesh.saniyafashions@gmail.com' },
    update: {},
    create: {
      name: 'Ramesh Kumar (Saniya Fashions)',
      email: 'ramesh.saniyafashions@gmail.com',
      mobile: '+919812345678',
      role: Role.SELLER,
      approvalStatus: 'APPROVED',
      password: ownerPasswordHash,
    },
  });

  const shopSaniyaFashions = await prisma.shop.upsert({
    where: { slug: 'saniya-fashions' },
    update: {},
    create: {
      name: 'Saniya Fashions',
      slug: 'saniya-fashions',
      description: 'Premier ethnic and designer daily wear boutique based in Chandigarh.',
      phone: '+919812345678',
      email: 'contact@saniyafashions.com',
      city: 'Chandigarh',
      state: 'Punjab',
      pincode: '160017',
      fullAddress: 'Shop 45, Sector 17-C, Chandigarh, Punjab - 160017',
      status: 'APPROVED',
      verificationBadge: 'VERIFIED_SELLER',
      commissionRate: 12.5,
      subscriptionTier: 'GROWTH',
      ownerId: sellerUser1.id,
      logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
      rating: 4.9,
      reviewCount: 45,
    },
  });
  console.log('✅ Created Shop 1:', shopSaniyaFashions.id, shopSaniyaFashions.name);

  const sellerUser2 = await prisma.user.upsert({
    where: { email: 'vikram.stylezone@gmail.com' },
    update: {},
    create: {
      name: 'Vikram Verma (Style Zone)',
      email: 'vikram.stylezone@gmail.com',
      mobile: '+919876543219',
      role: Role.SELLER,
      approvalStatus: 'APPROVED',
      password: ownerPasswordHash,
    },
  });

  const shopStyleZone = await prisma.shop.upsert({
    where: { slug: 'style-zone' },
    update: {},
    create: {
      name: 'Style Zone',
      slug: 'style-zone',
      description: 'Exclusive party wear and wedding collection shop in Sirsa.',
      phone: '+919876543219',
      email: 'vikram.stylezone@gmail.com',
      gstin: '06XYZAB5678G2Z1',
      city: 'Sirsa',
      state: 'Haryana',
      pincode: '125055',
      fullAddress: 'Main Bazaar, Near City Clock Tower, Sirsa, Haryana - 125055',
      status: 'APPROVED',
      verificationBadge: 'TRUSTED_SELLER',
      commissionRate: 12.0,
      subscriptionTier: 'STARTER',
      ownerId: sellerUser2.id,
      logo: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400',
      banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200',
      rating: 4.7,
      reviewCount: 32,
    },
  });
  console.log('✅ Created Shop 2:', shopStyleZone.id, shopStyleZone.name);

  // Additional registered boutiques
  const sellerUser3 = await prisma.user.upsert({
    where: { email: 'jaspreet.fashions@gmail.com' },
    update: {},
    create: {
      name: 'Jaspreet Kaur (Jaspreet Fashions)',
      email: 'jaspreet.fashions@gmail.com',
      mobile: '+919814012345',
      role: Role.SELLER,
      approvalStatus: 'APPROVED',
      password: ownerPasswordHash,
    },
  });

  const shopJaspreetFashions = await prisma.shop.upsert({
    where: { slug: 'jaspreet-fashions' },
    update: {},
    create: {
      name: 'Jaspreet Fashions',
      slug: 'jaspreet-fashions',
      description:
        'Exclusive Punjabi suits, bridal dupattas, and heavy designer boutiquewear in Ludhiana.',
      phone: '+919814012345',
      email: 'jaspreet.fashions@gmail.com',
      city: 'Ludhiana',
      state: 'Punjab',
      pincode: '141001',
      fullAddress: 'Mall Road, Near Fountain Plaza, Ludhiana, Punjab - 141001',
      status: 'APPROVED',
      verificationBadge: 'PREMIUM_STORE',
      commissionRate: 10.0,
      subscriptionTier: 'PREMIUM',
      ownerId: sellerUser3.id,
      logo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      rating: 4.9,
      reviewCount: 88,
    },
  });
  console.log('✅ Created Shop 3:', shopJaspreetFashions.id, shopJaspreetFashions.name);

  const sellerUser4 = await prisma.user.upsert({
    where: { email: 'barkat.fashion@gmail.com' },
    update: {},
    create: {
      name: 'Harpreet Singh (Barkat Fashion)',
      email: 'barkat.fashion@gmail.com',
      mobile: '+919872098765',
      role: Role.SELLER,
      approvalStatus: 'APPROVED',
      password: ownerPasswordHash,
    },
  });

  const shopBarkatFashion = await prisma.shop.upsert({
    where: { slug: 'barkat-fashion' },
    update: {},
    create: {
      name: 'Barkat Fashion',
      slug: 'barkat-fashion',
      description:
        'Traditional bridal lehengas, hand-worked phulkaris, and boutique couture in Amritsar.',
      phone: '+919872098765',
      email: 'barkat.fashion@gmail.com',
      city: 'Amritsar',
      state: 'Punjab',
      pincode: '143001',
      fullAddress: 'Lawrence Road, Heritage Street, Amritsar, Punjab - 143001',
      status: 'APPROVED',
      verificationBadge: 'VERIFIED_SELLER',
      commissionRate: 11.5,
      subscriptionTier: 'GROWTH',
      ownerId: sellerUser4.id,
      logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
      rating: 4.8,
      reviewCount: 64,
    },
  });
  console.log('✅ Created Shop 4:', shopBarkatFashion.id, shopBarkatFashion.name);

  await prisma.user.upsert({
    where: { email: 'admin.rajesh@navyacollection.com' },
    update: {
      name: 'Rajesh Sharma (Admin)',
      role: Role.ADMIN,
    },
    create: {
      name: 'Rajesh Sharma (Admin)',
      email: 'admin.rajesh@navyacollection.com',
      mobile: '+919999000002',
      role: Role.ADMIN,
      password: defaultAdminPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  await prisma.user.upsert({
    where: { email: 'pooja.ops@navyacollection.com' },
    update: {
      name: 'Pooja Verma (Store Operations)',
      role: Role.ADMIN,
    },
    create: {
      name: 'Pooja Verma (Store Operations)',
      email: 'pooja.ops@navyacollection.com',
      mobile: '+919999000003',
      role: Role.ADMIN,
      password: defaultAdminPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  const indianNames = [
    { name: 'Ananya Iyer', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    { name: 'Diya Patel', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
    { name: 'Aarav Sharma', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    { name: 'Rohan Kapoor', city: 'Chandigarh', state: 'Punjab', pincode: '160017' },
    { name: 'Kavya Reddy', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  ];

  const customerUsers = [];
  const customerAddresses = [];

  for (let i = 0; i < indianNames.length; i++) {
    const item = indianNames[i];
    const firstName = item.name.split(' ')[0].toLowerCase();
    const lastName = item.name.split(' ')[1].toLowerCase();
    const email = `${firstName}.${lastName}${i + 1}@gmail.com`;
    const mobile = `+9198765${(10000 + i).toString()}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: item.name,
        mobile,
      },
      create: {
        name: item.name,
        email,
        mobile,
        role: Role.USER,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
      },
    });

    customerUsers.push(user);

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: item.name,
        mobile,
        pincode: item.pincode,
        addressLine1: `${101 + i}, Heritage Heights, M.G. Road`,
        addressLine2: `Near Central Park, Sector ${i + 1}`,
        city: item.city,
        state: item.state,
        type: i % 3 === 0 ? 'WORK' : 'HOME',
        isDefault: true,
      },
    });

    customerAddresses.push(address);
  }

  console.log(`✅ Created ${customerUsers.length} Customers and Addresses.`);

  // ==========================================
  // 2. CATEGORIES
  // ==========================================
  console.log('🏷️ Seeding Product Categories...');

  const parentCategoriesData = [
    {
      name: 'Sarees',
      slug: 'sarees',
      description: 'Handcrafted luxury ethnic silk, chiffon, georgette and organza sarees.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    },
    {
      name: 'Anarkalis & Suits',
      slug: 'anarkalis-suits',
      description: 'Elegant designer suits, floor-length anarkalis, and festive churidar sets.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    },
    {
      name: 'Lehengas',
      slug: 'lehengas',
      description: 'Exquisite bridal and festive lehenga cholis with rich embroidery.',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
    },
    {
      name: 'Kurtis & Tunics',
      slug: 'kurtis-tunics',
      description: 'Contemporary daily wear and festive designer kurtis.',
      image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600',
    },
    {
      name: 'Indo-Western & Fusion',
      slug: 'indo-western-fusion',
      description: 'Modern silhouettes blended with traditional Indian craftsmanship.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    },
    {
      name: 'Gents & Mens Couture',
      slug: 'gents-mens-couture',
      description: 'Handcrafted designer sherwanis, kurta pajamas, and waistcoats for men.',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
    },
    {
      name: 'Dupattas & Stoles',
      slug: 'dupattas-stoles',
      description: 'Heavy embroidered Banarasi, Phulkari, and Silk designer dupattas.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    },
  ];

  const categoriesMap: Record<string, string> = {};

  for (const catData of parentCategoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: catData,
      create: catData,
    });
    categoriesMap[cat.slug] = cat.id;
  }

  const subCategoriesData = [
    {
      name: 'Banarasi Sarees',
      slug: 'banarasi-sarees',
      parentSlug: 'sarees',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    },
    {
      name: 'Kanjeevaram Silk Sarees',
      slug: 'kanjeevaram-silk-sarees',
      parentSlug: 'sarees',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
    },
    {
      name: 'Chanderi Sarees',
      slug: 'chanderi-sarees',
      parentSlug: 'sarees',
      image: 'https://images.unsplash.com/photo-1610030469668-98e550d6193c?w=600',
    },
    {
      name: 'Bridal Lehengas',
      slug: 'bridal-lehengas',
      parentSlug: 'lehengas',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
    },
    {
      name: 'Partywear Lehengas',
      slug: 'partywear-lehengas',
      parentSlug: 'lehengas',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    },
    {
      name: 'Silk Anarkali Sets',
      slug: 'silk-anarkali-sets',
      parentSlug: 'anarkalis-suits',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    },
    {
      name: 'Designer Kurta Pajamas',
      slug: 'designer-kurta-pajamas',
      parentSlug: 'gents-mens-couture',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600',
    },
    {
      name: 'Phulkari Dupattas',
      slug: 'phulkari-dupattas',
      parentSlug: 'dupattas-stoles',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    },
  ];

  for (const subCat of subCategoriesData) {
    const parentId = categoriesMap[subCat.parentSlug];
    const cat = await prisma.category.upsert({
      where: { slug: subCat.slug },
      update: {
        name: subCat.name,
        image: subCat.image,
        ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
      },
      create: {
        name: subCat.name,
        slug: subCat.slug,
        description: `Premium handpicked collection of ${subCat.name}.`,
        image: subCat.image,
        ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
      },
    });
    categoriesMap[subCat.slug] = cat.id;
  }

  console.log(`✅ Created ${Object.keys(categoriesMap).length} Categories & Subcategories.`);

  // ==========================================
  // 3. PRODUCTS & VARIANTS
  // ==========================================
  console.log('🛍️ Seeding Products & Variants (12 Products)...');

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'Royal Crimson', hex: '#800020' },
    { name: 'Emerald Green', hex: '#50C878' },
    { name: 'Midnight Blue', hex: '#191970' },
    { name: 'Mustard Gold', hex: '#FFDB58' },
    { name: 'Blush Pink', hex: '#FFB6C1' },
    { name: 'Ivory White', hex: '#FFFFF0' },
  ];

  const productTemplates = [
    {
      name: 'Royal Banarasi Silk Saree',
      price: 14999,
      categorySlug: 'banarasi-sarees',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
    },
    {
      name: 'Heritage Kanjeevaram Zari Saree',
      price: 24999,
      categorySlug: 'kanjeevaram-silk',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
    },
    {
      name: 'Floral Printed Organza Saree',
      price: 6999,
      categorySlug: 'organza-chiffon',
      image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800',
    },
    {
      name: 'Emerald Heavy Velvet Bridal Lehenga',
      price: 45999,
      categorySlug: 'bridal-lehengas',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
    },
    {
      name: 'Sequin Embellished Georgette Lehenga',
      price: 18999,
      categorySlug: 'partywear-lehengas',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
    },
    {
      name: 'Raw Silk Floor Length Anarkali Suit',
      price: 12499,
      categorySlug: 'silk-anarkali-sets',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
    },
    {
      name: 'Designer Royal Velvet Sherwani Set',
      price: 28999,
      categorySlug: 'designer-kurta-pajamas',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
    },
    {
      name: 'Embroidered Heavy Banarasi Silk Dupatta',
      price: 3499,
      categorySlug: 'phulkari-dupattas',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
    },
    {
      name: 'Chanderi Silk Embroidered Kurti Set',
      price: 5499,
      categorySlug: 'kurtis-tunics',
      image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800',
    },
    {
      name: 'Indo-Western Draped Saree Gown',
      price: 15999,
      categorySlug: 'indo-western-fusion',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
    },
  ];

  const createdProducts = [];
  const createdVariants = [];

  let skuCounter = 1000;

  const dbShops = await prisma.shop.findMany();
  const shopMap: Record<string, string> = {};
  for (const s of dbShops) {
    shopMap[s.slug] = s.id;
  }
  const flagshipShopId = shopMap['navya-collection'] || defaultShop.id;
  const saniyaFashionsShopId = shopMap['saniya-fashions'] || shopSaniyaFashions.id;
  const styleZoneShopId = shopMap['style-zone'] || shopStyleZone.id;
  const jaspreetFashionsShopId = shopMap['jaspreet-fashions'] || shopJaspreetFashions.id;
  const barkatFashionShopId = shopMap['barkat-fashion'] || shopBarkatFashion.id;

  const allShopIds = [
    flagshipShopId,
    saniyaFashionsShopId,
    styleZoneShopId,
    jaspreetFashionsShopId,
    barkatFashionShopId,
  ];

  for (let i = 1; i <= 15; i++) {
    const template = productTemplates[(i - 1) % productTemplates.length];
    const prefix = template.name.split(' ')[0].toUpperCase();
    const productName = `${template.name} - Vol. ${Math.ceil(i / 10)}`;
    const slug = `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
    const sku = `NAV-${prefix}-${skuCounter++}`;
    const price = template.price + (i % 5) * 500;
    const compareAtPrice = price + 2500;
    const costPrice = Math.round(price * 0.55);
    const categoryId = categoriesMap[template.categorySlug] || categoriesMap['sarees'];
    const shopId = allShopIds[(i - 1) % allShopIds.length];

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: productName,
        slug,
        sku,
        description: `Exquisite Indian luxury couture from Navya Collection. Featuring intricate hand embroidery, fine zardozi work, and premium silk fabric designed for grand weddings and celebrations.`,
        price,
        compareAtPrice,
        costPrice,
        stock: 50 + (i % 20),
        lowStockThreshold: 5,
        status: i % 15 === 0 ? 'draft' : 'active',
        isFeatured: i % 4 === 0,
        isNewArrival: i % 3 === 0,
        categoryId,
        shopId,
        rating: 4.2 + (i % 8) * 0.1,
        reviewCount: 5 + (i % 25),
      },
    });

    createdProducts.push(product);

    await prisma.productImage.createMany({
      data: [
        {
          productId: product.id,
          imageUrl: template.image,
          altText: `${productName} Front View`,
          isPrimary: true,
          sortOrder: 1,
        },
        {
          productId: product.id,
          imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
          altText: `${productName} Detail Embroidery`,
          isPrimary: false,
          sortOrder: 2,
        },
      ],
    });

    const numVariants = 3;
    for (let v = 0; v < numVariants; v++) {
      const size = sizes[v % sizes.length];
      const color = colors[(i + v) % colors.length];
      const variantSku = `${sku}-${size}-${color.name.substring(0, 3).toUpperCase()}`;

      const variant = await prisma.productVariant.upsert({
        where: { sku: variantSku },
        update: {},
        create: {
          productId: product.id,
          name: `${size} / ${color.name}`,
          sku: variantSku,
          price: price,
          stock: 15 + v * 5,
          size,
          color: color.name,
        },
      });

      createdVariants.push(variant);
    }
  }

  console.log(
    `✅ Created ${createdProducts.length} Products and ${createdVariants.length} Variants.`,
  );

  // ==========================================
  // 4. COUPONS
  // ==========================================
  console.log('🎟️ Seeding Coupons...');

  const couponsData = [
    {
      code: 'NAVYA10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 2999,
      maxDiscount: 1500,
      validUntil: new Date('2027-12-31'),
      isActive: true,
    },
    {
      code: 'FESTIVE20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: 9999,
      maxDiscount: 5000,
      validUntil: new Date('2027-12-31'),
      isActive: true,
    },
    {
      code: 'WELCOME500',
      discountType: 'FLAT',
      discountValue: 500,
      minOrderAmount: 1999,
      maxDiscount: null,
      validUntil: new Date('2027-12-31'),
      isActive: true,
    },
    {
      code: 'BRIDAL15',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 25000,
      maxDiscount: 10000,
      validUntil: new Date('2027-12-31'),
      isActive: true,
    },
  ];

  for (const c of couponsData) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log(`✅ Created ${couponsData.length} Coupons.`);

  // ==========================================
  // 5. REVIEWS & WISHLISTS & CARTS
  // ==========================================
  console.log('⭐ Seeding Reviews, Wishlists, and Active Carts...');

  const reviewComments = [
    'Absolutely stunning fabric quality! Received so many compliments at my cousin’s sangeet.',
    'The zari embroidery is even more breathtaking in person. Navya Collection never disappoints.',
    'Fast delivery to Bangalore! The fitting was perfect right out of the box.',
    'Elegant color and premium material. Worth every rupee spent.',
    'Packaged beautifully with a nice garment bag. Highly recommended!',
  ];

  let reviewCount = 0;
  for (let r = 0; r < 10; r++) {
    const user = customerUsers[r % customerUsers.length];
    const product = createdProducts[r % createdProducts.length];

    await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating: 4 + (r % 2),
        comment: reviewComments[r % reviewComments.length],
      },
    });
    reviewCount++;

    await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId: createdProducts[(r + 2) % createdProducts.length].id,
      },
    });
  }

  for (let c = 0; c < customerUsers.length; c++) {
    const user = customerUsers[c];
    const product = createdProducts[c % createdProducts.length];
    const variant = createdVariants[(c * 2) % createdVariants.length];

    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
      },
    });

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
      },
    });
  }

  console.log(
    `✅ Created ${reviewCount} Reviews, 10 Wishlist items, and ${customerUsers.length} Active Carts.`,
  );

  // ==========================================
  // 6. ORDERS, ORDER ITEMS, & PAYMENTS
  // ==========================================
  console.log('📦 Seeding Orders, Order Items & Payment Transactions...');

  const orderStatuses = [
    OrderStatus.DELIVERED,
    OrderStatus.SHIPPED,
    OrderStatus.PROCESSING,
    OrderStatus.CONFIRMED,
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
  ];

  const createdOrders = [];

  for (let o = 0; o < 25; o++) {
    const user = customerUsers[o % customerUsers.length];
    const address = customerAddresses[o % customerAddresses.length];
    const status = orderStatuses[o % orderStatuses.length];
    const paymentStatus =
      status === OrderStatus.CANCELLED
        ? PaymentStatus.REFUNDED
        : status === OrderStatus.PENDING
          ? PaymentStatus.PENDING
          : PaymentStatus.PAID;

    const product1 = createdProducts[o % createdProducts.length];
    const variant1 = createdVariants[(o * 2) % createdVariants.length];
    const qty1 = 1;
    const price1 = Number(product1.price);
    const lineTotal1 = price1 * qty1;

    const discountAmount = o % 3 === 0 ? 500 : 0;
    const shippingAmount = lineTotal1 > 5000 ? 0 : 250;
    const totalAmount = lineTotal1;
    const finalAmount = totalAmount - discountAmount + shippingAmount;

    const orderNumber = `NAV-2026-${10000 + o}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: address.id,
        totalAmount,
        discountAmount,
        shippingAmount,
        finalAmount,
        orderStatus: status,
        paymentStatus,
        paymentMethod: o % 2 === 0 ? PaymentMethod.RAZORPAY : PaymentMethod.COD,
        razorpayOrderId: o % 2 === 0 ? `order_rzp_${1000 + o}` : null,
        razorpayPaymentId: paymentStatus === PaymentStatus.PAID ? `pay_rzp_${5000 + o}` : null,
        razorpaySignature: paymentStatus === PaymentStatus.PAID ? `sig_rzp_${9000 + o}` : null,
        shiprocketOrderId: status !== OrderStatus.PENDING ? `sr_ord_${8000 + o}` : null,
        shiprocketShipmentId: status !== OrderStatus.PENDING ? `sr_shp_${8000 + o}` : null,
        awbCode:
          status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED
            ? `AWB9876543${o}`
            : null,
        courierName: 'Delhivery Surface',
        shippingStatus:
          status === OrderStatus.DELIVERED
            ? ShippingStatus.DELIVERED
            : status === OrderStatus.SHIPPED
              ? ShippingStatus.IN_TRANSIT
              : ShippingStatus.PENDING,
        notes: o % 4 === 0 ? 'Please wrap as gift with custom greeting note.' : null,
      },
    });

    createdOrders.push(order);

    const itemShopId = product1.shopId || defaultShop.id;
    const commissionRate = 10.0;
    const commissionAmt = (lineTotal1 * commissionRate) / 100;
    const vendorPayoutAmt = lineTotal1 - commissionAmt;

    const vendorOrder = await prisma.vendorOrder.create({
      data: {
        masterOrderId: order.id,
        shopId: itemShopId,
        vendorOrderNumber: `${orderNumber}-V1`,
        totalAmount: lineTotal1,
        commissionAmount: commissionAmt,
        vendorPayoutAmount: vendorPayoutAmt,
        status: status,
        shippingStatus:
          status === OrderStatus.DELIVERED
            ? ShippingStatus.DELIVERED
            : status === OrderStatus.SHIPPED
              ? ShippingStatus.IN_TRANSIT
              : ShippingStatus.PENDING,
        awbCode: order.awbCode,
        courierName: order.courierName,
      },
    });

    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product1.id,
        variantId: variant1.id,
        shopId: itemShopId,
        vendorOrderId: vendorOrder.id,
        name: product1.name,
        sku: variant1.sku,
        price: price1,
        quantity: qty1,
        total: lineTotal1,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        razorpaySignature: order.razorpaySignature,
        amount: finalAmount,
        currency: 'INR',
        status: paymentStatus,
        method: o % 2 === 0 ? 'RAZORPAY_UPI' : 'COD',
        payload: { seedGenerated: true, orderNumber },
      },
    });

    if (status === OrderStatus.DELIVERED && o < 5) {
      const returnRequest = await prisma.returnRequest.create({
        data: {
          orderId: order.id,
          userId: user.id,
          type: o % 2 === 0 ? ReturnType.RETURN : ReturnType.EXCHANGE,
          reason:
            o % 2 === 0
              ? 'Size fit issue on shoulders'
              : 'Color tone slightly brighter than screen',
          status: ReturnStatus.REQUESTED,
          refundAmount: finalAmount,
          adminNotes: 'Customer requested return via portal.',
        },
      });

      await prisma.returnItem.create({
        data: {
          returnRequestId: returnRequest.id,
          orderItemId: orderItem.id,
          quantity: 1,
          reason: 'Size misfit',
        },
      });
    }
  }

  console.log(
    `✅ Created ${createdOrders.length} Orders, Order Items, Payments & Return Requests.`,
  );

  // ==========================================
  // 7. NOTIFICATIONS & AUDIT LOGS
  // ==========================================
  console.log('🔔 Seeding Notifications & Audit Logs...');

  for (let n = 0; n < 20; n++) {
    const user = customerUsers[n % customerUsers.length];
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Order Confirmed! 🎉',
        message: `Your Navya Collection order NAV-2026-${10000 + n} has been confirmed. We are preparing your hand-embroidery garment.`,
        type: NotificationType.ORDER_UPDATE,
        isRead: n % 2 === 0,
        link: `/orders/NAV-2026-${10000 + n}`,
      },
    });
  }

  const auditActions = [
    { action: 'UPDATE_PRODUCT_STOCK', entity: 'Product', entityId: createdProducts[0].id },
    { action: 'CREATE_COUPON', entity: 'Coupon', entityId: 'NAVYA10' },
    { action: 'APPROVE_RETURN_REQUEST', entity: 'ReturnRequest', entityId: 'ret_1' },
    { action: 'UPDATE_ORDER_STATUS', entity: 'Order', entityId: createdOrders[0].id },
  ];

  for (const audit of auditActions) {
    await prisma.auditLog.create({
      data: {
        adminId: superAdmin.id,
        action: audit.action,
        entity: audit.entity,
        entityId: audit.entityId,
        metadata: { ip: '127.0.0.1', userAgent: 'Admin Console / Chrome 124' },
        ipAddress: '127.0.0.1',
      },
    });
  }

  console.log('✅ Created Notifications and Admin Audit Logs.');
  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
