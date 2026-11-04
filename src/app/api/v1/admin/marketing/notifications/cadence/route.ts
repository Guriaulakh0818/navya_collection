import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { PushNotificationService } from '@/backend/services/push-notification.service';

export const dynamic = 'force-dynamic';

const INTERNAL_SYNC_SECRET =
  process.env.INTERNAL_SYNC_SECRET || 'navya_prod_sync_taxonomy_secret_2026';
const CRON_SECRET = process.env.CRON_SECRET || 'navya_settlement_secret_key';

function isAuthorized(request: NextRequest, user: any) {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const authHeader = request.headers.get('authorization') || request.headers.get('x-sync-secret');
  const isSecretAuthorized =
    authHeader &&
    (authHeader === INTERNAL_SYNC_SECRET ||
      authHeader === `Bearer ${INTERNAL_SYNC_SECRET}` ||
      authHeader === `Bearer ${CRON_SECRET}`);

  const isAdminAuthorized =
    user && ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(user.role?.toUpperCase());

  return Boolean(isVercelCron || isSecretAuthorized || isAdminAuthorized);
}

export async function GET(request: NextRequest) {
  return handleCadence(request);
}

export async function POST(request: NextRequest) {
  return handleCadence(request);
}

async function handleCadence(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!isAuthorized(request, user)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin credentials or valid secret required.' },
        { status: 403 },
      );
    }

    const result = await PushNotificationService.dispatchCadence();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('[API_NOTIFICATIONS_CADENCE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Cadence dispatch failed' },
      { status: 500 },
    );
  }
}
