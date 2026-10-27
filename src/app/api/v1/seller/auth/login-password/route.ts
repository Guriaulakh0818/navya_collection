import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/backend/lib/rate-limit';
import {
  createUserSession,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_SECONDS,
} from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const sellerLoginSchema = z.object({
  identifier: z.string().min(3, 'Please enter your registered email or mobile number').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limiting: 10 attempts per 15 minutes per IP
    const ipCheck = checkRateLimit(`seller_login_ip_${clientIp}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many login attempts. Please try again after 15 minutes.',
        },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = sellerLoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || 'Invalid input data',
        },
        { status: 400 },
      );
    }

    const { identifier, password } = validation.data;
    const isEmail = identifier.includes('@');
    const cleanedEmail = identifier.toLowerCase().trim();
    const cleanedMobile = identifier.replace(/\D/g, '').slice(-10);

    // Rate Limiting per account identifier
    const idCheck = checkRateLimit(`seller_login_id_${isEmail ? cleanedEmail : cleanedMobile}`, {
      limit: 7,
      windowMs: 15 * 60 * 1000,
    });

    if (!idCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Too many failed login attempts for this account. Please use OTP login or try again later.',
        },
        { status: 429 },
      );
    }

    // Lookup user by email OR mobile
    const orClauses = [];
    if (isEmail && cleanedEmail) {
      orClauses.push({ email: cleanedEmail });
    }
    if (cleanedMobile && cleanedMobile.length === 10) {
      orClauses.push({ mobile: cleanedMobile });
    }

    if (orClauses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid email address or 10-digit mobile number.',
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: orClauses,
      },
      include: {
        ownedShops: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
          take: 1,
        },
        sellerProfile: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No registered account found with these credentials. Please check or register as a new merchant.',
        },
        { status: 401 },
      );
    }

    // Role verification: Must be SELLER or have a shop/seller profile
    const isSeller =
      user.role === Role.SELLER ||
      (user.ownedShops && user.ownedShops.length > 0) ||
      Boolean(user.sellerProfile);

    if (!isSeller) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This account is registered as a customer, not a merchant. Please register your boutique store or sign in via the customer login.',
        },
        { status: 403 },
      );
    }

    // Check if account has a password
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No password was configured for this seller account. Please use "Login with OTP" to access your dashboard.',
        },
        { status: 400 },
      );
    }

    // Verify bcrypt password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Incorrect password. Please verify your credentials or use OTP login.',
        },
        { status: 401 },
      );
    }

    // Check for rejected application
    if (user.approvalStatus === 'REJECTED') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your merchant application was rejected. Please contact merchant support at support@jiivaakart.com.',
        },
        { status: 403 },
      );
    }

    // Determine target redirect
    const isApproved =
      user.approvalStatus === 'APPROVED' || user.ownedShops[0]?.status === 'APPROVED';
    const redirectUrl = isApproved ? '/seller/dashboard' : '/become-seller';

    // Create session token and cookie
    const shop = user.ownedShops[0];
    const sessionResult = await createUserSession({
      id: user.id,
      phone: user.mobile || '',
      email: user.email || '',
      role: Role.SELLER,
      name: user.name || '',
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Merchant authentication successful. Redirecting to portal...',
        redirectUrl,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: Role.SELLER,
          approvalStatus: user.approvalStatus,
          shopName: shop?.name || user.sellerProfile?.businessName,
        },
      },
      { status: 200 },
    );

    if (sessionResult?.token) {
      response.cookies.set(SESSION_COOKIE_NAME, sessionResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_EXPIRY_SECONDS,
      });
    }

    return response;
  } catch (error: any) {
    console.error('❌ [SELLER_PASSWORD_LOGIN_ERROR]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred during merchant login. Please try again.',
      },
      { status: 500 },
    );
  }
}
