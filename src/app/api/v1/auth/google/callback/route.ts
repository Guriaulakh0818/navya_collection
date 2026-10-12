import { NextRequest, NextResponse } from 'next/server';

import { createUserSession } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost:3000';
  const proto =
    request.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/v1/auth/google/callback`;

  // Decode redirect target from state if present
  let redirectTarget = '/';
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (decodedState?.redirect && typeof decodedState.redirect === 'string') {
        redirectTarget = decodedState.redirect.startsWith('/') ? decodedState.redirect : '/';
      }
    } catch {
      redirectTarget = '/';
    }
  }

  if (error || !code) {
    console.error('❌ Google OAuth authorization error:', error || 'No authorization code received');
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error || 'Access denied')}`, `${proto}://${host}`),
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Google OAuth credentials missing in environment');
    return NextResponse.redirect(
      new URL('/login?error=OAuthConfigurationError', `${proto}://${host}`),
    );
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      console.error('❌ Google token exchange failed:', tokenData);
      return NextResponse.redirect(
        new URL('/login?error=TokenExchangeFailed', `${proto}://${host}`),
      );
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser: GoogleUserInfo = await userInfoRes.json();
    if (!userInfoRes.ok || !googleUser.email) {
      console.error('❌ Failed to fetch Google user profile:', googleUser);
      return NextResponse.redirect(
        new URL('/login?error=ProfileFetchFailed', `${proto}://${host}`),
      );
    }

    const email = googleUser.email.toLowerCase().trim();

    // 3. Find or Create User in database
    let user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: googleUser.name || email.split('@')[0],
          avatar: googleUser.picture || null,
          role: 'USER',
          approvalStatus: 'APPROVED',
        },
      });
      console.log(`✅ [GOOGLE_OAUTH] Created new customer account for ${email} (${user.id})`);
    } else {
      // Update avatar if not already set
      if (!user.avatar && googleUser.picture) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { avatar: googleUser.picture },
          })
          .catch(() => {});
      }
    }

    // 4. Synchronize into Supabase `accounts` table (Prisma model Account)
    const expiresAtSeconds = tokenData.expires_in
      ? Math.floor(Date.now() / 1000) + tokenData.expires_in
      : null;

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleUser.sub,
        },
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleUser.sub,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAtSeconds,
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope || 'openid email profile',
        id_token: tokenData.id_token || null,
      },
      update: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || undefined,
        expires_at: expiresAtSeconds || undefined,
        id_token: tokenData.id_token || undefined,
      },
    });

    console.log(`✅ [GOOGLE_OAUTH] Synchronized record in accounts table for user ${user.id}`);

    // 5. Establish user session (UserSession in DB + secure HTTP-only cookie)
    const userAgent = request.headers.get('user-agent') || 'Google OAuth Browser';
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    await createUserSession(
      {
        id: user.id,
        email: user.email,
        phone: user.mobile,
        role: user.role,
      },
      {
        device: 'Google OAuth Sign-In',
        userAgent,
        ipAddress,
      },
    );

    // Dynamic destination based on role if default
    let destination = redirectTarget;
    if (
      destination === '/' &&
      ['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(String(user.role).toUpperCase())
    ) {
      destination = '/admin';
    } else if (destination === '/' && user.role === 'SELLER') {
      destination = '/seller/products';
    }

    console.log(`✅ [GOOGLE_OAUTH] Successfully logged in ${email}, redirecting to ${destination}`);
    return NextResponse.redirect(new URL(destination, `${proto}://${host}`));
  } catch (err: any) {
    console.error('❌ [GOOGLE_OAUTH_FATAL_ERROR]:', err);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(err.message || 'ServerError')}`,
        `${proto}://${host}`,
      ),
    );
  }
}
