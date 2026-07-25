import { NextResponse } from 'next/server';

import { verifyOtpSchema } from '@/features/auth/schemas/auth.schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = verifyOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message || 'Invalid OTP' },
        { status: 400 },
      );
    }

    const { mobile, otp } = validation.data;

    if (otp !== '123456') {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP. Use 123456 for testing.' },
        { status: 401 },
      );
    }

    const mockUser = {
      id: 'user_123',
      mobile,
      name: 'Test User',
      role: 'customer',
    };

    return NextResponse.json({
      success: true,
      token: 'mock-jwt-token',
      user: mockUser,
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 });
  }
}
