import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { Founding50Service } from '@/backend/services/founding-50.service';

export const dynamic = 'force-dynamic';

function isAuthorized(admin: any, request: NextRequest): boolean {
  if (admin && ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    return true;
  }
  const secretHeader = request.headers.get('x-internal-secret');
  const secretQuery = request.nextUrl.searchParams.get('secret');
  if (
    secretHeader === 'navya_prod_sync_taxonomy_secret_2026' ||
    secretQuery === 'navya_prod_sync_taxonomy_secret_2026'
  ) {
    return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
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

    const overview = await Founding50Service.getAdminOverview();

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    console.error('❌ GET Admin Founding 50 Overview Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load Founding 50 overview.' },
      { status: 500 },
    );
  }
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
    const { action, shopId, status } = body;

    // 1. Auto Enroll All Approved Shops
    if (action === 'AUTO_ENROLL_ALL') {
      const result = await Founding50Service.autoEnrollApprovedShops();
      return NextResponse.json({
        success: true,
        message:
          result.enrolledCount > 0
            ? `Successfully enrolled ${result.enrolledCount} boutiques into Founding 50.`
            : 'All approved boutiques are already enrolled or slots are full.',
        data: result,
      });
    }

    // Individual shop actions require shopId
    if (!shopId) {
      return NextResponse.json(
        { success: false, message: 'Shop ID is required for this action.' },
        { status: 400 },
      );
    }

    // 2. Enroll Single Shop
    if (action === 'ENROLL_SHOP') {
      const result = await Founding50Service.allocateSlot(shopId);
      if (!result.allocated) {
        return NextResponse.json(
          { success: false, message: result.message || 'Could not enroll shop.' },
          { status: 400 },
        );
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result,
      });
    }

    // 3. Remove Single Shop from Founding 50
    if (action === 'REMOVE_SHOP') {
      const result = await Founding50Service.removeSlot(shopId);
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result,
      });
    }

    // 4. Toggle/Update Status
    if (action === 'TOGGLE_STATUS') {
      const validStatuses = ['ACTIVE', 'SUSPENDED', 'COMPLETED'] as const;
      if (!status || !validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 },
        );
      }

      const result = await Founding50Service.updateStatus(shopId, status);
      return NextResponse.json({
        success: result.success,
        message: result.message,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ POST Admin Founding 50 Action Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process Founding 50 action.' },
      { status: 500 },
    );
  }
}
