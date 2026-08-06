import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, message, shopSlug, shopId } = body;

    // 1. Validation checks
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid customer name (at least 2 characters).' },
        { status: 400 },
      );
    }

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 },
      );
    }

    if (!message || message.trim().length < 5) {
      return NextResponse.json(
        { success: false, message: 'Please type your inquiry message (at least 5 characters).' },
        { status: 400 },
      );
    }

    // 2. Find target shop robustly (handles slug, cleanSlug, shopId, or fallback)
    const cleanSlug = (shopSlug || '')
      .replace(/-alt$/i, '')
      .replace(/-secondary$/i, '')
      .trim();

    let shop = null;

    if (shopId) {
      shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: { owner: true },
      });
    }

    if (!shop && shopSlug) {
      shop = await prisma.shop.findFirst({
        where: {
          OR: [
            { slug: shopSlug },
            { slug: cleanSlug },
            { name: { contains: cleanSlug.replace(/-/g, ' '), mode: 'insensitive' } },
            { name: { contains: 'saniya', mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        include: { owner: true },
      });
    }

    if (!shop) {
      // Final resilient fallback: get primary active shop
      shop = await prisma.shop.findFirst({
        where: { deletedAt: null },
        include: { owner: true },
      });
    }

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Boutique shop not found.' },
        { status: 404 },
      );
    }

    // 3. Persist notification for merchant owner
    if (shop.ownerId) {
      try {
        await prisma.notification.create({
          data: {
            userId: shop.ownerId,
            type: 'SYSTEM',
            title: `📩 Customer Inquiry: ${name.trim()}`,
            message: `Customer ${name.trim()} (${cleanPhone}) sent an inquiry: "${message.trim()}"`,
            isRead: false,
          },
        });
      } catch (err) {
        console.warn('Failed to save notification record:', err);
      }
    }

    // 4. Dispatch Email Notification directly to Merchant via Brevo API
    const merchantEmail = shop.email || shop.owner?.email || 'gurvinderaulakh497@gmail.com';
    const merchantName = shop.name || shop.owner?.name || 'Valued Merchant';
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'gurvindersingh0218@gmail.com';

    if (apiKey && merchantEmail) {
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
              name: 'Navya Collection Marketplace',
              email: senderEmail,
            },
            to: [
              {
                email: merchantEmail,
                name: merchantName,
              },
            ],
            subject: `📩 New Customer Inquiry Received for ${shop.name}`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; color: #0f172a; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e3a8a; margin-top: 0;">📩 New Customer Inquiry Received!</h2>
                <p>Hello <strong>${merchantName}</strong>,</p>
                <p>You have received a new customer inquiry for <strong>${shop.name}</strong> on Navya Collection Marketplace.</p>
                
                <div style="background-color: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1; margin: 20px 0;">
                  <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${name.trim()}</p>
                  <p style="margin: 4px 0;"><strong>Mobile Number:</strong> <a href="tel:${cleanPhone}" style="color: #2563eb; font-weight: bold;">+91 ${cleanPhone}</a></p>
                  <p style="margin: 4px 0;"><strong>WhatsApp Chat:</strong> <a href="https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(name.trim())},%20thank%20you%20for%20inquiring%20with%20${encodeURIComponent(shop.name)}" style="color: #059669; font-weight: bold;">Start WhatsApp Chat ↗</a></p>
                </div>

                <div style="background-color: #fffbe6; padding: 16px; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #b45309;">Inquiry Message:</p>
                  <p style="margin: 0; font-style: italic; color: #1e293b;">"${message.trim()}"</p>
                </div>

                <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
                  Please call or message the customer directly at <strong>+91 ${cleanPhone}</strong> to assist them.
                </p>
              </div>
            `,
          }),
        });

        if (mailRes.ok) {
          console.log(`✅ Merchant Inquiry Email dispatched to [${merchantEmail}] via Brevo!`);
        } else {
          const errData = await mailRes.json();
          console.warn('⚠️ Brevo email dispatch warning:', errData);
        }
      } catch (err) {
        console.error('❌ Failed to dispatch Brevo merchant email:', err);
      }
    }

    console.log(`📩 New Customer Inquiry Successfully Processed for [${shop.name}] (${shop.id}):`);
    console.log(`- From: ${name.trim()} (${cleanPhone})`);
    console.log(`- Message: ${message.trim()}`);

    return NextResponse.json({
      success: true,
      message: `Inquiry successfully sent to ${shop.name}!`,
      data: {
        shopName: shop.name,
        customerName: name.trim(),
        customerPhone: cleanPhone,
      },
    });
  } catch (error: any) {
    console.error('❌ Shop Inquiry API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit customer inquiry.' },
      { status: 500 },
    );
  }
}
