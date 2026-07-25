import { NextResponse } from 'next/server';

import { sendOtpSchema } from '@/features/auth/schemas/auth.schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = sendOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message || 'Invalid mobile number' },
        { status: 400 },
      );
    }

    const { mobile } = validation.data;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`OTP for ${mobile}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
