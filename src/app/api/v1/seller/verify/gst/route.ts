import { NextRequest, NextResponse } from 'next/server';

import { KycVerificationService } from '@/backend/services/kyc-verification.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { gstin, pan } = body;

    if (!gstin) {
      return NextResponse.json({ success: false, message: 'GSTIN is required.' }, { status: 400 });
    }

    const result = await KycVerificationService.verifyGstin(gstin, pan);

    if (!result.isValid) {
      return NextResponse.json(
        { success: false, message: result.message, data: result },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to verify GSTIN.' },
      { status: 500 },
    );
  }
}
