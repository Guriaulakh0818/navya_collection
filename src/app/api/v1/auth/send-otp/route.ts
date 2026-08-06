import { NextRequest, NextResponse } from 'next/server';

import { sendOtpSchema } from '@/features/auth/schemas/auth.schemas';
import { OtpService } from '@/features/auth/services/otp.service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/v1/auth/send-otp
 *
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = sendOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid email address.',
        },
        { status: 400 },
      );
    }

    const email = validation.data.email.trim().toLowerCase();
    const clientIp = getClientIp(request);

    // Track rate limit per email and IP to avoid tunnel proxy IP blocks
    const rateCheck = checkRateLimit(`send_otp_${email}_${clientIp}`, {
      limit: 10,
      windowMs: 5 * 60 * 1000, // 5 minutes
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many verification code requests for this email. Please wait a few minutes.',
        },
        { status: 429 },
      );
    }

    const result = await OtpService.sendOtp(email);

    if (result.status === 'SUCCESS') {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message,
      },
      { status: result.statusCode },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send email verification code. Please try again later.',
      },
      { status: 500 },
    );
  }
}
