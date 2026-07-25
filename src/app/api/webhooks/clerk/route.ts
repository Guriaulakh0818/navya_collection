import { NextResponse } from 'next/server';

import { syncClerkUserToDatabase } from '@/lib/user-sync';

/**
 * Clerk Webhook Event Handler for User Synchronization.
 * Handles user.created and user.updated webhooks from Clerk.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload.type;

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, phone_numbers, email_addresses, first_name, last_name, image_url } = payload.data;

      const mobile = phone_numbers?.[0]?.phone_number ?? null;
      const email = email_addresses?.[0]?.email_address ?? null;
      const name = first_name || last_name ? `${first_name ?? ''} ${last_name ?? ''}`.trim() : null;

      const syncedUser = await syncClerkUserToDatabase({
        clerkId: id,
        mobile,
        email,
        name,
        avatar: image_url,
      });

      return NextResponse.json({
        success: true,
        message: `User synchronized successfully`,
        userId: syncedUser.id,
      });
    }

    return NextResponse.json({ success: true, message: 'Event ignored' });
  } catch (error: any) {
    console.error('Clerk Webhook Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Webhook handler error' },
      { status: 500 },
    );
  }
}
