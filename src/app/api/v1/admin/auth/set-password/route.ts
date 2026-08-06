import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Admin authentication is managed directly via Email & Password in Team Governance.',
  });
}
