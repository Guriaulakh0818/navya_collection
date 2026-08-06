import { NextRequest, NextResponse } from 'next/server';

import { NotificationService } from '@/features/notifications/services/notification.service';

/**
 * POST /api/v1/notifications/admin-alert
 * Triggers automated admin alert notifications (New Order, Payment Failure, Stock Warning).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await NotificationService.sendAdminAlert(body);

    return NextResponse.json({
      success: true,
      message: 'Admin alert dispatched successfully.',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to dispatch admin alert.',
      },
      { status: 500 },
    );
  }
}
