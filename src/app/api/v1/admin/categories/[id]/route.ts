import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/v1/admin/categories/[id] - Soft delete category (Restricted to OWNER / SUPER_ADMIN ONLY)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminUser();
    if (!admin || !['OWNER', 'SUPER_ADMIN'].includes(admin.role?.toUpperCase())) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Only the Owner can delete categories.' },
        { status: 403 },
      );
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found.' }, { status: 404 });
    }

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Category '${category.name}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error('❌ DELETE Admin Category Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
