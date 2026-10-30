import { NextRequest, NextResponse } from 'next/server';

import { AdminRewardsService } from '@/backend/services/admin-rewards.service';

export async function GET() {
  try {
    const data = await AdminRewardsService.getOverview();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[API_ADMIN_REWARDS_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin rewards data' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = AdminRewardsService.updateSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Rewards & Referral economics configuration updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[API_ADMIN_REWARDS_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update configuration settings' },
      { status: 500 },
    );
  }
}
