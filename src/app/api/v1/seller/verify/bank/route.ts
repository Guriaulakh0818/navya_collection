import { NextRequest, NextResponse } from 'next/server';

import { KycVerificationService } from '@/backend/services/kyc-verification.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accountNumber, ifscCode, accountHolderName } = body;

    if (!accountNumber || !ifscCode) {
      return NextResponse.json(
        { success: false, message: 'Bank Account Number and IFSC Code are required.' },
        { status: 400 },
      );
    }

    const result = await KycVerificationService.verifyBankAccount(
      accountNumber,
      ifscCode,
      accountHolderName,
    );

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
      { success: false, message: error.message || 'Failed to verify Bank Account.' },
      { status: 500 },
    );
  }
}
