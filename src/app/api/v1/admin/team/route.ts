import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { sendAdminAccessGrantedEmail } from '@/backend/lib/brevo';
import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function checkIsOwner(user: any) {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  const email = String(user.email || '').toLowerCase();
  return (
    role === 'OWNER' ||
    role === 'SUPER_ADMIN' ||
    email === 'gurvindersingh0218@gmail.com' ||
    email === 'guriaulakh497@gmail.com'
  );
}

/**
 * GET /api/v1/admin/team
 * List all admin team members and pending approval requests.
 * Restricted to OWNER / SUPER_ADMIN.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!checkIsOwner(user)) {
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
 * Add or grant direct access to a new team member with Email, Name, Role, and Password + Sends Email.
 * Restricted to OWNER / SUPER_ADMIN.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!checkIsOwner(user)) {
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

    let finalName = name || normalizedEmail.split('@')[0];

    if (existing) {
      finalName = name || existing.name || normalizedEmail.split('@')[0];
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: finalName,
          password: hashedPassword,
          role: targetRole as any,
          approvalStatus: 'APPROVED',
          mustChangePassword: false,
          deletedAt: null,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: finalName,
          password: hashedPassword,
          role: targetRole as any,
          approvalStatus: 'APPROVED',
          mustChangePassword: false,
        },
      });
    }

    // 📧 Send Email Notification to user informing them of their granted Admin Access & Credentials
    try {
      await sendAdminAccessGrantedEmail(normalizedEmail, finalName, targetRole, password);
    } catch (emailErr) {
      console.error('Failed to send admin access granted email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Access granted & email sent to ${normalizedEmail} as ${targetRole}. User can log in directly with their password.`,
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
    const user = await getAdminUser();
    if (!checkIsOwner(user)) {
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

/**
 * DELETE /api/v1/admin/team
 * Permanently delete or revoke and soft-delete an admin user account.
 * Restricted to OWNER / SUPER_ADMIN.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!checkIsOwner(user)) {
      return NextResponse.json(
        { success: false, message: 'Only the Owner can delete admin accounts.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing target userId query parameter.' },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    if (
      targetUser.email === 'gurvindersingh0218@gmail.com' ||
      targetUser.email === 'guriaulakh497@gmail.com'
    ) {
      return NextResponse.json(
        { success: false, message: 'The primary Owner account cannot be deleted.' },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        approvalStatus: 'REJECTED',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin user account "${targetUser.email || targetUser.name}" has been permanently deleted.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
