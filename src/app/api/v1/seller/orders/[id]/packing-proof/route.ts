import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/v1/seller/orders/[id]/packing-proof
 *
 * Captures and persists seller packing evidence before order dispatch (Section 9).
 * Supports:
 * 1. Product condition proof (PRODUCT_CONDITION)
 * 2. Packed parcel proof (PACKED_PARCEL)
 * Supports Photos & Videos uploaded via Cloudinary.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderOrVendorOrderId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(user.role);
    const isSeller = user.role === 'SELLER';

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only authorized sellers or administrators can upload packing proofs.',
        },
        { status: 403 },
      );
    }

    // Identify target vendor order or master order
    const vendorOrder = await prisma.vendorOrder.findFirst({
      where: {
        OR: [
          { id: orderOrVendorOrderId },
          { vendorOrderNumber: orderOrVendorOrderId },
          { masterOrderId: orderOrVendorOrderId },
        ],
        ...(isSeller ? { shop: { ownerId: user.id } } : {}),
      },
      include: {
        shop: true,
        masterOrder: {
          include: { shipments: true },
        },
      },
    });

    let masterOrderId: string;
    let vendorOrderId: string | null = null;
    let shopId: string;
    let sellerId: string;
    let awbCode: string | null = null;
    let shipmentId: string | null = null;

    if (vendorOrder) {
      masterOrderId = vendorOrder.masterOrderId;
      vendorOrderId = vendorOrder.id;
      shopId = vendorOrder.shopId;
      sellerId = vendorOrder.shop.ownerId;
      awbCode = vendorOrder.awbCode || null;

      const matchedShipment = vendorOrder.masterOrder.shipments.find(
        (s) => s.vendorOrderId === vendorOrder.id || s.shopId === vendorOrder.shopId,
      );
      if (matchedShipment) {
        shipmentId = matchedShipment.id;
        if (!awbCode) awbCode = matchedShipment.awbCode || null;
      }
    } else {
      // Fallback check master order
      const masterOrder = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderOrVendorOrderId }, { orderNumber: orderOrVendorOrderId }],
        },
        include: {
          vendorOrders: { include: { shop: true } },
          shipments: true,
        },
      });

      if (!masterOrder) {
        return NextResponse.json(
          { success: false, message: 'Order record not found.' },
          { status: 404 },
        );
      }

      masterOrderId = masterOrder.id;
      const targetVO = isSeller
        ? masterOrder.vendorOrders.find((vo) => vo.shop.ownerId === user.id)
        : masterOrder.vendorOrders[0];

      if (!targetVO && isSeller) {
        return NextResponse.json(
          { success: false, message: 'Forbidden. You do not own items in this order.' },
          { status: 403 },
        );
      }

      vendorOrderId = targetVO?.id || null;
      shopId = targetVO?.shopId || masterOrder.vendorOrders[0]?.shopId || 'default-shop';
      sellerId = targetVO?.shop.ownerId || user.id;

      const firstShipment = masterOrder.shipments[0];
      if (firstShipment) {
        shipmentId = firstShipment.id;
        awbCode = firstShipment.awbCode || null;
      }
    }

    const body = await request.json();
    const {
      mediaUrl,
      publicId,
      mediaType = 'IMAGE', // 'IMAGE' | 'VIDEO'
      proofType = 'PRODUCT_CONDITION', // 'PRODUCT_CONDITION' | 'PACKED_PARCEL'
      productId,
      variantId,
      notes,
    } = body;

    if (!mediaUrl) {
      return NextResponse.json(
        { success: false, message: 'Media URL is required for packing proof.' },
        { status: 400 },
      );
    }

    const normalizedMediaType = mediaType.toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    const normalizedProofType =
      proofType === 'PACKED_PARCEL' ? 'PACKED_PARCEL' : 'PRODUCT_CONDITION';

    const proof = await prisma.sellerPackingProof.create({
      data: {
        orderId: masterOrderId,
        vendorOrderId,
        shipmentId,
        shopId,
        sellerId,
        productId: productId || null,
        variantId: variantId || null,
        mediaUrl,
        publicId: publicId || null,
        mediaType: normalizedMediaType,
        proofType: normalizedProofType,
        awbCode,
        notes: notes || null,
        uploaderId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${normalizedProofType === 'PRODUCT_CONDITION' ? 'Product condition' : 'Packed parcel'} proof uploaded successfully.`,
      data: proof,
    });
  } catch (error: any) {
    console.error('❌ POST Seller Packing Proof Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save packing proof.' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/seller/orders/[id]/packing-proof
 * Fetches all packing proofs for the specified order.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderOrVendorOrderId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const proofs = await prisma.sellerPackingProof.findMany({
      where: {
        OR: [
          { orderId: orderOrVendorOrderId },
          { vendorOrderId: orderOrVendorOrderId },
          { shipmentId: orderOrVendorOrderId },
        ],
      },
      include: {
        uploader: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: proofs,
    });
  } catch (error: any) {
    console.error('❌ GET Seller Packing Proof Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch packing proofs.' },
      { status: 500 },
    );
  }
}
