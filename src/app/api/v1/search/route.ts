import { NextRequest, NextResponse } from 'next/server';

import { MarketplaceSearchService } from '@/backend/services/marketplace-search.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const type = (searchParams.get('type') || 'all') as any;
    const category = searchParams.get('category') || undefined;
    const shopId = searchParams.get('shopId') || undefined;
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000000');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const sort = (searchParams.get('sort') || 'relevance') as any;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const result = await MarketplaceSearchService.search({
      q,
      type,
      category,
      shopId,
      minPrice,
      maxPrice,
      minRating,
      sort,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ GET Marketplace Search Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Search execution failed.' },
      { status: 500 },
    );
  }
}
