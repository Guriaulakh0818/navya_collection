/**
 * Navya Collection - Google OAuth 2.0 Initiation Route
 * Initiates the Google OAuth consent flow for store customers & boutique sellers.
 * Includes CSRF mitigation (cryptographic state nonce in HttpOnly cookie),
 * canonical base URL resolution, and protocol-relative redirect sanitization.
 */
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

function sanitizeRedirectTarget(target: string | null): string {
  if (!target || typeof target !== 'string') return '/';
  // Block protocol-relative URLs (e.g. //evil.com or /\evil.com)
  const isSafeRelative =
    target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\');
  if (!isSafeRelative) return '/';
  // Forbid customer Google OAuth redirecting into admin portal
  if (target.startsWith('/admin')) return '/';
  return target;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, message: 'Google OAuth is not configured on this server.' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const redirectTarget = sanitizeRedirectTarget(searchParams.get('redirect'));

  // Build canonical redirect_uri matching Google Console configuration
  const baseUrl = getCanonicalBaseUrl(request);
  const redirectUri = `${baseUrl}/api/v1/auth/google/callback`;

  // Cryptographic nonce for CSRF mitigation
  const nonce = crypto.randomUUID();

  // Encode state with nonce & sanitized redirect target
  const state = Buffer.from(JSON.stringify({ nonce, redirect: redirectTarget })).toString(
    'base64url',
  );

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Store CSRF nonce in secure HttpOnly cookie (valid for 10 minutes)
  response.cookies.set('oauth_state_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  return response;
}
