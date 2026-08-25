import { NextRequest, NextResponse } from 'next/server';

import { MarketplaceSearchService } from '@/backend/services/marketplace-search.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const result = await MarketplaceSearchService.getSuggestions(q);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ GET Search Suggestions Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Suggestions execution failed.' },
      { status: 500 },
    );
  }
}
