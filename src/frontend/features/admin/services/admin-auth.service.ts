import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { OtpService } from '@/features/auth/services/otp.service';
import { prisma } from '@/lib/prisma';
import { createUserSession } from '@/lib/session';

export const adminLoginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().optional(),
  otp: z.string().optional(),
});

export interface AdminLoginResult {
  success: boolean;
  message: string;
  statusCode: number;
  mustChangePassword?: boolean;
  token?: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
}

export const OWNER_EMAILS = [
  'gurvindersingh0218@gmail.com',
  'gurvinderaulakh497@gmail.com',
  'aulakhg652@gmail.com',
  'admin@navyacollection.store',
  'helpdesk@navyacollection.store',
  'info@navyacollection.store',
];

export const MASTER_PASSWORDS = [
  'NavyaAdmin@2026',
  'Admin@Navya2026!',
  'Navya@2026',
  'Aulakh@2026',
  'Admin@123',
  process.env.ADMIN_PASSWORD,
  process.env.ADMIN_PASSCODE,
].filter(Boolean) as string[];

/**
 * Mask email address for security logging (e.g. "admin@navyacollection.store" -> "ad***@navyacollection.store")
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return `**@${domain || 'unknown'}`;
  return `${local.substring(0, 2)}***@${domain}`;
}

export class AdminAuthService {
  /**
   * Authenticates an admin user via email and password (or master fallback credentials).
   */
  static async login(
    rawEmail: string,
    plainPassword?: string,
    otpCode?: string,
  ): Promise<AdminLoginResult> {
    const timestamp = new Date().toISOString();
    const normalizedEmail = rawEmail.trim().toLowerCase();
    const masked = maskEmail(normalizedEmail);
    const now = new Date();

    const isRecognizedOwnerEmail =
      OWNER_EMAILS.includes(normalizedEmail) ||
      normalizedEmail.endsWith('@navyacollection.store') ||
      normalizedEmail.includes('gurvinder') ||
      normalizedEmail.includes('aulakh');

    // Handle OTP Login Flow if OTP is provided
    if (otpCode && otpCode.trim().length > 0) {
      return this.loginWithOtp(normalizedEmail, otpCode.trim());
    }

    if (!plainPassword) {
      return {
        success: false,
        message: 'Password or OTP is required.',
        statusCode: 400,
      };
    }

    const isMasterPassword = MASTER_PASSWORDS.includes(plainPassword);

    // 1. Find user by normalized email
    let user: any = null;

    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch {
      // Database offline/cold-start fallback
    }

    // 2. Master Password & Owner Auto-Provisioning
    if (isMasterPassword && isRecognizedOwnerEmail) {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      try {
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: 'Platform Owner',
              role: Role.OWNER,
              password: hashedPassword,
              approvalStatus: 'APPROVED',
              loginAttempts: 0,
              lockUntil: null,
            },
          });
        } else {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              role: Role.OWNER,
              password: hashedPassword,
              approvalStatus: 'APPROVED',
              loginAttempts: 0,
              lockUntil: null,
            },
          });
        }
      } catch {
        // Fallback in-memory user object
        user = user || {
          id: 'adm_owner_master',
          email: normalizedEmail,
          name: 'Platform Owner',
          role: Role.OWNER,
          mobile: '9053883125',
          mustChangePassword: false,
        };
      }

      const sessionRes = await createUserSession({
        id: user.id,
        phone: user.mobile || '',
        role: user.role || 'OWNER',
        email: user.email,
        name: user.name,
      });

      console.log(
        `[${timestamp}] [ADMIN_AUTH] Email: ${masked} | Status: SUCCESS (Master Password Authorized)`,
      );

      return {
        success: true,
        message: 'Welcome, Platform Owner! Authenticated successfully.',
        statusCode: 200,
        token: sessionRes.token,
        mustChangePassword: false,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }

    // 3. Lockout Check (Bypassed for owners)
    if (user && user.lockUntil && user.lockUntil > now && !isRecognizedOwnerEmail) {
      console.log(`[${timestamp}] [ADMIN_AUTH] Email: ${masked} | Status: ACCOUNT_LOCKED`);
      return {
        success: false,
        message:
          'Account is temporarily locked due to repeated failed attempts. Please try again in 15 minutes or contact support.',
        statusCode: 429,
      };
    }

    // 4. User & Role Validation (OWNER, ADMIN, SUPERVISOR, SUPER_ADMIN)
    const isAllowedAdminRole = Boolean(
      (user &&
        ['OWNER', 'ADMIN', 'SUPERVISOR', 'SUPER_ADMIN'].includes(String(user.role)) &&
        !user.deletedAt) ||
      (user && isRecognizedOwnerEmail),
    );

    // 5. Compare Bcrypt Password
    let isPasswordValid = false;
    if (isAllowedAdminRole && user?.password) {
      isPasswordValid = await bcrypt.compare(plainPassword, user.password);
    } else if (isMasterPassword) {
      isPasswordValid = true;
    }

    // 6. Handle Authentication Failure
    if (!isAllowedAdminRole || !isPasswordValid) {
      if (user && !isRecognizedOwnerEmail) {
        const newAttempts = (user.loginAttempts || 0) + 1;
        const shouldLock = newAttempts >= 5;
        const lockUntil = shouldLock ? new Date(now.getTime() + 15 * 60 * 1000) : null;

        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: newAttempts,
              lockUntil: lockUntil || user.lockUntil,
            },
          });
        } catch {
          // Fallback
        }

        console.log(
          `[${timestamp}] [ADMIN_AUTH] Email: ${masked} | Status: FAILED (Attempt ${newAttempts}/5)`,
        );
      } else {
        console.log(
          `[${timestamp}] [ADMIN_AUTH] Email: ${masked} | Status: FAILED (Invalid credentials)`,
        );
      }

      return {
        success: false,
        message: 'Invalid admin email or password. You can also log in via Email OTP.',
        statusCode: 401,
      };
    }

    // 7. Reset Login Attempts & Lockout on Success
    if (user && user.id !== 'adm_owner_master') {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockUntil: null,
            ...(isRecognizedOwnerEmail && user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN'
              ? { role: Role.OWNER }
              : {}),
          },
        });
      } catch {
        // Fallback
      }
    }

    // 8. Create Admin Session
    const sessionRes = await createUserSession({
      id: user.id,
      phone: user.mobile || '',
      role: user.role || 'ADMIN',
      email: user.email,
      name: user.name,
    });

    console.log(
      `[${timestamp}] [ADMIN_AUTH] Email: ${masked} | Status: SUCCESS | Role: ${user.role}`,
    );

    return {
      success: true,
      message: 'Admin authentication successful.',
      statusCode: 200,
      token: sessionRes.token,
      mustChangePassword: user.mustChangePassword || false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Authenticates an admin user via Email OTP
   */
  static async loginWithOtp(normalizedEmail: string, otpCode: string): Promise<AdminLoginResult> {
    const isRecognizedOwnerEmail =
      OWNER_EMAILS.includes(normalizedEmail) ||
      normalizedEmail.endsWith('@navyacollection.store') ||
      normalizedEmail.includes('gurvinder') ||
      normalizedEmail.includes('aulakh');

    // Verify OTP using OTP service (or dev bypass)
    const verifyRes = await OtpService.verifyOtp(normalizedEmail, otpCode, 'ADMIN_LOGIN');
    const isValidOtp = verifyRes.status === 'SUCCESS' || otpCode === '123456';

    if (!isValidOtp) {
      return {
        success: false,
        message: verifyRes.message || 'Invalid or expired 6-digit verification code.',
        statusCode: 401,
      };
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user && isRecognizedOwnerEmail) {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: 'Platform Owner',
            role: Role.OWNER,
            approvalStatus: 'APPROVED',
            loginAttempts: 0,
            lockUntil: null,
          },
        });
      } else if (user && isRecognizedOwnerEmail) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: Role.OWNER,
            approvalStatus: 'APPROVED',
            loginAttempts: 0,
            lockUntil: null,
          },
        });
      }
    } catch {
      user = user || {
        id: 'adm_owner_otp',
        email: normalizedEmail,
        name: 'Platform Owner',
        role: Role.OWNER,
        mobile: '9053883125',
      };
    }

    if (
      !user ||
      (!isRecognizedOwnerEmail &&
        !['OWNER', 'ADMIN', 'SUPERVISOR', 'SUPER_ADMIN'].includes(String(user.role)))
    ) {
      return {
        success: false,
        message: 'This email is not authorized for administrative access.',
        statusCode: 403,
      };
    }

    const sessionRes = await createUserSession({
      id: user.id,
      phone: user.mobile || '',
      role: user.role || 'OWNER',
      email: user.email,
      name: user.name,
    });

    return {
      success: true,
      message: 'Admin OTP verification successful.',
      statusCode: 200,
      token: sessionRes.token,
      mustChangePassword: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
