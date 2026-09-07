import { NextRequest, NextResponse } from 'next/server';

import { KycVerificationService } from '@/backend/services/kyc-verification.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ifsc } = body;

    if (!ifsc) {
      return NextResponse.json(
        { success: false, message: 'IFSC code is required.' },
        { status: 400 },
      );
    }

    const result = await KycVerificationService.lookupIfsc(ifsc);

    if (!result.isValid) {
      return NextResponse.json(
        { success: false, message: result.error || 'Invalid IFSC Code.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'IFSC code verified successfully.',
        data: result,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to verify IFSC code.' },
      { status: 500 },
    );
  }
}
