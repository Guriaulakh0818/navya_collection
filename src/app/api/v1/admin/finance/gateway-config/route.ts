import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { PaymentGatewayConfigService } from '@/backend/services/payment-gateway-config.service';

const ALLOWED_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin privileges required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'RAZORPAY';
    const method = searchParams.get('paymentMethod') || undefined;

    const config = await PaymentGatewayConfigService.getEffectiveConfig({
      provider,
      paymentMethod: method,
    });

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin privileges required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { estimateRate, provider = 'RAZORPAY', paymentMethod, effectiveFrom, notes } = body;

    if (estimateRate === undefined || isNaN(Number(estimateRate)) || Number(estimateRate) < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid estimateRate number is required.' },
        { status: 400 },
      );
    }

    const newConfig = await PaymentGatewayConfigService.setGatewayConfig({
      provider,
      estimateRate: Number(estimateRate),
      paymentMethod: paymentMethod || null,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      performedById: user.id,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment gateway configuration updated successfully.',
      config: newConfig,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
