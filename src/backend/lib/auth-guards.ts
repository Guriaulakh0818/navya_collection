import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

import { getCurrentUser as fetchSessionUser, SessionUser } from '@/lib/session';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * Reusable helper returning the authenticated user or null.
 * Works seamlessly in Server Components, Server Actions, and API Routes.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return await fetchSessionUser();
}

/**
 * Helper checking if the current user possesses a specific role.
 */
export async function hasRole(requiredRole: UserRole | UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return allowedRoles.includes(user.role as UserRole);
}

/**
 * Enforces authentication. Redirects to /login in Server Components/Actions,
 * or throws an Unauthenticated error in API routes.
 */
export async function requireAuth(redirectTo: string = '/login'): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

/**
 * Enforces CUSTOMER / USER authentication.
 */
export async function requireCustomer(): Promise<SessionUser> {
  const user = await requireAuth('/login');
  return user;
}

/**
 * Enforces ADMIN / SUPER_ADMIN role-based authorization directly from database context.
 * Redirects to /admin/login if not authenticated as an Admin.
 */
export async function requireAdmin(redirectTo: string = '/admin/login'): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN)) {
    redirect(redirectTo);
  }

  return user;
}
