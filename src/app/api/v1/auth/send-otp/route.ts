import { NextRequest, NextResponse } from 'next/server';

import { validateEmailSafety } from '@/backend/security';
import { sendOtpSchema } from '@/features/auth/schemas/auth.schemas';
import { OtpService } from '@/features/auth/services/otp.service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/v1/auth/send-otp
 * Secure endpoint with honeypot trap, disposable/spam domain firewall, and IP rate limiting.
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

    const { email: rawEmail, hp_field, website, phone_confirmation } = validation.data;
    const email = rawEmail.trim().toLowerCase();
    const clientIp = getClientIp(request);

    // 1. HONEYPOT BOT TRAP: If any hidden bot trap field is filled, silently drop
    if (hp_field || website || phone_confirmation) {
      console.warn(`[BOT_HONEYPOT_TRAPPED] IP: ${clientIp} filled honeypot for ${email}`);
      return NextResponse.json(
        {
          success: true,
          message: 'Verification code sent to your email address.',
        },
        { status: 200 },
      );
    }

    // 2. EMAIL FIREWALL: Check for Russian, disposable, or high-risk spam domains
    const firewallResult = validateEmailSafety(email);
    if (!firewallResult.isAllowed) {
      console.warn(
        `[BOT_FIREWALL_BLOCKED] IP: ${clientIp} | Email: ${email} | Reason: ${firewallResult.reason}`,
      );
      if (firewallResult.isBotTrap) {
        // Return fake success to confuse and exhaust bot crawlers without spending email credits
        return NextResponse.json(
          {
            success: true,
            message: 'Verification code sent to your email address.',
          },
          { status: 200 },
        );
      }
      return NextResponse.json(
        {
          success: false,
          message:
            firewallResult.reason ||
            'This email provider is not supported. Please use Gmail, Outlook, or official work email.',
        },
        { status: 400 },
      );
    }

    // 3. IP-LEVEL RATE LIMIT: Max 4 requests per IP in 10 minutes
    const ipRateCheck = checkRateLimit(`send_otp_ip_${clientIp}`, {
      limit: 4,
      windowMs: 10 * 60 * 1000,
    });

    if (!ipRateCheck.success) {
      console.warn(`[IP_RATE_LIMIT_EXCEEDED] IP: ${clientIp} exceeded OTP limits.`);
      return NextResponse.json(
        {
          success: false,
          message:
            'Too many requests from your device. Please wait 10 minutes before requesting a new code.',
        },
        { status: 429 },
      );
    }

    // 4. EMAIL-LEVEL RATE LIMIT: Max 3 requests per email in 10 minutes
    const emailRateCheck = checkRateLimit(`send_otp_email_${email}`, {
      limit: 3,
      windowMs: 10 * 60 * 1000,
    });

    if (!emailRateCheck.success) {
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
      const response = NextResponse.json(
        {
          success: true,
          message: result.message,
        },
        { status: 200 },
      );

      if (result.otpTicket) {
        response.cookies.set('navya_otp_ticket', result.otpTicket, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 10 * 60, // 10 minutes
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
