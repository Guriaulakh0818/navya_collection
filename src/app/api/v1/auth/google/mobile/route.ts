import { NextRequest, NextResponse } from 'next/server';

import { createUserSession } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { email, name, avatar, googleId, idToken } = body;

    // 1. If Google idToken is provided, verify against Google's tokeninfo endpoint
    if (idToken && typeof idToken === 'string') {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        );
        if (verifyRes.ok) {
          const gInfo = await verifyRes.json();
          if (gInfo.email) {
            email = gInfo.email;
            name = gInfo.name || name;
            avatar = gInfo.picture || avatar;
            googleId = gInfo.sub || googleId;
          }
        }
      } catch (tokenErr) {
        console.warn('[GOOGLE_MOBILE_TOKENINFO_WARN]', tokenErr);
      }
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid Google email address is required.' },
        { status: 400 },
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Find or Create User in database
    let user = await prisma.user.findFirst({
      where: { email: cleanEmail },
      include: { ownedShops: true },
    });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            avatar: avatar || null,
            role: 'USER',
            approvalStatus: 'APPROVED',
          },
          include: { ownedShops: true },
        });
        console.log(`✅ [MOBILE_GOOGLE_AUTH] Created new customer account for ${cleanEmail}`);
      } catch (createErr: any) {
        if (createErr?.code === 'P2002') {
          user = await prisma.user.findFirst({
            where: { email: cleanEmail },
            include: { ownedShops: true },
          });
        }
        if (!user) throw createErr;
      }
    } else {
      if (!user.avatar && avatar) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { avatar },
          })
          .catch(() => {});
      }
    }

    // 3. Link Google account record if googleId available
    if (googleId) {
      await prisma.account
        .upsert({
          where: {
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: String(googleId),
            },
          },
          create: {
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: String(googleId),
          },
          update: {},
        })
        .catch(() => {});
    }

    // 4. Create User Session & JWT token
    const userAgent = request.headers.get('user-agent') || 'JiivaaKart Mobile App';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    const sessionResult = await createUserSession(
      {
        id: user.id,
        email: user.email,
        phone: user.mobile,
        role: user.role,
        name: user.name,
      },
      {
        device: 'JiivaaKart Mobile App (Google Sign-In)',
        userAgent,
        ipAddress,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully signed in via Google',
        token: sessionResult.token,
        user: {
          id: user.id,
          name: user.name || cleanEmail.split('@')[0],
          email: user.email,
          mobile: user.mobile || null,
          avatar: user.avatar || avatar || null,
          role: user.role,
          isSeller:
            user.role === 'SELLER' || Boolean(user.ownedShops && user.ownedShops.length > 0),
          ownedShops: user.ownedShops || [],
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('❌ [MOBILE_GOOGLE_AUTH_ERROR]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to authenticate with Google. Please try again.',
      },
      { status: 500 },
    );
  }
}
