import crypto from 'crypto';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { sendEmailOtp } from '@/lib/brevo';
import { ensureUserExists } from '@/lib/ensure-user';
import { prisma } from '@/lib/prisma';
import { createUserSession } from '@/lib/session';

// Fallback memory store if database is unreachable or offline
const memoryEmailOtpVerificationStore = new Map<
  string,
  {
    otpHash: string;
    purpose: string;
    expiresAt: Date;
    attempts: number;
    resendCount: number;
    isVerified: boolean;
    lastSentAt: Date;
  }
>();

export interface SendOtpResult {
  status: 'SUCCESS' | 'COOLDOWN' | 'MAX_RESEND' | 'INVALID_EMAIL' | 'ERROR';
  message: string;
  statusCode: number;
  remainingSeconds?: number;
}

export interface VerifyOtpResult {
  status: 'SUCCESS' | 'EXPIRED' | 'MAX_ATTEMPTS' | 'INVALID_OTP' | 'NOT_FOUND' | 'ERROR';
  message: string;
  statusCode: number;
  user?: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

/**
 * Mask email address for security logging (e.g. "gurvinder@gmail.com" -> "gu***er@gmail.com")
 */
export function maskEmailAddress(email: string): string {
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (!domain) return '***@***';
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${local[1]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Service handling Email OTP Generation, Brevo Email Dispatch, Bcrypt Hashing, Rate Limiting,
 * Verification, Database Storage, and User Account Provisioning.
 */
export class OtpService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP.
   */
  static generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes plain OTP using bcrypt salt rounds (10).
   */
  static async hashOtp(otp: string): Promise<string> {
    return await bcrypt.hash(otp, 10);
  }

  /**
   * Validates email format.
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  }

  /**
   * Sends an Email OTP to the specified address following rate limiting,
   * database storage (Prisma OtpVerification), and Brevo Email API dispatch.
   */
  static async sendOtp(rawEmail: string): Promise<SendOtpResult> {
    const timestamp = new Date().toISOString();
    const email = rawEmail.trim().toLowerCase();

    if (!this.isValidEmail(email)) {
      console.log(
        `[${timestamp}] [EMAIL_OTP_SEND] Email: ${maskEmailAddress(rawEmail)} | Status: INVALID_EMAIL`,
      );
      return {
        status: 'INVALID_EMAIL',
        message: 'Please enter a valid email address.',
        statusCode: 400,
      };
    }

    const maskedEmail = maskEmailAddress(email);
    const now = new Date();

    // Development Test Mode Bypass for test@navyacollection.store or test@example.com
    const isDev = process.env.NODE_ENV === 'development';
    const isDevTestEmail =
      isDev && (email === 'test@navyacollection.store' || email === 'test@example.com');

    if (isDevTestEmail) {
      console.log(
        `[${timestamp}] [EMAIL_OTP_SEND] [DEV_TEST_MODE] Bypassing Brevo for test email ${email}`,
      );
      const devOtpHash = await this.hashOtp('123456');
      const devExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

      try {
        await prisma.otpVerification.upsert({
          where: { phone: email },
          update: {
            otpHash: devOtpHash,
            purpose: 'AUTHENTICATION',
            expiresAt: devExpiresAt,
            attempts: 0,
            resendCount: 1,
            isVerified: false,
            updatedAt: now,
          },
          create: {
            phone: email,
            otpHash: devOtpHash,
            purpose: 'AUTHENTICATION',
            expiresAt: devExpiresAt,
            attempts: 0,
            resendCount: 1,
            isVerified: false,
          },
        });
      } catch {
        memoryEmailOtpVerificationStore.set(email, {
          otpHash: devOtpHash,
          purpose: 'AUTHENTICATION',
          expiresAt: devExpiresAt,
          attempts: 0,
          resendCount: 1,
          isVerified: false,
          lastSentAt: now,
        });
      }

      return {
        status: 'SUCCESS',
        message: 'OTP sent successfully to email (Development Test Mode: Use 123456)',
        statusCode: 200,
      };
    }

    // 1. Fetch Existing OTP Record
    let existingRecord: {
      otpHash: string;
      purpose: string;
      expiresAt: Date;
      attempts: number;
      resendCount: number;
      isVerified: boolean;
      updatedAt?: Date;
      lastSentAt?: Date;
    } | null = null;

    try {
      const dbRecord = await prisma.otpVerification.findUnique({
        where: { phone: email },
      });
      if (dbRecord) {
        existingRecord = {
          ...dbRecord,
          lastSentAt: dbRecord.updatedAt,
        };
      }
    } catch {
      const memRecord = memoryEmailOtpVerificationStore.get(email);
      if (memRecord) existingRecord = memRecord;
    }

    // 2. Cooldown & Resend Rate Limiting Checks
    if (existingRecord) {
      const lastUpdatedMs = existingRecord.lastSentAt
        ? existingRecord.lastSentAt.getTime()
        : existingRecord.expiresAt.getTime() - 5 * 60 * 1000;
      const elapsedSinceLastUpdate = now.getTime() - lastUpdatedMs;
      const COOLDOWN_MS = 60 * 1000; // 60-second rate limit per email address

      if (elapsedSinceLastUpdate < COOLDOWN_MS && elapsedSinceLastUpdate >= 0) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsedSinceLastUpdate) / 1000);
        console.log(
          `[${timestamp}] [EMAIL_OTP_SEND] Email: ${maskedEmail} | Status: COOLDOWN (${remainingSeconds}s remaining)`,
        );
        return {
          status: 'COOLDOWN',
          message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
          statusCode: 429,
          remainingSeconds,
        };
      }

      // Max 3 resends within 5-minute active window
      const isStillActive = existingRecord.expiresAt > now;
      if (isStillActive && existingRecord.resendCount >= 3) {
        console.log(
          `[${timestamp}] [EMAIL_OTP_SEND] Email: ${maskedEmail} | Status: MAX_RESEND_EXCEEDED`,
        );
        return {
          status: 'MAX_RESEND',
          message: 'Maximum OTP resend limit reached. Please try again after 5 minutes.',
          statusCode: 429,
        };
      }
    }

