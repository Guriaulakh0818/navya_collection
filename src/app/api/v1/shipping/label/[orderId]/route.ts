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
      size: 100mm 150mm;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
    }
    .print-controls {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn {
      padding: 10px 22px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
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
      width: 380px;
      background: #fff;
      border: 2px solid #000;
      padding: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
    }
    .brand-name {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 8px;
      color: #475569;
      font-weight: 600;
      margin-top: 1px;
    }
    .courier-badge {
      font-size: 10px;
      font-weight: 900;
      border: 1.5px solid #000;
      padding: 3px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      background: #fff;
    }
    .barcode-section {
      text-align: center;
      padding: 12px 0 8px 0;
      border-bottom: 2px solid #000;
    }
    .barcode-graphic {
      font-family: monospace;
      font-size: 26px;
      letter-spacing: 3px;
      font-weight: 900;
      line-height: 1;
    }
    .awb-label {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1.5px;
      margin-top: 5px;
    }
    .routing-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1.5px solid #000;
      font-size: 10px;
      font-weight: 800;
    }
    .section-title {
      font-size: 9px;
      font-weight: 900;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .address-box {
      padding: 8px 0;
      border-bottom: 1.5px solid #000;
    }
    .person-name {
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 2px;
    }
    .address-text {
      font-size: 11px;
      line-height: 1.35;
      color: #1e293b;
    }
    .phone-text {
      font-size: 11px;
      font-weight: 700;
      margin-top: 3px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 8px 0;
      border-bottom: 1.5px solid #000;
      font-size: 10px;
    }
    .meta-item strong {
      font-weight: 800;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0 4px 0;
    }
    .payment-pill {
      font-size: 10px;
      font-weight: 900;
      border: 1.5px solid #000;
      padding: 3px 8px;
      text-transform: uppercase;
    }
    .amount-text {
      font-size: 14px;
      font-weight: 900;
    }
    .footer-note {
      font-size: 8px;
      color: #64748b;
      text-align: center;
      margin-top: 8px;
      line-height: 1.3;
      border-top: 1px dashed #94a3b8;
      padding-top: 6px;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .print-controls {
        display: none !important;
      }
      .label-wrapper {
        box-shadow: none;
        border: 2px solid #000;
        width: 100%;
        max-width: 100mm;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print Label Sticker (4x6 / A4)</button>
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
