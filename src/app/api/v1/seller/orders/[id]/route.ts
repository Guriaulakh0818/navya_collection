import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Vendor Order ID is required.' },
        { status: 400 },
      );
    }

    const vendorOrder = await prisma.vendorOrder.findUnique({
      where: { id },
      include: {
        shop: {
          include: {
            sellerProfile: true,
            addresses: true,
          },
        },
        masterOrder: {
          include: {
            address: true,
            user: { select: { name: true, email: true, mobile: true } },
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                fabric: true,
                images: { select: { imageUrl: true }, take: 1 },
              },
            },
            variant: {
              select: {
                size: true,
                color: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!vendorOrder) {
      return NextResponse.json(
        { success: false, message: 'Vendor Order not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: vendorOrder,
    });
  } catch (error: any) {
    console.error('❌ GET Single Vendor Order Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load vendor order details.' },
      { status: 500 },
    );
  }
}
