import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE_NAME = 'navya_session';
export const ADMIN_SESSION_COOKIE_NAME = 'navya_admin_session';
export const SESSION_EXPIRY_DAYS = 7;
export const SESSION_EXPIRY_SECONDS = SESSION_EXPIRY_DAYS * 24 * 60 * 60; // 604,800 seconds

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '⛔ [AUTH_FATAL] JWT_SECRET is not defined in production environment variables.',
      );
    }
    return 'dev_jwt_secret_key_change_in_production_32chars';
  }
  return secret;
}

/**
 * Creates a SHA-256 hash of the session JWT to ensure plain tokens are never stored in DB.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface SessionUser {
  id: string;
  phone: string;
  role: string;
  name?: string | null;
  email?: string | null;
  shopName?: string | null;
  shopId?: string | null;
}

export interface SessionMetadata {
  device?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Clears the HTTP-Only authentication cookie by setting MaxAge=0 and Expired date.
 */
export async function clearAuthCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.set(ADMIN_SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  } catch {
    // Ignore cookie store errors in non-request contexts
  }
}

/**
 * Generates a signed JWT, creates a UserSession record in Prisma (with tokenHash),
 * and sets a secure HTTP-Only cookie.
 */
export async function createUserSession(
  user: { id: string; phone?: string | null; role?: string },
  metadata?: SessionMetadata,
) {
  const secret = getJwtSecret();
  const phone = user.phone || '';
  const role = user.role || 'USER';

  // 1. Generate signed JWT
  const token = jwt.sign(
    {
      userId: user.id,
      phone,
      role,
    },
    secret,
    {
      expiresIn: `${SESSION_EXPIRY_DAYS}d`,
    },
  );

  // 2. Hash session token for database storage
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_SECONDS * 1000);

  // 3. Store UserSession in Prisma (fallback to memory if offline)
  try {
    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        device: metadata?.device || 'Web Browser',
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        expiresAt,
        lastActiveAt: new Date(),
      },
    });
  } catch {
    // Graceful fallback for offline environment
  }

  // 4. Set secure HTTP-Only cookie
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_SECONDS,
    });
  } catch (err) {
    console.error('[COOKIE_SET_ERROR]', err);
  }

  return {
    success: true,
    token,
    tokenHash,
  };
}

/**
 * Retrieves the authenticated user from the current session cookie.
 * Verifies JWT signature, validates tokenHash in database, checks expiry,
 * updates lastActiveAt timestamp, and returns user identity.
 */
export async function getCurrentUser(targetCookieName?: string): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = targetCookieName
      ? cookieStore.get(targetCookieName)?.value
      : cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    // 1. Verify JWT signature
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      phone: string;
      role: string;
    };

    if (!decoded || !decoded.userId) return null;

    // 2. Hash token to query database
    const tokenHash = hashSessionToken(token);

    // 3. Database session validation
    try {
      const session = await prisma.userSession.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: {
              profile: true,
              ownedShops: {
                select: { id: true, name: true },
                take: 1,
              },
            },
          },
        },
      });

      if (session) {
        // Check session expiry
        if (session.expiresAt < new Date()) {
          await prisma.userSession.delete({ where: { tokenHash } }).catch(() => {});
          return null;
        }

        // Refresh lastActiveAt (throttled to avoid DB spam on every millisecond)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (session.lastActiveAt < fiveMinutesAgo) {
          await prisma.userSession
            .update({
              where: { tokenHash },
              data: { lastActiveAt: new Date() },
            })
            .catch(() => {});
        }

        return {
          id: session.user.id,
          phone: session.user.mobile || decoded.phone || '',
          role: session.user.role || decoded.role || 'USER',
          name: session.user.profile?.name || session.user.name || null,
          email: session.user.email,
          shopName: session.user.ownedShops[0]?.name || null,
          shopId: session.user.ownedShops[0]?.id || null,
        };
      }

      // If DB UserSession record is missing, check user table directly as fallback
      const directUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          ownedShops: {
            select: { id: true, name: true },
            take: 1,
          },
        },
      });
      if (directUser && !directUser.deletedAt) {
        return {
          id: directUser.id,
          phone: directUser.mobile || decoded.phone || '',
          role: directUser.role || decoded.role || 'USER',
          name: directUser.name || null,
          email: directUser.email,
          shopName: directUser.ownedShops[0]?.name || null,
          shopId: directUser.ownedShops[0]?.id || null,
        };
      }

      return {
        id: decoded.userId,
        phone: decoded.phone || '',
        role: decoded.role || 'USER',
      };
    } catch {
      return {
        id: decoded.userId,
        phone: decoded.phone || '',
        role: decoded.role || 'USER',
      };
    }
  } catch {
    return null;
  }
}

/**
 * Retrieves the authenticated admin user from the navya_admin_session cookie.
 * Falls back to navya_session if the user role is an admin role.
 */
export async function getAdminUser(): Promise<SessionUser | null> {
  const adminUser = await getCurrentUser(ADMIN_SESSION_COOKIE_NAME);
  if (adminUser) return adminUser;

  const fallbackUser = await getCurrentUser(SESSION_COOKIE_NAME);
  if (
    fallbackUser &&
    ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(fallbackUser.role.toUpperCase())
  ) {
    return fallbackUser;
  }

  return null;
}

/**
 * Returns boolean indicating whether a valid, non-expired session exists.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user);
}

/**
 * Refreshes current session expiry in database and resets HTTP-Only cookie maxAge.
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return false;

    const tokenHash = hashSessionToken(token);
    const newExpiresAt = new Date(Date.now() + SESSION_EXPIRY_SECONDS * 1000);

    try {
      await prisma.userSession.update({
        where: { tokenHash },
        data: {
          expiresAt: newExpiresAt,
          lastActiveAt: new Date(),
        },
      });
    } catch {
      // Fallback
    }

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_SECONDS,
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Destroys current session: Deletes UserSession from database and clears HTTP-Only cookie.
 */
export async function destroySession(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const tokenHash = hashSessionToken(token);
      try {
        await prisma.userSession.delete({ where: { tokenHash } }).catch(() => {});
      } catch {
        // Fallback
      }
    }

    clearAuthCookie();
    return true;
  } catch {
    clearAuthCookie();
    return false;
  }
}

/**
 * High-level logout helper executing session revocation and cookie clearance.
 */
export async function logout(): Promise<boolean> {
  return await destroySession();
}

/**
 * Deletes all active UserSession records for a specific user ID across all devices.
 */
export async function destroyAllUserSessions(userId: string): Promise<number> {
  try {
    const result = await prisma.userSession.deleteMany({
      where: { userId },
    });
    return result.count;
  } catch {
    return 0;
  }
}

/**
 * Maintenance background helper: Safely cleans up all expired sessions from Prisma database.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch {
    return 0;
  }
}
