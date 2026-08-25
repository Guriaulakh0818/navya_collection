import { NextResponse } from 'next/server';

import { getAdminUser, getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const user = (await getAdminUser()) || (await getCurrentUser());

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        mobile: user.phone,
        name: user.name || null,
        email: user.email,
        role: user.role,
        shopName: user.shopName || null,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
