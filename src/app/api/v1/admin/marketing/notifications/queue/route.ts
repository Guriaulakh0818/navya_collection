import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { PushNotificationService } from '@/backend/services/push-notification.service';

export const dynamic = 'force-dynamic';

function isAuthorizedAdmin(user: any) {
  return user && ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(user.role?.toUpperCase());
}

// GET /api/v1/admin/marketing/notifications/queue
export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!isAuthorizedAdmin(admin)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const settings = await PushNotificationService.getSettings();
    const cadenceMins = settings.cadenceMinutes || 240;

    const [queue, subscribersStats, catalog] = await Promise.all([
      PushNotificationService.getQueueItems(25),
      PushNotificationService.getSubscribersCadenceStats(cadenceMins),
      PushNotificationService.getLiveCatalogForPush(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        settings,
        queue,
        stats: subscribersStats,
        catalog,
        templates: PushNotificationService.getTemplatesCatalog(),
      },
    });
  } catch (error: any) {
    console.error('[API_NOTIFICATIONS_QUEUE_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch notification queue' },
      { status: 500 },
    );
  }
}

// POST /api/v1/admin/marketing/notifications/queue
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!isAuthorizedAdmin(admin)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === 'update_settings') {
      const updated = await PushNotificationService.updateSettings(body.settings || {});
      return NextResponse.json({
        success: true,
        message: 'Notification cadence settings updated successfully.',
        data: updated,
      });
    }

    if (action === 'process_cadence') {
      const result = await PushNotificationService.dispatchCadence({ force: true });
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result,
      });
    }

    if (action === 'scan_recovery') {
      const result = await PushNotificationService.scanAndEnqueueAbandonedCartsAndWishlists();
      return NextResponse.json({
        success: true,
        message: `Recovery scan completed: ${result.abandonedCartsQueued} cart(s) and ${result.abandonedWishlistsQueued} wishlist(s) queued.`,
        data: result,
      });
    }

    if (action === 'queue_catalog_item') {
      const { targetType, targetId, templateType, customTitle, customBody, dispatchImmediate } =
        body;
      if (!targetId || !targetType) {
        return NextResponse.json(
          { success: false, message: 'targetId and targetType are required.' },
          { status: 400 },
        );
      }

      const res = await PushNotificationService.enqueueCatalogItem({
        targetType,
        targetId,
        templateType,
        customTitle,
        customBody,
        dispatchImmediate: Boolean(dispatchImmediate),
      });

      return NextResponse.json({
        success: res.success,
        message: res.message,
        data: res.data,
      });
    }

    if (action === 'enqueue_template') {
      const {
        templateId,
        customerName,
        productName,
        shopName,
        customUrl,
        dispatchImmediate,
        priority,
      } = body;
      if (!templateId) {
        return NextResponse.json(
          { success: false, message: 'templateId is required.' },
          { status: 400 },
        );
      }

      const res = await PushNotificationService.enqueueFromTemplate({
        templateId,
        customerName,
        productName,
        shopName,
        customUrl,
        dispatchImmediate: Boolean(dispatchImmediate),
        priority,
      });

      return NextResponse.json({
        success: res.success,
        message: res.message,
        data: res.data,
      });
    }

    if (action === 'cancel_queue_item') {
      if (!body.queueItemId) {
        return NextResponse.json(
          { success: false, message: 'queueItemId is required' },
          { status: 400 },
        );
      }
      const cancelled = await PushNotificationService.cancelQueueItem(body.queueItemId);
      return NextResponse.json({
        success: cancelled,
        message: cancelled ? 'Queue item cancelled.' : 'Could not cancel item.',
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API_NOTIFICATIONS_QUEUE_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to perform queue action' },
      { status: 500 },
    );
  }
}
