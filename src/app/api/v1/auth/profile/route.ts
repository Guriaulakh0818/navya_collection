import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * PUT /api/v1/auth/profile
 *
 * Permanently updates the customer's Full Name, Mobile, and Email in PostgreSQL database.
 */
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, mobile, email } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Full name cannot be empty.' },
        { status: 400 },
      );
    }

    const cleanName = name.trim();
    const cleanMobile = mobile ? mobile.replace(/\D/g, '').slice(-10) : undefined;
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    // Unbind cleanMobile from any other user record in PostgreSQL so active logged-in user can claim it
    if (cleanMobile && cleanMobile.length === 10) {
      const otherUsersWithMobile = await prisma.user.findMany({
        where: {
          mobile: cleanMobile,
          id: { not: userId },
        },
        select: { id: true },
      });

      for (const otherUser of otherUsersWithMobile) {
        try {
          await prisma.user.update({
            where: { id: otherUser.id },
            data: { mobile: null },
          });
        } catch {}
      }
    }

    // Check if email is already associated with another active user account
    if (cleanEmail) {
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: userId },
        },
      });

      if (existingUserWithEmail) {
        return NextResponse.json(
          {
            success: false,
            message: 'This email address is already linked to another registered account.',
          },
          { status: 400 },
        );
      }
    }

    // Update PostgreSQL User & CustomerProfile atomically
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: cleanName,
        ...(cleanMobile && cleanMobile.length === 10 ? { mobile: cleanMobile } : {}),
        ...(cleanEmail ? { email: cleanEmail } : {}),
        profile: {
          upsert: {
            create: { name: cleanName },
            update: { name: cleanName },
          },
        },
      },
      include: { profile: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully in database.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name || updatedUser.profile?.name || cleanName,
          email: updatedUser.email || '',
          mobile: updatedUser.mobile || '',
          role: updatedUser.role,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[API_UPDATE_PROFILE_ERROR]', error);

    // Handle Prisma unique constraint violation cleanly
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target.join(', ') : 'mobile or email';
      return NextResponse.json(
        {
          success: false,
          message: `This ${field} is already in use by another account. Please use a different one.`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update profile.' },
      { status: 500 },
    );
  }
}
