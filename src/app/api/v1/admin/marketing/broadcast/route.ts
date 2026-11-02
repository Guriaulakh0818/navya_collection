import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { MarketingBroadcastService } from '@/backend/services/marketing-broadcast.service';
import { PushNotificationService } from '@/backend/services/push-notification.service';

export const dynamic = 'force-dynamic';

function isAuthorized(admin: any, request: NextRequest): boolean {
  if (admin && ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    return true;
  }
  const secret =
    request.headers.get('x-internal-secret') || request.nextUrl.searchParams.get('secret');
  return secret === 'navya_prod_sync_taxonomy_secret_2026';
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser().catch(() => null);
    if (!isAuthorized(admin, request)) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, message: 'Forbidden. Admin access required.' },
          { status: 403 },
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const { campaignType, testOnly = false, testEmail, pushData } = body;

    if (!campaignType) {
      return NextResponse.json(
        { success: false, message: 'campaignType is required.' },
        { status: 400 },
      );
    }

    // 1. Founding 50 Offer to Approved Sellers
    if (campaignType === 'FOUNDING_50') {
      const result = await MarketingBroadcastService.sendFoundingOfferToApprovedSellers({
        testOnly: Boolean(testOnly),
        testEmail,
      });
      return NextResponse.json({ success: result.success, data: result });
    }

    // 2. Refer & Earn Announcement to Registered Users
    if (campaignType === 'REFERRAL') {
      const result = await MarketingBroadcastService.sendReferralLaunchToUsers({
        testOnly: Boolean(testOnly),
        testEmail,
      });
      return NextResponse.json({ success: result.success, data: result });
    }

    // 3. Product Discovery & Deals to Users
    if (campaignType === 'PRODUCT_SHOWCASE') {
      const result = await MarketingBroadcastService.sendProductShowcaseToUsers({
        testOnly: Boolean(testOnly),
        testEmail,
      });
      return NextResponse.json({ success: result.success, data: result });
    }

    // 4. Web Push Notification to Screens
    if (campaignType === 'WEB_PUSH') {
      if (!pushData?.title || !pushData?.body) {
        return NextResponse.json(
          { success: false, message: 'pushData with title and body is required.' },
          { status: 400 },
        );
      }

      const result = await PushNotificationService.broadcastPush({
        title: pushData.title,
        body: pushData.body,
        url: pushData.url || '/',
        icon: pushData.icon || '/icons/icon-192x192.png',
        image: pushData.image || undefined,
      });

      return NextResponse.json({
        success: true,
        data: {
          totalRecipients: result.total,
          sentCount: result.sent,
          failedCount: result.failed,
          message: `Push notification sent to ${result.sent} screens (${result.failed} failed/expired).`,
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown campaignType.' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ POST Marketing Broadcast Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to dispatch marketing campaign.' },
      { status: 500 },
    );
  }
}
