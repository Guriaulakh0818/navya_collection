import { Role } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface UserSyncData {
  mobile?: string | null;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  role?: Role;
}

/**
 * Synchronizes an authenticated user with the Prisma PostgreSQL database.
 * Ensures zero duplicate records by checking mobile number and email address.
 * Prepared for custom MSG91 OTP authentication architecture.
 */
export async function syncUserToDatabase(data: UserSyncData) {
  const cleanMobile = data.mobile ? data.mobile.trim() : null;
  const cleanEmail = data.email ? data.email.trim().toLowerCase() : null;

  if (!cleanMobile && !cleanEmail) {
    throw new Error('Mobile number or email is required for user synchronization');
  }

  // 1. Check if user exists by mobile or email
  let existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
      ],
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // 2. User does not exist -> Create new User in Prisma with an active Cart
  const newUser = await prisma.user.create({
    data: {
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
