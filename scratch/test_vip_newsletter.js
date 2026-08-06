const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
});

async function testVIPNewsletter() {
  const apiKey = envVars.BREVO_API_KEY;
  const senderEmail = envVars.BREVO_SENDER_EMAIL || 'gurvindersingh0218@gmail.com';
  const targetSubscriber = 'gurvinderaulakh497@gmail.com';

  console.log(`Sending VIP Club Welcome & 15% OFF Coupon Email to ${targetSubscriber}...`);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
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
          email: targetSubscriber,
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
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #78350f;">Valid on all orders above ₹499. Single-use promo code.</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://navyacollection.store/shop" style="background-color: #183a73; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 800; border-radius: 50px; display: inline-block;">
              Shop Latest Collection Now 🛍️
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            © 2026 Navya Collection Marketplace. All rights reserved.
          </p>
        </div>
      `,
    }),
  });

  const data = await res.json();
  console.log('Brevo Status Code:', res.status);
  console.log('Brevo API Result:', JSON.stringify(data, null, 2));
}

testVIPNewsletter().catch(console.error);
