import { NextResponse } from 'next/server';

// Track unique subscribed emails in memory
const subscribedEmails = new Set<string>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    // 1. Validate email address
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 },
      );
    }

    const subscriberEmail = email.trim().toLowerCase();

    // 2. Check if email is already subscribed
    if (subscribedEmails.has(subscriberEmail)) {
      return NextResponse.json(
        { success: false, message: 'You are already a subscriber!' },
        { status: 400 },
      );
    }

    // 3. Mark email as subscribed
    subscribedEmails.add(subscriberEmail);

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'gurvindersingh0218@gmail.com';

    // 4. Dispatch 15% OFF VIP Welcome Email via Brevo API
    if (apiKey) {
      try {
        const mailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: 'Navya Collection VIP Club',
              email: senderEmail,
            },
            to: [
              {
                email: subscriberEmail,
              },
            ],
            subject: '🎉 Welcome to Navya Collection VIP Club! Here is your 15% OFF Coupon',
            htmlContent: `
              <div style="font-family: Arial, sans-serif; padding: 28px; background-color: #f8fafc; color: #0f172a; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #183a73; font-size: 24px; font-weight: 900; margin: 0;">NAVYA COLLECTION</h1>
                  <p style="color: #f15a25; font-size: 11px; font-weight: 800; tracking: 3px; margin: 4px 0 0 0; text-transform: uppercase;">VIP Club Membership Confirmed</p>
                </div>

                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Welcome to our VIP Fashion Family! 🎉</h2>
                <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                  Thank you for subscribing to Navya Collection VIP Club! You will now get early access to new seasonal launches, exclusive insider sales, and special member discounts.
                </p>

                <div style="background-color: #ffffff; padding: 20px; border-radius: 16px; border: 2px dashed #f59e0b; text-align: center; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1px;">Your Exclusive 15% OFF Promo Code:</p>
                  <span style="font-size: 28px; font-weight: 900; color: #183a73; font-family: monospace; letter-spacing: 4px; display: inline-block; padding: 6px 16px; background-color: #fef3c7; border-radius: 8px;">NAVYA15VIP</span>
                  <div style="margin: 12px 0 0 0; font-size: 12px; color: #78350f; font-weight: 600; background-color: #fffbe6; padding: 8px; border-radius: 6px; text-align: left;">
                    <p style="margin: 0 0 4px 0;">📌 <strong>Valid ONLY on Non-Discounted Products</strong> (Full-price items).</p>
                    <p style="margin: 0;">📌 <strong>Order Amount must be greater than ₹3,000</strong>.</p>
                  </div>
                </div>

                <div style="text-align: center; margin-top: 24px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.store'}/shop" style="background-color: #183a73; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 800; border-radius: 50px; display: inline-block; shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    Shop Latest Collection Now 🛍️
                  </a>
                </div>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                  © ${new Date().getFullYear()} Navya Collection Marketplace. All rights reserved.
                </p>
              </div>
            `,
          }),
        });

        if (mailRes.ok) {
          console.log(`✅ VIP Welcome Email & 15% Coupon sent to [${subscriberEmail}] via Brevo!`);
        } else {
          const errData = await mailRes.json();
          console.warn('⚠️ Brevo VIP email dispatch warning:', errData);
        }
      } catch (err) {
        console.error('❌ Failed to dispatch Brevo VIP email:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription successful! 15% OFF coupon email sent to your inbox.',
      coupon: 'NAVYA15VIP',
    });
  } catch (error: any) {
    console.error('❌ Newsletter API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process newsletter subscription.' },
      { status: 500 },
    );
  }
}
