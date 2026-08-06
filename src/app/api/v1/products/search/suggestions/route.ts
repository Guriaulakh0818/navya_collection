import { NextRequest, NextResponse } from 'next/server';

import { searchSuggestionsQuerySchema } from '@/features/search/schemas/search.schema';
import { SearchService } from '@/features/search/services/search.service';

/**
 * GET /api/v1/products/search/suggestions
 *
 * Public endpoint to fetch live autocomplete suggestions (Products, Categories, Brands).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validation = searchSuggestionsQuerySchema.safeParse(rawParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid suggestions query parameter.',
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const result = await SearchService.getSuggestions(validation.data);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data,
      },
      { status: result.statusCode },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while fetching search suggestions.',
      },
      { status: 500 },
    );
  }
}
