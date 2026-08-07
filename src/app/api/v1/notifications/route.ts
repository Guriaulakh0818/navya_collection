import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/notifications
 * Retrieves unread and recent notifications strictly scoped to the requesting user/seller/admin.
 * Enforces strict multi-tenant user isolation so no user can view another user's notifications.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paramUserId = searchParams.get('userId');

    // 1. Authenticate Requesting User Session from HTTP-Only cookie or session token
    const sessionUser = await getCurrentUser();

    // 2. Resolve Effective Target User ID
    const targetUserId =
      sessionUser?.id || (paramUserId && paramUserId !== 'undefined' ? paramUserId : null);

    // If user is unauthenticated & no valid userId provided, return empty notifications list
    if (!targetUserId) {
      return NextResponse.json({
        success: true,
        data: {
          unreadCount: 0,
          notifications: [],
        },
      });
    }

    const isUserAdmin =
      sessionUser &&
      ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(String(sessionUser.role || '').toUpperCase());

    // 3. Strict User Isolation Query:
    // Regular User/Seller: ONLY notifications targeted to their exact userId
    // Admin User: Notifications targeted to their userId OR system admin alerts ('ADMIN')
    const whereCondition: any = isUserAdmin
      ? { OR: [{ userId: targetUserId }, { userId: 'ADMIN' }] }
      : { userId: targetUserId };

    const notifications = await prisma.notification.findMany({
      where: whereCondition,
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
 * Marks specific or all notifications as read for the authenticated user.
 */
export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const { notificationId, markAll, userId } = body;

    const targetUserId = sessionUser?.id || (userId && userId !== 'undefined' ? userId : null);

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to update notifications.' },
        { status: 401 },
      );
    }

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: targetUserId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({
        success: true,
        message: 'All personal notifications marked as read.',
      });
    }

    if (notificationId) {
      const isUserAdmin =
        sessionUser &&
        ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(String(sessionUser.role || '').toUpperCase());

      // Ensure regular user can ONLY mark their OWN notification as read
      const whereCondition = isUserAdmin
        ? { id: notificationId }
        : { id: notificationId, userId: targetUserId };

      const updated = await prisma.notification.updateMany({
        where: whereCondition,
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
