import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const mockUser = {
      id: 'user_123',
      mobile: '9876543210',
      name: 'Test User',
      role: 'customer',
    };

    return NextResponse.json({ authenticated: true, user: mockUser });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
