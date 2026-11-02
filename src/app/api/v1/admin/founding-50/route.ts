import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { Founding50Service } from '@/backend/services/founding-50.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || !['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
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
    const admin = await getCurrentUser();
    if (!admin || !['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, message: 'Forbidden. Admin access required.' },
          { status: 403 },
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const { action, shopId, status } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, message: 'Shop ID is required.' },
        { status: 400 },
      );
    }

    if (action === 'TOGGLE_STATUS') {
      const updated = await prisma.shop.update({
        where: { id: shopId },
        data: {
          foundingStatus: status, // ACTIVE, SUSPENDED, COMPLETED
        },
      });

      return NextResponse.json({
        success: true,
        message: `Founding status updated to ${status}`,
        data: updated,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ POST Admin Founding 50 Action Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update Founding 50 status.' },
      { status: 500 },
    );
  }
}
