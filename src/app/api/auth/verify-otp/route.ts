import { POST as handleVerifyOtp } from '@/app/api/v1/auth/verify-otp/route';

export async function POST(request: Request) {
  return handleVerifyOtp(request);
}