    // 3. Generate Cryptographically Secure OTP & Hash with Bcrypt
    const plainOtp = this.generateSecureOtp();
    const otpHash = await this.hashOtp(plainOtp);

    // 5-Minute OTP Expiry
    const OTP_EXPIRY_MINUTES = 5;
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const isStillActive = Boolean(existingRecord && existingRecord.expiresAt > now);
    const resendCount = existingRecord && isStillActive ? existingRecord.resendCount + 1 : 1;

    // 4. Save/Replace OTP in Prisma Database (OtpVerification)
    try {
      await prisma.otpVerification.upsert({
        where: { phone: email },
        update: {
          otpHash,
          purpose: 'AUTHENTICATION',
          expiresAt,
          attempts: 0,
          resendCount,
          isVerified: false,
          updatedAt: now,
        },
        create: {
          phone: email,
          otpHash,
          purpose: 'AUTHENTICATION',
          expiresAt,
          attempts: 0,
          resendCount: 1,
          isVerified: false,
        },
      });
    } catch {
      memoryEmailOtpVerificationStore.set(email, {
        otpHash,
        purpose: 'AUTHENTICATION',
        expiresAt,
        attempts: 0,
        resendCount,
        isVerified: false,
        lastSentAt: now,
      });
    }

    // 5. Dispatch Email OTP via Email Service API
    console.log(`[${timestamp}] [EMAIL_DISPATCH] Email: ${maskedEmail}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 [DEV_OTP_KEY] Verification OTP for ${email} is: ${plainOtp}`);
    }
    const emailResult = await sendEmailOtp(email, plainOtp);
    console.log(`[${timestamp}] [EMAIL_RESULT] Email: ${maskedEmail}`, emailResult);

    if (!emailResult.success) {
      return {
        status: 'ERROR',
        message: emailResult.error || 'Failed to dispatch email verification code.',
        statusCode: 500,
      };
    }

    return {
      status: 'SUCCESS',
      message: `Verification code sent to ${maskedEmail}`,
      statusCode: 200,
    };
  }

  /**
   * Verifies submitted OTP against hashed bcrypt value in OtpVerification table.
   * Manages failed attempt counters (max 5 attempts before deletion), expiry,
   * OTP deletion on success, Prisma User provision, and UserSession creation.
   */
  static async verifyOtp(rawEmail: string, plainOtp: string): Promise<VerifyOtpResult> {
    const timestamp = new Date().toISOString();
    const email = rawEmail.trim().toLowerCase();

    if (!this.isValidEmail(email)) {
      console.log(
        `[${timestamp}] [EMAIL_OTP_VERIFY] Email: ${maskEmailAddress(rawEmail)} | Status: INVALID_EMAIL`,
      );
      return {
        status: 'INVALID_OTP',
        message: 'Invalid email address format.',
        statusCode: 400,
      };
    }

    const maskedEmail = maskEmailAddress(email);
    const now = new Date();

    // Development Test Mode Bypass for test@navyacollection.store or test@example.com & 123456
    const isDev = process.env.NODE_ENV === 'development';
    const isDevTestBypass =
      isDev &&
      (email === 'test@navyacollection.store' || email === 'test@example.com') &&
      plainOtp === '123456';

    if (!isDevTestBypass) {
      // 1. Retrieve OTP Verification record
      let record: {
        id?: string;
        phone: string;
        otpHash: string;
        expiresAt: Date;
        attempts: number;
        isVerified: boolean;
      } | null = null;

      try {
        const dbRecord = await prisma.otpVerification.findUnique({
          where: { phone: email },
        });
        if (dbRecord) record = dbRecord;
      } catch {
        const memRecord = memoryEmailOtpVerificationStore.get(email);
        if (memRecord) record = { phone: email, ...memRecord };
      }

      if (!record || record.isVerified) {
        console.log(`[${timestamp}] [EMAIL_OTP_VERIFY] Email: ${maskedEmail} | Status: NOT_FOUND`);
        return {
          status: 'NOT_FOUND',
          message: 'Invalid or expired verification code.',
          statusCode: 400,
        };
      }

      // 2. Expiry Verification Check
      if (record.expiresAt < now) {
        try {
          await prisma.otpVerification.delete({ where: { phone: email } });
        } catch {
          memoryEmailOtpVerificationStore.delete(email);
        }

        console.log(`[${timestamp}] [EMAIL_OTP_VERIFY] Email: ${maskedEmail} | Status: EXPIRED`);
        return {
          status: 'EXPIRED',
          message: 'Verification code has expired. Please request a new code.',
          statusCode: 400,
        };
      }

      // 3. Max Attempts Verification Check
      if (record.attempts >= 4) {
        try {
          await prisma.otpVerification.delete({ where: { phone: email } });
        } catch {
          memoryEmailOtpVerificationStore.delete(email);
        }

        console.log(
          `[${timestamp}] [EMAIL_OTP_VERIFY] Email: ${maskedEmail} | Status: MAX_ATTEMPTS_EXCEEDED`,
        );
        return {
          status: 'MAX_ATTEMPTS',
          message: 'Maximum verification attempts exceeded. Please request a new code.',
          statusCode: 400,
        };
      }

      // 4. Bcrypt Hashed OTP Comparison
      const isMatch = await bcrypt.compare(plainOtp, record.otpHash);

      if (!isMatch) {
        const newAttempts = record.attempts + 1;

        if (newAttempts >= 4) {
          try {
            await prisma.otpVerification.delete({ where: { phone: email } });
          } catch {
            memoryEmailOtpVerificationStore.delete(email);
          }

          console.log(
            `[${timestamp}] [EMAIL_OTP_VERIFY] Email: ${maskedEmail} | Status: MAX_ATTEMPTS_EXCEEDED (Attempts: ${newAttempts})`,
          );
          return {
            status: 'MAX_ATTEMPTS',
            message: 'Maximum verification attempts exceeded. Please request a new code.',
            statusCode: 400,
          };
        }

        // Increment attempt counter in DB/Memory
        try {
          await prisma.otpVerification.update({
            where: { phone: email },
            data: { attempts: newAttempts },
          });
        } catch {
          if (memoryEmailOtpVerificationStore.has(email)) {
            const existingMem = memoryEmailOtpVerificationStore.get(email)!;
            memoryEmailOtpVerificationStore.set(email, { ...existingMem, attempts: newAttempts });
          }
        }

        const remainingAttempts = 4 - newAttempts;
        console.log(
          `[${timestamp}] [EMAIL_OTP_VERIFY] Email: ${maskedEmail} | Status: INVALID_OTP (Attempt ${newAttempts}/4)`,
        );

        return {
          status: 'INVALID_OTP',
          message: `Invalid verification code. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.`,
          statusCode: 400,
        };
      }

      // 5. Verification Succeeded -> Delete OTP record to prevent reuse
      try {
        await prisma.otpVerification.delete({ where: { phone: email } });
      } catch {
        memoryEmailOtpVerificationStore.delete(email);
      }
    } else {
      console.log(
        `[${timestamp}] [EMAIL_OTP_VERIFY] [DEV_TEST_MODE] Verification bypassed for test email ${email} with code ${plainOtp}`,
      );
    }

    // 6. User Account Lookup / Provisioning via Prisma
    let user: { id: string; email: string; name?: string; role: string } = {
      id: `usr_${email.replace(/[^a-z0-9]/gi, '_')}`,
      email,
      name: 'Navya Customer',
      role: 'USER',
    };

    try {
      const dbUser = await prisma.user.findFirst({
        where: { email },
        include: { profile: true },
      });

      if (dbUser) {
        user = {
          id: dbUser.id,
          email: dbUser.email || email,
          name: dbUser.name || dbUser.profile?.name || 'Navya Customer',
          role: dbUser.role || 'USER',
        };
      } else {
        const defaultName = email.split('@')[0] || 'Navya Customer';
        const newUser = await prisma.user.create({
          data: {
            email,
            name: defaultName,
            role: Role.USER,
            profile: {
              create: {
                name: defaultName,
              },
            },
            cart: {
              create: {},
            },
          },
          include: { profile: true },
        });

        user = {
          id: newUser.id,
          email: newUser.email || email,
          name: newUser.name || newUser.profile?.name || defaultName,
          role: newUser.role || 'USER',
        };
      }
    } catch {
      user = {
        id: `usr_${email.replace(/[^a-z0-9]/gi, '_')}`,
        email,
        name: 'Navya Customer',
        role: 'USER',
      };
    }

    // Ensure PostgreSQL User record exists to satisfy foreign key constraints
    try {
      const validUserId = await ensureUserExists(user.id, email);
      user.id = validUserId;
    } catch {}

    // 7. Create Production Customer Session
    await createUserSession(user);

    console.log(
      `[${timestamp}] [EMAIL_OTP_VERIFY] Email: ${maskedEmail} | Status: SUCCESS | Session Created`,
    );

    return {
      status: 'SUCCESS',
      message: 'Authentication successful.',
      statusCode: 200,
      user,
    };
  }
}
