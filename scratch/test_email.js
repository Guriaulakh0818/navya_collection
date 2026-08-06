const fs = require('fs');
const path = require('path');

// Read .env manually
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

async function testBrevo() {
  const apiKey = envVars.BREVO_API_KEY;
  const senderEmail = envVars.BREVO_SENDER_EMAIL || 'gurvindersingh0218@gmail.com';

  console.log('Sending test email via Brevo to gurvinderaulakh497@gmail.com...');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Navya Collection Marketplace',
        email: senderEmail,
      },
      to: [
        {
          email: 'gurvinderaulakh497@gmail.com',
          name: 'Gurvinder Singh',
        },
      ],
      subject: '📩 New Customer Inquiry Received for Saniya Fashions',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; color: #0f172a; border-radius: 16px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e3a8a; margin-top: 0;">📩 New Customer Inquiry Received!</h2>
          <p>You have received a new customer inquiry for <strong>Saniya Fashions</strong> on Navya Collection Marketplace.</p>
          <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
          <p><strong>Customer Name:</strong> Testing User</p>
          <p><strong>Mobile Number:</strong> 9991976543</p>
          <p><strong>Inquiry Message:</strong></p>
          <blockquote style="background-color: #ffffff; padding: 12px 16px; border-left: 4px solid #f59e0b; margin: 0; font-style: italic;">
            Need details on bridal lehengas for bulk order.
          </blockquote>
          <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
          <p style="font-size: 12px; color: #64748b;">Please call or message the customer directly at +91 9991976543 to respond.</p>
        </div>
      `,
    }),
  });

  const data = await res.json();
  console.log('Brevo HTTP Status:', res.status);
  console.log('Brevo API Response:', JSON.stringify(data, null, 2));
}

testBrevo().catch(console.error);
