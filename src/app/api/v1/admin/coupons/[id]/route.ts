import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { updateCouponSchema } from '@/features/coupons/schemas/coupon.schema';
import { CouponService } from '@/features/coupons/services/coupon.service';

/**
 * PUT /api/v1/admin/coupons/[id]
 * Protected: Requires ADMIN, SUPER_ADMIN, or OWNER role.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = updateCouponSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid coupon update payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const { id } = await params;
    const response = await CouponService.updateCoupon(id, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_ADMIN_UPDATE_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/admin/coupons/[id]
 * Protected: Requires ADMIN, SUPER_ADMIN, or OWNER role.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const response = await CouponService.deleteCoupon(id);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_ADMIN_DELETE_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
