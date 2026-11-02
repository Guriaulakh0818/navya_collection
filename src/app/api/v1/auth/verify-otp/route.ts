import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ReferralService } from '@/backend/services/referral.service';
import { verifyOtpSchema } from '@/features/auth/schemas/auth.schemas';
import { OtpService } from '@/features/auth/services/otp.service';
import { createUserSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_SECONDS } from '@/lib/session';

/**
 * POST /api/v1/auth/verify-otp
 *
 * Production-ready Email OTP Verification API endpoint for Navya Collection via Brevo.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = verifyOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error.issues[0]?.message ||
            'Invalid email address or 6-digit verification code',
        },
        { status: 400 },
      );
    }

    const email = validation.data.email;
    const otp = validation.data.otp;

    const cookieStore = await cookies();
    const otpTicket = cookieStore.get('navya_otp_ticket')?.value;

    const result = await OtpService.verifyOtp(email, otp, otpTicket);

    if (result.status === 'SUCCESS' && result.user) {
      // Auto-claim referral welcome bonus if friend arrived with a referral code cookie
      if (result.isNewUser) {
        const referralCode = cookieStore.get('jiivaa_referral_code')?.value;
        if (referralCode && ReferralService.isValidReferralCode(referralCode)) {
          await ReferralService.recordFriendJoined({
            code: referralCode,
            friendName: result.user.name || result.user.email || 'Friend',
            friendUserId: result.user.id,
          }).catch((err) => console.warn('[AUTO_REFERRAL_CLAIM_ERROR]', err));
        }
      }

      // 1. Generate session token for authenticated user
      const sessionResult = await createUserSession(result.user);

      // 2. Return JSON response with explicit Set-Cookie header on NextResponse
      const response = NextResponse.json(
        {
          success: true,
          message: result.message,
          user: result.user,
          isNewUser: Boolean(result.isNewUser),
        },
        { status: 200 },
      );

      // Clear the temporary OTP ticket cookie
      response.cookies.set('navya_otp_ticket', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

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
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message,
      },
      { status: result.statusCode },
    );
  } catch (error: any) {
    console.error('❌ Failed to verify OTP:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to verify code. Please try again later.',
      },
      { status: 500 },
    );
  }
}
