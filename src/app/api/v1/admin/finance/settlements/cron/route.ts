import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { SettlementService } from '@/backend/services/settlement.service';

/**
 * GET/POST /api/v1/admin/finance/settlements/cron
 *
 * Automated/Manual Trigger for Settlement Eligibility Processing (Section 2, 22).
 * Periodically identifies orders where:
 *   delivery_date + 7 calendar days <= current time
 * and no blocking return/replacement/dispute exists.
 * Idempotently transitions status from PENDING_SETTLEMENT to ELIGIBLE_FOR_SETTLEMENT.
 */
export async function GET(request: NextRequest) {
  return handleSettlementCron(request);
}

export async function POST(request: NextRequest) {
  return handleSettlementCron(request);
}

async function handleSettlementCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'navya_settlement_secret_key';

    // Allow authorization via Bearer token (for automated cron services like Vercel Cron/Upstash)
    // or via logged-in admin session
    const isSecretAuthorized = authHeader === `Bearer ${cronSecret}`;

    if (!isSecretAuthorized) {
      const admin = await getCurrentUser();
      if (
        !admin ||
        !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'Forbidden. Admin credentials or valid CRON_SECRET required.',
          },
          { status: 403 },
        );
      }
    }

    const result = await SettlementService.processSettlementEligibilityCron();

    return NextResponse.json({
      success: true,
      message: `Settlement eligibility scan completed: ${result.eligibleCount} transitioned to ELIGIBLE_FOR_SETTLEMENT, ${result.heldCount} kept ON_HOLD.`,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Settlement Cron Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to execute settlement eligibility cron.',
      },
      { status: 500 },
    );
  }
}
