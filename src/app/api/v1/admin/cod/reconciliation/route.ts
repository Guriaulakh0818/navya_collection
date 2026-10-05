import { NextResponse } from 'next/server';

import { CodReconciliationService } from '@/backend/services/shipping/cod-reconciliation.service';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/admin/cod/reconciliation
 * Retrieves all COD orders, verification statuses, and shipment remittance states.
 *
 * POST /api/v1/admin/cod/reconciliation
 * Ingests and processes a courier remittance batch (marks shipments REMITTED).
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'OWNER')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = Number(searchParams.get('limit') || '50');
    const offset = Number(searchParams.get('offset') || '0');

    const result = await CodReconciliationService.getCodOrdersOverview({ status, limit, offset });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'OWNER')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = await CodReconciliationService.processCourierRemittanceBatch(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
