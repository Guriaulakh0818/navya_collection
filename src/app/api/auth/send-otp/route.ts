import { NextRequest } from 'next/server';

import { POST as handleSendOtp } from '@/app/api/v1/auth/send-otp/route';

export async function POST(request: NextRequest) {
  return handleSendOtp(request);
}
