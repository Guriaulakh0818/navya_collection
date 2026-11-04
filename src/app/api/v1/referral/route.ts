import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { AdminRewardsService } from '@/backend/services/admin-rewards.service';
import { LoyaltyService } from '@/backend/services/loyalty.service';
import { ReferralService } from '@/backend/services/referral.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/v1/referral
 * Returns user's referral code, live share link, clicks, and invited friends status.
 * Reconciled authoritatively with database ledger and referral events.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto =
      request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const originUrl = `${proto}://${host}`;

    // 1. Resolve authenticated user identically to /api/v1/rewards/loyalty
    const sessionUser =
      (await getCurrentUser().catch(() => null)) ||
      (await getCurrentUser('navya_session', request).catch(() => null));

    const queryUserId = searchParams.get('userId');
    const queryCode = searchParams.get('code');
    const queryName = searchParams.get('name');

    const effectiveUserId =
      sessionUser?.id ||
      (queryUserId && queryUserId !== 'guest' ? queryUserId : null) ||
      'guest-user-default';

    const effectiveUserName =
      sessionUser?.name ||
      sessionUser?.email ||
      (queryName && queryName !== 'undefined' ? queryName : undefined);

    const codeOverride = queryCode || undefined;

    // 2. Guarantee latest live rewards settings from PostgreSQL
    await AdminRewardsService.getSettings().catch(() => {});

    // 3. Authoritative profile retrieval with rock-solid SQL queries
    const profile = await ReferralService.getProfile(
      effectiveUserId,
      originUrl,
      effectiveUserName,
      codeOverride,
    );

    // 4. Guaranteed synchronization with LoyaltyService ledger:
    // If profile.friends is empty or missing friends that exist in loyalty ledger, reconcile directly from LoyaltyService
    const resolvedUserIds = [effectiveUserId, sessionUser?.id, queryUserId].filter(
      (id): id is string => Boolean(id && !id.startsWith('guest')),
    );
    for (const uid of Array.from(new Set(resolvedUserIds))) {
      try {
        const loyaltyAccount = await LoyaltyService.getAccount(uid);
        if (Array.isArray(loyaltyAccount.transactions)) {
          for (const tx of loyaltyAccount.transactions) {
            const desc = tx.description || '';
            const type = tx.type || '';
            const ref = tx.reference || '';
            const isRef =
              type === 'REFERRAL_BONUS' ||
              ref.startsWith('ref_') ||
              desc.toLowerCase().includes('joined via your code') ||
              desc.toLowerCase().includes('referral');

            if (!isRef) continue;

            let friendName = 'Jiivaa Friend';
            const joinMatch = desc.match(/Friend\s+(.+?)\s+joined/i);
            const orderMatch = desc.match(/bonus for\s+(.+?)'s\s+1st delivered order/i);
            const repeatMatch = desc.match(/for\s+(.+?)'s\s+delivered order/i);
            if (joinMatch && joinMatch[1]) friendName = joinMatch[1].trim();
            else if (orderMatch && orderMatch[1]) friendName = orderMatch[1].trim();
            else if (repeatMatch && repeatMatch[1]) friendName = repeatMatch[1].trim();

            const isDelivered =
              ref.startsWith('ref_delivered_') || desc.toLowerCase().includes('delivered order');
            const key = friendName.toLowerCase();
            const existing = profile.friends.find((f) => f.friendName.toLowerCase() === key);

            if (!existing) {
              profile.friends.push({
                id: String(tx.id),
                friendName,
                friendUserId: ref.startsWith('ref_join_')
                  ? ref.replace('ref_join_', '')
                  : undefined,
                status: isDelivered ? 'DELIVERED_REWARDED' : 'JOINED',
                ordersCount: isDelivered ? 1 : 0,
                coinsAwarded: Number(tx.amount || 100),
                date: tx.createdAt
                  ? new Date(tx.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recently',
              });
            }
          }

          // Recompute stats from reconciled friends list
          if (profile.friends.length > 0) {
            profile.stats.friendsJoined = profile.friends.length;
            profile.stats.successfulOrders = profile.friends.reduce(
              (s, f) => s + (f.ordersCount || 0),
              0,
            );
            profile.stats.totalCoinsEarned = profile.friends.reduce(
              (s, f) => s + (f.coinsAwarded || 0),
              0,
            );
            profile.stats.totalEarnedInr = Math.round(profile.stats.totalCoinsEarned * 0.1);
          }
        }
      } catch (err) {
        console.warn('[ReferralRoute] Loyalty sync fallback:', err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error: any) {
    console.error('[API_REFERRAL_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch referral profile' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  }
}
