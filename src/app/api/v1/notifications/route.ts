import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/notifications
 * Retrieves unread and recent notifications for a user/seller/admin.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Default to system notifications if no userId provided
    const where: any = userId ? { OR: [{ userId }, { userId: null }] } : {};

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      data: {
        unreadCount,
        notifications,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Notifications Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch notifications.' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/notifications
 * Marks specific or all notifications as read.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAll, userId } = body;

    if (markAll) {
      const where: any = userId ? { OR: [{ userId }, { userId: null }] } : {};
      await prisma.notification.updateMany({
        where: { ...where, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read.',
      });
    }

    if (notificationId) {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({
        success: true,
        data: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Notification ID or markAll flag required.' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('❌ PATCH Notifications Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update notification.' },
      { status: 500 },
    );
  }
}
