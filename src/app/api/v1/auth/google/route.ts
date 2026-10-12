/**
 * Navya Collection - Google OAuth 2.0 Initiation Route
 * Initiates the Google OAuth consent flow for store customers & boutique sellers.
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, message: 'Google OAuth is not configured on this server.' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  let redirectTarget = searchParams.get('redirect') || '/';
  if (redirectTarget.startsWith('/admin')) {
    redirectTarget = '/';
  }

  // Build the correct redirect_uri matching the request origin
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost:3000';
  const proto =
    request.headers.get('x-forwarded-proto') ||
    (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/v1/auth/google/callback`;

  // Encode state with redirect target
  const state = Buffer.from(JSON.stringify({ redirect: redirectTarget })).toString('base64url');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(googleAuthUrl.toString());
}
