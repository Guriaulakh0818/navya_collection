import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserFks() {
  const result: any[] = await prisma.$queryRaw`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users';
  `;
  console.log(
    '📌 Foreign Key Constraints pointing TO users table:\n',
    JSON.stringify(result, null, 2),
  );

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  console.log('📌 Users currently in DB:', users);
}

checkUserFks().finally(() => prisma.$disconnect());
