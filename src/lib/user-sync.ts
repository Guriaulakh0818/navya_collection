import { Role } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface ClerkUserData {
  clerkId: string;
  mobile?: string | null;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  role?: Role;
}

/**
 * Synchronizes a Clerk authenticated user with the Prisma PostgreSQL database.
 * Ensures zero duplicate records by checking clerkId, mobile number, and email address.
 */
export async function syncClerkUserToDatabase(data: ClerkUserData) {
  if (!data.clerkId) {
    throw new Error('clerkId is required for database synchronization');
  }

  const cleanMobile = data.mobile ? data.mobile.trim() : null;
  const cleanEmail = data.email ? data.email.trim().toLowerCase() : null;

  // 1. Check if user exists by clerkId
  let existingUser = await prisma.user.findUnique({
    where: { clerkId: data.clerkId },
  });

  if (existingUser) {
    return existingUser;
  }

  // 2. Check if user exists by mobile or email (e.g. seeded customer linking Clerk auth)
  if (cleanMobile || cleanEmail) {
    existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (existingUser) {
      // Link clerkId to existing database record without duplicating
      return await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId: data.clerkId,
          ...(data.avatar && !existingUser.avatar ? { avatar: data.avatar } : {}),
          ...(data.name && !existingUser.name ? { name: data.name } : {}),
        },
      });
    }
  }

  // 3. User does not exist -> Create new User in Prisma with an active Cart
  const newUser = await prisma.user.create({
    data: {
      clerkId: data.clerkId,
      mobile: cleanMobile,
      email: cleanEmail,
      name: data.name || 'Navya Customer',
      avatar: data.avatar,
      role: data.role || Role.USER,
      cart: {
        create: {},
      },
    },
  });

  return newUser;
}
