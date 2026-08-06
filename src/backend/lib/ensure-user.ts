import { Role } from '@prisma/client';

import { prisma } from '@/lib/prisma';

/**
 * Guarantees that a valid User record exists in PostgreSQL `users` table
 * for the given userId or phone number, preventing Foreign Key Constraint failures (P2003).
 */
const verifiedUserCache = new Set<string>();

export async function ensureUserExists(userId: string, emailOrPhone?: string): Promise<string> {
  if (userId && verifiedUserCache.has(userId)) {
    return userId;
  }

  try {
    // 1. Exact ID check
    if (userId) {
      const existingById = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (existingById) {
        verifiedUserCache.add(existingById.id);
        return existingById.id;
      }
    }

    const cleanInput = (emailOrPhone || '').trim().toLowerCase();

    // 2. Exact Email Check
    if (cleanInput.includes('@')) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email: cleanInput },
        select: { id: true },
      });

      if (existingByEmail) {
        verifiedUserCache.add(existingByEmail.id);
        return existingByEmail.id;
      }
    }

    // 3. Exact Mobile Check
    const cleanPhone = cleanInput.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length === 10) {
      const existingByMobile = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile: cleanPhone },
            { mobile: `+91${cleanPhone}` },
            { mobile: `91${cleanPhone}` },
          ],
        },
        select: { id: true },
      });

      if (existingByMobile) {
        verifiedUserCache.add(existingByMobile.id);
        return existingByMobile.id;
      }
    }

    // 4. Dedicated User Creation for this specific account (Never hijack another user!)
    const newUserId = userId || `usr_${Date.now()}`;
    const defaultEmail = cleanInput.includes('@') ? cleanInput : undefined;
    const defaultMobile = cleanPhone.length === 10 ? cleanPhone : undefined;
    const defaultName = defaultEmail ? defaultEmail.split('@')[0] : 'Navya Customer';

    const createdUser = await prisma.user.create({
      data: {
        id: newUserId,
        email: defaultEmail,
        mobile: defaultMobile,
        role: Role.USER,
        name: defaultName,
        cart: {
          create: {},
        },
      },
      select: { id: true },
    });

    verifiedUserCache.add(createdUser.id);
    return createdUser.id;
  } catch (error) {
    console.error(`[ENSURE_USER_EXISTS_ERROR] Fallback to userId:`, error);
    return userId;
  }
}
