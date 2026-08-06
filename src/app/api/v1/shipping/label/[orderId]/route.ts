import { NextRequest, NextResponse } from 'next/server';

import { LabelService } from '@/backend/services/shipping/label.service';

/**
 * GET /api/v1/shipping/label/[orderId]
 * Generates/Retrieves shipping label PDF URL for an order.
 * Query Params:
 * - ?refresh=true (forces fresh label generation)
 * - ?download=true (returns attachment disposition headers for browser download/printing)
 */
export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const download = searchParams.get('download') === 'true';

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order ID or Order Number is required.',
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const result = await LabelService.generateLabelForOrder(orderId, {
      forceRefresh: refresh,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(result, { status: result.statusCode });
    }

    // If download parameter is specified, redirect directly to PDF with disposition headers
    if (download && result.data.labelUrl) {
      const redirectResponse = NextResponse.redirect(result.data.labelUrl, 302);
      redirectResponse.headers.set(
        'Content-Disposition',
        `attachment; filename="shipping-label-${result.data.orderNumber}.pdf"`,
      );
      return redirectResponse;
    }

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process shipping label request.',
        statusCode: 500,
        error: {
          code: 'LABEL_API_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
