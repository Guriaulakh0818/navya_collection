import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/admin/team
 * List all admin team members and pending approval requests.
 * Restricted to OWNER / SUPER_ADMIN.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Only the Owner can manage admin team members.' },
        { status: 403 },
      );
    }

    const teamMembers = await prisma.user.findMany({
      where: {
        role: {
          in: ['OWNER', 'ADMIN', 'SUPERVISOR', 'SUPER_ADMIN'],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, teamMembers });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/team
 * Add or grant direct access to a new team member with Email, Name, Role, and Password.
 * Restricted to OWNER / SUPER_ADMIN.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Only the Owner can grant admin team access.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, name, role, password } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid Gmail / Email address.' },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please set a password of at least 6 characters for this user.',
        },
        { status: 400 },
      );
    }

    const targetRole = role === 'SUPERVISOR' ? 'SUPERVISOR' : 'ADMIN';
    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name || normalizedEmail.split('@')[0],
          password: hashedPassword,
          role: targetRole as any,
          approvalStatus: 'APPROVED',
          mustChangePassword: false,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          password: hashedPassword,
          role: targetRole as any,
          approvalStatus: 'APPROVED',
          mustChangePassword: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Access granted for ${normalizedEmail} as ${targetRole}. User can log in directly with their password.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/admin/team
 * Approve / Revoke access or change user role.
 * Restricted to OWNER / SUPER_ADMIN.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Only the Owner can modify user roles or permissions.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userId, approvalStatus, role, password } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing target userId parameter.' },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (approvalStatus) updateData.approvalStatus = approvalStatus;
    if (role) updateData.role = role as any;
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `User ${updated.email} permissions updated successfully.`,
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
