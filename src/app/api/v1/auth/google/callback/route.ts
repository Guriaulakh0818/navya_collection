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

function getCanonicalBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    return envUrl.replace(/\/$/, '');
  }

  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto =
    request.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');

  return `${proto}://${host}`;
}

function sanitizeRedirectTarget(target: string | null | undefined): string {
  if (!target || typeof target !== 'string') return '/';
  const isSafeRelative =
    target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\');
  if (!isSafeRelative) return '/';
  if (target.startsWith('/admin')) return '/';
  return target;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const baseUrl = getCanonicalBaseUrl(request);
  const redirectUri = `${baseUrl}/api/v1/auth/google/callback`;

  // Read stored CSRF nonce from secure cookie
  const cookieNonce = request.cookies.get('oauth_state_nonce')?.value;

  // Helper to create error redirect while clearing nonce cookie
  const createErrorRedirect = (errorCode: string) => {
    const res = NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorCode)}`, baseUrl),
    );
    res.cookies.set('oauth_state_nonce', '', { maxAge: 0, path: '/' });
    return res;
  };

  if (error || !code) {
    console.error(
      '❌ Google OAuth authorization error:',
      error || 'No authorization code received',
    );
    return createErrorRedirect(error || 'Access denied');
  }

  // Decode & verify state parameter for CSRF mitigation
  let redirectTarget = '/';
  let receivedNonce: string | null = null;
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      receivedNonce = decodedState?.nonce || null;
      redirectTarget = sanitizeRedirectTarget(decodedState?.redirect);
    } catch {
      redirectTarget = '/';
    }
  }

  if (!cookieNonce || !receivedNonce || cookieNonce !== receivedNonce) {
    console.error('❌ [GOOGLE_OAUTH_CSRF_ERROR] State nonce mismatch or cookie expired.');
    return createErrorRedirect('InvalidOAuthState');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Google OAuth credentials missing in environment');
    return createErrorRedirect('OAuthConfigurationError');
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
      return createErrorRedirect('TokenExchangeFailed');
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser: GoogleUserInfo = await userInfoRes.json();
    if (!userInfoRes.ok || !googleUser.email) {
      console.error('❌ Failed to fetch Google user profile:', googleUser);
      return createErrorRedirect('ProfileFetchFailed');
    }

    // Security Check: Enforce email verification by Google
    if (!googleUser.email_verified) {
      console.error(`❌ [GOOGLE_OAUTH] Rejected unverified email: ${googleUser.email}`);
      return createErrorRedirect('EmailNotVerifiedByGoogle');
    }

    const email = googleUser.email.toLowerCase().trim();

    // 3. Find or Create User in database with concurrency protection
    let user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      try {
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
      } catch (createErr: any) {
        // Concurrency handling: if parallel request created user
        if (createErr?.code === 'P2002') {
          user = await prisma.user.findFirst({ where: { email } });
        }
        if (!user) throw createErr;
      }
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

    // 4. Synchronize into accounts table (Prisma model Account)
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
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

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

    // Destination defaults to normal user storefront / requested destination (never admin)
    let destination = redirectTarget;
    if (destination.startsWith('/admin')) {
      destination = '/';
    }
    if (destination === '/' && user.role === 'SELLER') {
      destination = '/seller/products';
    }

    console.log(`✅ [GOOGLE_OAUTH] Successfully logged in ${email}, redirecting to ${destination}`);
    const successRedirect = NextResponse.redirect(new URL(destination, baseUrl));
    successRedirect.cookies.set('oauth_state_nonce', '', { maxAge: 0, path: '/' });
    return successRedirect;
  } catch (err: any) {
    console.error('❌ [GOOGLE_OAUTH_FATAL_ERROR]:', err);
    return createErrorRedirect('AuthenticationFailed');
  }
}
