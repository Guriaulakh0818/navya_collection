import { auth, currentUser } from '@clerk/nextjs/server';

import { prisma } from './prisma';
import { syncClerkUserToDatabase } from './user-sync';

/**
 * Validates that Clerk environment variables are set.
 */
export function validateClerkEnv(): {
  publishableKey: string;
  secretKey: string;
  isValid: boolean;
} {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const secretKey = process.env.CLERK_SECRET_KEY || '';

  const isValid =
    Boolean(publishableKey) &&
    Boolean(secretKey) &&
    !publishableKey.includes('placeholder') &&
    !secretKey.includes('placeholder');

  return {
    publishableKey,
    secretKey,
    isValid,
  };
}

/**
 * Retrieves the current authenticated user from Clerk session and syncs
 * with the Prisma PostgreSQL database. Accessible across Server Components & API routes.
 */
export async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const mobile = clerkUser.phoneNumbers?.[0]?.phoneNumber ?? null;
  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  const name =
    clerkUser.firstName || clerkUser.lastName
      ? `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim()
      : null;

  return await syncClerkUserToDatabase({
    clerkId: clerkUser.id,
    mobile,
    email,
    name,
    avatar: clerkUser.imageUrl,
  });
}

/**
 * Enforces authenticated Clerk session. Accessible across Server Components & API routes.
 * Throws or redirects if unauthenticated.
 */
export async function requireAuth() {
  const { userId, redirectToSignIn } = auth();
  if (!userId) {
    return redirectToSignIn();
  }

  const dbUser = await getCurrentUser();
  if (!dbUser) {
    throw new Error('Unauthorized: User session invalid');
  }

  return dbUser;
}

/**
 * Enforces administrative role for protected Admin Server Components & API routes.
 * Throws forbidden error if user lacks admin privileges.
 */
export async function requireAdmin() {
  const dbUser = await requireAuth();

  // Check role in Prisma database or Clerk metadata
  const isAdminRole = dbUser.role === 'ADMIN' || dbUser.role === 'SUPER_ADMIN';

  if (!isAdminRole) {
    throw new Error('Forbidden: Administrative privileges required');
  }

  return dbUser;
}

/**
 * Backward-compatible alias for getSyncedUser
 */
export const getSyncedUser = getCurrentUser;
