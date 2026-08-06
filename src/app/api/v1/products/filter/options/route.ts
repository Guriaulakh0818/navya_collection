import { NextResponse } from 'next/server';

import { FilterService } from '@/features/filters/services/filter.service';

/**
 * GET /api/v1/products/filter/options
 *
 * Public API to fetch dynamic available filter options metadata for PLP sidebars.
 */
export async function GET() {
  try {
    const result = await FilterService.getFilterOptions();

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
        message: 'Internal server error while fetching filter options.',
      },
      { status: 500 },
    );
  }
}
