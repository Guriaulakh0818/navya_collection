import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { PushNotificationService } from '@/backend/services/push-notification.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const publicKey = PushNotificationService.getPublicKey();
    return NextResponse.json({
      success: true,
      publicKey,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch public VAPID key.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, message: 'Valid push subscription is required.' },
        { status: 400 },
      );
    }

    const user = await getCurrentUser().catch(() => null);
    const userAgent = request.headers.get('user-agent') || undefined;

    const res = await PushNotificationService.saveSubscription(subscription, user?.id, userAgent);

    return NextResponse.json({
      success: res.success,
      message: res.message,
    });
  } catch (error: any) {
    console.error('❌ Push Subscription Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to register push subscription.' },
      { status: 500 },
    );
  }
}
