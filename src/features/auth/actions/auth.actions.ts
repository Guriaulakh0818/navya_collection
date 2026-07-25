'use server';

import { getCurrentUser as getClerkUser } from '@/lib/clerk';

/**
 * Server action to retrieve the current authenticated user using Clerk sessions only.
 * No custom JWT or cookie parsing.
 */
export async function getCurrentUser() {
  try {
    return await getClerkUser();
  } catch {
    return null;
  }
}
