import { PrismaClient } from '@prisma/client';

import { validateEnvironment } from '../security/env.config';

// Guarantee that database environment safety guards are active
validateEnvironment();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Persist Prisma singleton globally across warm lambda containers and dev HMR
// to strictly prevent PostgreSQL connection pool exhaustion and memory leaks.
globalForPrisma.prisma = prisma;
