import { wrapEmailLayout } from '@/frontend/features/notifications/templates/email-layout';
import { formatPrice } from '@/frontend/features/notifications/utils/template.utils';

export interface FoundingOfferEmailProps {
  sellerName: string;
  shopName: string;
  slotNumber: number;
  commissionRateTier1?: number;
  commissionRateTier2?: number;
  standardRate?: number;
  portalUrl?: string;
}

export interface ReferAndEarnEmailProps {
  customerName: string;
  referralCode: string;
  referralLink: string;
  whatsAppShareUrl: string;
  welcomeDiscount?: number;
  referrerReward?: number;
}

export interface ProductShowcaseItem {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  shopName: string;
  slug: string;
}

export interface ProductShowcaseEmailProps {
  customerName: string;
  headline?: string;
  products: ProductShowcaseItem[];
  shopUrl?: string;
}

/**
 * 👑 FOUNDING 50 SELLER WELCOME & OFFER EMAIL
 * Sent to approved sellers when onboarded or broadcasted to existing approved sellers.
 */
export function renderFounding50OfferEmail(props: FoundingOfferEmailProps): {
  subject: string;
  html: string;
} {
  const sellerName = props.sellerName || 'Valued Boutique Partner';
  const shopName = props.shopName || 'Your Boutique';
  const slot = props.slotNumber || 1;
  const tier1 = props.commissionRateTier1 || 5.0;
  const tier2 = props.commissionRateTier2 || 7.5;
  const standard = props.standardRate || 10.0;
  const portalUrl = props.portalUrl || 'https://jiivaakart.com/seller/dashboard';

  const subject = `👑 Badhai Ho! "${shopName}" JiivaaKart Founding 50 Member Confirm (Slot #${slot})`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D;">👑 Official Seller Acquisition Program</span>
      <h2 style="font-size: 24px; color: #183A73; margin: 12px 0 6px 0; font-weight: 800;">
        Welcome to Founding 50, ${sellerName}!
      </h2>
      <p style="font-size: 14px; color: #64748B; margin: 0;">
        Aapka boutique <strong style="color: #183A73;">"${shopName}"</strong> officially approve ho chuka hai aur aapko JiivaaKart Founding 50 seller privilege grant ki gayi hai.
      </p>
    </div>

    <!-- Slot Confirmation Box -->
    <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 2px dashed #D97706; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #92400E; display: block; margin-bottom: 4px;">YOUR ALLOCATED FOUNDING PRIVILEGE</span>
      <span style="font-size: 32px; font-weight: 900; color: #B45309; font-family: monospace;">SLOT #${slot} of 50</span>
      <p style="font-size: 12px; color: #78350F; margin: 6px 0 0 0; font-weight: 600;">
        Verified Founding Seller Badge activated on your storefront profile.
      </p>
    </div>

    <!-- Milestone Matrix Grid -->
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <h3 style="font-size: 15px; color: #183A73; margin: 0 0 14px 0; font-weight: 800; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">
        📊 Promotional Commission Milestone Matrix (Version 1.0)
      </h3>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 0; color: #475569; font-weight: 700;">Delivered Orders 1 – 10:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 900; color: #F15A25; font-size: 16px;">
            ${tier1}% <span style="font-size: 11px; color: #059669; font-weight: bold; background: #ECFDF5; padding: 2px 6px; border-radius: 4px;">50% Discount</span>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 0; color: #475569; font-weight: 700;">Delivered Orders 11 – 20:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 900; color: #7C3AED; font-size: 16px;">
            ${tier2}% <span style="font-size: 11px; color: #6D28D9; font-weight: bold; background: #F5F3FF; padding: 2px 6px; border-radius: 4px;">Transition Tier</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748B;">Orders 21+ and Standard Sellers:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 800; color: #64748B;">
            ${standard}% Standard
          </td>
        </tr>
      </table>
    </div>

    <!-- Exclusive Partner Benefits -->
    <div style="margin: 24px 0;">
      <h3 style="font-size: 14px; color: #183A73; margin: 0 0 12px 0; font-weight: 800;">
        🌟 Exclusive Boutique Privileges:
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.8;">
        <li><strong>Zero Fixed Costs:</strong> Zero registration fee, zero monthly subscription, zero catalog listing fee.</li>
        <li><strong>Doorstep Automated Pickups:</strong> Automated pickup generation via Shiprocket pan-India delivery network.</li>
        <li><strong>Guaranteed Payouts:</strong> Transparent commission settlement directly into your bank account after delivery.</li>
        <li><strong>Prime Visibility:</strong> Featured placement in JiivaaKart "Curated Boutiques" and customer search spotlight.</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${portalUrl}" class="button" style="background: #183A73; font-size: 15px; padding: 14px 36px; box-shadow: 0 4px 14px rgba(24, 58, 115, 0.3);">
        Login to Seller Dashboard & Upload Catalog →
      </a>
      <p style="font-size: 11px; color: #94A3B8; margin-top: 8px;">
        Need help onboarding products? Contact Seller Support: seller-support@jiivaakart.com
      </p>
    </div>
  `;

  return { subject, html: wrapEmailLayout(subject, body) };
}

/**
 * 🎁 REFER & EARN CUSTOMER ANNOUNCEMENT EMAIL
 * Sent to all registered customers with their personal referral code and 1-click WhatsApp share button.
 */
export function renderReferAndEarnEmail(props: ReferAndEarnEmailProps): {
  subject: string;
  html: string;
} {
  const name = props.customerName || 'Jiivaa Shopper';
  const code = props.referralCode || 'JIIVAA-REFER';
  const link = props.referralLink || `https://jiivaakart.com/register?ref=${code}`;
  const welcomeDiscount = props.welcomeDiscount || 50;
  const referrerReward = props.referrerReward || 50;
  const whatsAppUrl =
    props.whatsAppShareUrl ||
    `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `Hey! I'm shopping verified boutique fashion on JiivaaKart. Use my invite code *${code}* or click ${link} to get Flat ₹${welcomeDiscount} OFF on your first order! 🛍️✨`,
    )}`;

  const subject = `🎁 Har Dost Par Kamao ₹${referrerReward}! JiivaaKart Refer & Earn Is Live`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A;">🎁 Exclusive Referral Program</span>
      <h2 style="font-size: 24px; color: #183A73; margin: 12px 0 6px 0; font-weight: 800;">
        Dost Ko Bulayein, Dono Kamayein!
      </h2>
      <p style="font-size: 14px; color: #64748B; margin: 0;">
        Hi ${name}, JiivaaKart ka official <strong>Refer & Earn Program</strong> live ho chuka hai.
      </p>
    </div>

    <!-- Dual Benefit Card -->
    <div style="display: table; width: 100%; margin: 20px 0; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
      <div style="display: table-cell; width: 50%; padding: 18px; text-align: center; border-right: 1px solid #E2E8F0; vertical-align: middle;">
        <span style="font-size: 28px; display: block; margin-bottom: 4px;">🎉</span>
        <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Aapke Dost Ko</span>
        <span style="font-size: 20px; font-weight: 900; color: #059669; display: block; margin-top: 4px;">Flat ₹${welcomeDiscount} OFF</span>
        <span style="font-size: 11px; color: #64748B;">on their first purchase</span>
      </div>
      <div style="display: table-cell; width: 50%; padding: 18px; text-align: center; vertical-align: middle;">
        <span style="font-size: 28px; display: block; margin-bottom: 4px;">🪙</span>
        <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Aapko Milega</span>
        <span style="font-size: 20px; font-weight: 900; color: #F15A25; display: block; margin-top: 4px;">₹${referrerReward} Cash Reward</span>
        <span style="font-size: 11px; color: #64748B;">har delivered order par</span>
      </div>
    </div>

    <!-- Personal Referral Code Box -->
    <div style="background: #FFFFFF; border: 2px dashed #183A73; border-radius: 16px; padding: 22px; text-align: center; margin: 24px 0;">
      <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 2px; display: block;">YOUR PERSONAL INVITE CODE</span>
      <span style="font-size: 32px; font-weight: 900; color: #183A73; letter-spacing: 4px; font-family: monospace; display: block; margin: 8px 0;">
        ${code}
      </span>
      <p style="font-size: 12px; color: #64748B; margin: 4px 0 0 0;">
        Or share this direct link: <a href="${link}" style="color: #F15A25; font-weight: 700; word-break: break-all;">${link}</a>
      </p>
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 24px 0;">
      <a href="${whatsAppUrl}" target="_blank" style="display: inline-block; background: #25D366; color: #FFFFFF !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 50px; text-align: center; margin: 6px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);">
        💬 Share on WhatsApp Now →
      </a>
      <a href="https://jiivaakart.com/account/referrals" style="display: inline-block; background: #183A73; color: #FFFFFF !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 50px; text-align: center; margin: 6px; box-shadow: 0 4px 14px rgba(24, 58, 115, 0.2);">
        View My Referral Wallet →
      </a>
    </div>

    <!-- Steps -->
    <div style="background: #F8FAFC; border-radius: 12px; padding: 16px 20px; margin-top: 24px;">
      <p style="font-size: 12px; font-weight: 800; color: #183A73; margin: 0 0 8px 0;">Kaise Kaam Karta Hai?</p>
      <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.7;">
        <li>Apna referral code WhatsApp ya social media par dosto ko share karein.</li>
        <li>Aapke dost sign up karke pehla order place karte hain.</li>
        <li>Unka order deliver hote hi aapke wallet mein ₹${referrerReward} (Jiivaa Coins) credit ho jayenge, jise aap agle order par 100% use kar sakte hain!</li>
      </ol>
    </div>
  `;

  return { subject, html: wrapEmailLayout(subject, body) };
}

