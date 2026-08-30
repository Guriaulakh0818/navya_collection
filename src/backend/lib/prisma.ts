import { PrismaClient } from '@prisma/client';

import { validateEnvironment } from '../security/env.config';

// Guarantee that database environment safety guards are active
validateEnvironment();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
