import { NextRequest, NextResponse } from 'next/server';

import { LabelService } from '@/backend/services/shipping/label.service';

function renderThermalShippingLabelHtml(data: {
  orderNumber: string;
  awbCode: string;
  courierName: string;
  customerName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerPhone?: string;
  sellerName?: string;
  sellerCity?: string;
  totalAmount?: number;
  paymentMethod?: string;
  itemsCount?: number;
  generatedAt?: string;
}) {
  const customerName = data.customerName || 'Customer';
  const customerAddress = data.customerAddress || 'Delivery Address, India';
  const customerPhone = data.customerPhone || '+91 98765 43210';
  const sellerName = data.sellerName || 'Navya Boutique Fatehabad';
  const sellerCity = data.sellerCity || 'Fatehabad, Haryana - 125050';
  const courier = data.courierName || 'Delhivery Surface Express';
  const awb = data.awbCode || 'SR-DELIV-882910';
  const orderNum = data.orderNumber || 'NC-ORDER';
  const payment = (data.paymentMethod || 'PREPAID').toUpperCase();
  const amount = Number(data.totalAmount || 0).toLocaleString('en-IN');
  const items = data.itemsCount || 1;
  const dateStr = data.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shipping Label - ${orderNum}</title>
  <style>
    @page {
      size: auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }
    .btn {
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #ea580c;
      color: #fff;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
    }
    .btn-primary:hover {
      background: #c2410c;
    }
    .btn-secondary {
      background: #0f172a;
      color: #fff;
    }
    .label-wrapper {
      width: 360px;
      max-width: 100%;
      background: #fff;
      border: 2px solid #000;
      padding: 10px 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-before: avoid !important;
      page-break-after: avoid !important;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
    }
    .brand-name {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 7.5px;
      color: #475569;
      font-weight: 600;
      margin-top: 1px;
    }
    .courier-badge {
      font-size: 9.5px;
      font-weight: 900;
      border: 1.5px solid #000;
      padding: 2px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      background: #fff;
      white-space: nowrap;
    }
    .barcode-section {
      text-align: center;
      padding: 6px 0 4px 0;
      border-bottom: 2px solid #000;
    }
    .barcode-graphic {
      font-family: monospace;
      font-size: 22px;
      letter-spacing: 2px;
      font-weight: 900;
      line-height: 1;
    }
    .awb-label {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.2px;
      margin-top: 3px;
    }
    .routing-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1.5px solid #000;
      font-size: 9.5px;
      font-weight: 800;
    }
    .section-title {
      font-size: 8.5px;
      font-weight: 900;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .address-box {
      padding: 5px 0;
      border-bottom: 1.5px solid #000;
    }
    .person-name {
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 1px;
    }
    .address-text {
      font-size: 10px;
      line-height: 1.25;
      color: #1e293b;
    }
    .phone-text {
      font-size: 10px;
      font-weight: 700;
      margin-top: 2px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 5px 0;
      border-bottom: 1.5px solid #000;
      font-size: 9.5px;
    }
    .meta-item strong {
      font-weight: 800;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0 3px 0;
    }
    .payment-pill {
      font-size: 9.5px;
      font-weight: 900;
      border: 1.5px solid #000;
      padding: 2px 6px;
      text-transform: uppercase;
    }
    .amount-text {
      font-size: 13px;
      font-weight: 900;
    }
    .footer-note {
      font-size: 7.5px;
      color: #64748b;
      text-align: center;
      margin-top: 4px;
      line-height: 1.25;
      border-top: 1px dashed #94a3b8;
      padding-top: 4px;
    }
    @media print {
      html, body {
        background: #fff !important;
        padding: 4mm 0 !important;
        margin: 0 !important;
        height: auto !important;
      }
      .print-controls {
        display: none !important;
      }
      .label-wrapper {
        box-shadow: none !important;
        border: 2px solid #000 !important;
        width: 360px !important;
        margin: 0 auto !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print Label Sticker (Single Page)</button>
    <button class="btn btn-secondary" onclick="window.close()">✕ Close Tab</button>
  </div>

  <div class="label-wrapper">
    <div class="header-bar">
      <div>
        <div class="brand-name">JiivaaKart Logistics</div>
        <div class="brand-sub">JiivaaKart Private Limited • Zero-Touch Logistics</div>
      </div>
      <div class="courier-badge">${courier}</div>
    </div>

    <div class="barcode-section">
      <div class="barcode-graphic">||||| | |||| || |||||| | |||| ||| |||</div>
      <div class="awb-label">AWB: ${awb}</div>
    </div>

    <div class="routing-row">
      <span>ROUTING: DEL / NORTH / HUB-04</span>
      <span>DATE: ${dateStr}</span>
    </div>

    <div class="address-box">
      <div class="section-title">SHIP TO (CONSIGNEE):</div>
      <div class="person-name">${customerName}</div>
      <div class="address-text">${customerAddress}</div>
      <div class="phone-text">Contact: ${customerPhone}</div>
    </div>

    <div class="address-box">
      <div class="section-title">SHIP FROM (BOUTIQUE PARTNER):</div>
      <div class="person-name">${sellerName}</div>
      <div class="address-text">${sellerCity}</div>
      <div class="phone-text">Support: helpdesk@jiivaakart.com</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><strong>Order #:</strong> ${orderNum}</div>
      <div class="meta-item"><strong>Items Count:</strong> ${items} Qty</div>
      <div class="meta-item"><strong>Dead Weight:</strong> 0.85 kg</div>
      <div class="meta-item"><strong>Volumetric:</strong> 0.60 kg</div>
    </div>

    <div class="payment-row">
      <div class="payment-pill">${payment === 'COD' ? '⚠️ CASH ON DELIVERY' : '✓ PREPAID - DO NOT COLLECT CASH'}</div>
      <div class="amount-text">₹${amount}</div>
    </div>

    <div class="footer-note">
      Marketplace operated by JiivaaKart Private Limited under verified boutique partnership agreement.<br />
      Returns Address: JiivaaKart Returns Hub, Sector 12, Urban Estate, Karnal, Haryana - 132001
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
}

/**
 * GET /api/v1/shipping/label/[orderId]
 * Generates/Retrieves shipping label PDF / printable thermal sticker for an order.
 * Query Params:
 * - ?refresh=true (forces fresh label generation)
 * - ?download=true (returns attachment / printable label)
 * - ?preview=true (returns HTML thermal sticker)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const download = searchParams.get('download') === 'true';
    const preview = searchParams.get('preview') === 'true';

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

    // If download or preview is requested, or browser requests HTML
    const isHtmlRequested =
      download || preview || request.headers.get('accept')?.includes('text/html');

    if (isHtmlRequested) {
      // If external PDF is available and not a dev fallback, redirect to external PDF
      if (
        result.data.labelUrl &&
        result.data.labelUrl.startsWith('http') &&
        !result.data.isDevFallback
      ) {
        const redirectResponse = NextResponse.redirect(result.data.labelUrl, 302);
        redirectResponse.headers.set(
          'Content-Disposition',
          `attachment; filename="shipping-label-${result.data.orderNumber}.pdf"`,
        );
        return redirectResponse;
      }

      // Otherwise render high-resolution printable HTML thermal shipping sticker
      const html = renderThermalShippingLabelHtml(result.data);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
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