/**
 * 👗 PRODUCT DISCOVERY & TRENDING PICKS SHOWCASE EMAIL
 * Sent to users to bring them back to the site ("taaki log aake dekhe").
 */
export function renderProductShowcaseEmail(props: ProductShowcaseEmailProps): {
  subject: string;
  html: string;
} {
  const name = props.customerName || 'Fashion Lover';
  const headline = props.headline || 'Curated Indian Boutique Styles You Will Love';
  const products = props.products || [];
  const shopUrl = props.shopUrl || 'https://jiivaakart.com/shop';

  const subject = `🔥 Fresh Boutique Picks: Trending Handpicked Styles Just for You!`;

  const productCardsHtml = products
    .map((p) => {
      const discount =
        p.compareAtPrice && p.compareAtPrice > p.price
          ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
          : null;

      const productLink = `https://jiivaakart.com/product/${p.slug}`;
      const img =
        p.imageUrl || 'https://jiivaakart.com/brand/jiivaa/crops/expressions/expr-1-6-thinking.png';

      return `
        <div style="display: inline-block; width: 47%; vertical-align: top; margin: 1%; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div style="position: relative; width: 100%; height: 180px; background: #F1F5F9; text-align: center; overflow: hidden;">
            <a href="${productLink}">
              <img src="${img}" alt="${p.name}" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
            </a>
            ${
              discount
                ? `<span style="position: absolute; top: 8px; left: 8px; background: #F15A25; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${discount}% OFF</span>`
                : ''
            }
          </div>
          <div style="padding: 12px;">
            <span style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; display: block;">
              ${p.shopName}
            </span>
            <a href="${productLink}" style="font-size: 13px; font-weight: 700; color: #183A73; text-decoration: none; display: block; margin: 4px 0 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${p.name}
            </a>
            <div style="display: flex; align-items: baseline; justify-content: space-between;">
              <div>
                <span style="font-size: 15px; font-weight: 900; color: #F15A25;">${formatPrice(p.price)}</span>
                ${
                  p.compareAtPrice && p.compareAtPrice > p.price
                    ? `<span style="font-size: 11px; color: #94A3B8; text-decoration: line-through; margin-left: 4px;">${formatPrice(p.compareAtPrice)}</span>`
                    : ''
                }
              </div>
            </div>
            <a href="${productLink}" style="display: block; margin-top: 10px; background: #183A73; color: #FFFFFF !important; font-size: 11px; font-weight: 800; text-align: center; padding: 8px 0; border-radius: 8px; text-decoration: none;">
              Buy Now →
            </a>
          </div>
        </div>
      `;
    })
    .join('');

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background: #FEF4F0; color: #F15A25; border: 1px solid #FDE6DC;">Trending Styles</span>
      <h2 style="font-size: 22px; color: #183A73; margin: 12px 0 6px 0; font-weight: 800;">
        ${headline}
      </h2>
      <p style="font-size: 13px; color: #64748B; margin: 0;">
        Hello ${name}, direct from top verified Indian fashion boutiques to your wardrobe.
      </p>
    </div>

    <!-- Product Grid -->
    <div style="text-align: center; margin: 20px 0;">
      ${productCardsHtml || '<p style="color: #64748B;">Explore our full collection on the store.</p>'}
    </div>

    <!-- Explore CTA -->
    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${shopUrl}" class="button" style="background: #F15A25; font-size: 14px; padding: 14px 36px;">
        Explore All Boutique Collections →
      </a>
      <p style="font-size: 11px; color: #94A3B8; margin-top: 10px;">
        Pan-India Express Delivery • 100% Verified Boutique Quality • 7-Day Easy Exchange
      </p>
    </div>
  `;

  return { subject, html: wrapEmailLayout(subject, body) };
}
