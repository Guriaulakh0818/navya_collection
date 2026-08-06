import { NextRequest, NextResponse } from 'next/server';

import { NotificationService } from '@/features/notifications/services/notification.service';

/**
 * PATCH /api/v1/notifications/[id]/read
 * Marks a notification as read.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const notificationId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest_customer_session';

    await NotificationService.markAsRead(notificationId, userId);
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to mark notification as read.',
      },
      { status: 500 },
    );
  }
}
