import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'navya_secret_purge_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updateResult = await prisma.shop.updateMany({
      data: {
        status: 'REJECTED',
      },
    });

    const currentShops = await prisma.shop.findMany({
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${updateResult.count} shops to REJECTED in Vercel production database`,
      shops: currentShops,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
