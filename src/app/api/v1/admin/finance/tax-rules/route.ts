import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { PlatformTaxService, PlatformTaxType } from '@/backend/services/platform-tax.service';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin privileges required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const taxTypeParam = searchParams.get('taxType');

    if (taxTypeParam && Object.values(PlatformTaxType).includes(taxTypeParam as PlatformTaxType)) {
      const rule = await PlatformTaxService.getEffectiveTaxRule(taxTypeParam as PlatformTaxType);
      return NextResponse.json({ success: true, rule });
    }

    const rules = await prisma.platformTaxRule.findMany({
      orderBy: { effectiveFrom: 'desc' },
    });

    return NextResponse.json({
      success: true,
      rules,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin privileges required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { taxType, rate, effectiveFrom, effectiveTo, version, description } = body;

    if (!taxType || !Object.values(PlatformTaxType).includes(taxType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid taxType. Must be one of: ${Object.values(PlatformTaxType).join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (rate === undefined || isNaN(Number(rate)) || Number(rate) < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid rate number is required.' },
        { status: 400 },
      );
    }

    const newRule = await PlatformTaxService.setTaxRule({
      taxType,
      rate: Number(rate),
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      version: version || 'v1.1',
      description,
      performedById: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Platform tax rule updated successfully.',
      rule: newRule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
