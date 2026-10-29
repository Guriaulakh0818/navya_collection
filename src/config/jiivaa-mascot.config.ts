/**
 * JIIVAA - Official Brand Mascot Configuration & Asset Registry
 *
 * "Same Style. Bigger Stories. For Every Indian Store."
 * Brand Mascot Identity Guide for JiivaaKart (Navy #0A2342, Orange #F28C28, White #FFFFFF)
 *
 * NOTE: DO NOT MODIFY EXISTING APP CODE - This is a central standalone asset registry
 * ready for import when implementing UI touchpoints.
 */

export interface MascotAsset {
  id: string;
  name: string;
  title: string;
  path: string;
  category: 'hero' | 'expression' | 'avatar' | 'outfit' | 'turnaround' | 'prop' | 'brand';
  description: string;
  suggestedUseCases: string[];
}

export const JIIVAA_BRAND_COLORS = {
  navy: {
    hex: '#0A2342',
    name: 'Navy Blue',
    meaning: 'Trust, Premium, Reliable',
  },
  orange: {
    hex: '#F28C28',
    name: 'Brand Orange',
    meaning: 'Energy, Modern, Young',
  },
  white: {
    hex: '#FFFFFF',
    name: 'Pure White',
    meaning: 'Clean, Simple, Versatile',
  },
} as const;

export const JIIVAA_VISUAL_DNA = {
  mascotName: 'Jiivaa',
  tagline: 'Same Style. Bigger Stories. For Every Indian Store.',
  brandTagline: 'STYLE THAT SPEAKS',
  characterType: 'Chibi / Stylized Anime young Indian girl (approx. 3 heads tall proportion)',
  keyAnchors: [
    'Hair: Rich dark brown hair tied in a high back ponytail with two softly curved side bangs framing each cheek',
    'Earrings: Signature traditional silver Indian jhumkas on both ears in EVERY pose, outfit, and expression',
    'Eyes: Big expressive dark brown anime eyes with top-left circular catchlights and lower subtle highlights',
    'Smile: Warm, energetic, hospitable, confident Indian youth expression',
    'Wardrobe Colors: Navy Blue (#0A2342), Brand Orange (#F28C28), Pure White (#FFFFFF)',
  ],
  aiPromptConsistencyFormula:
    'Jiivaa anime chibi young Indian girl mascot, rich dark brown hair in high ponytail with two side bangs, signature silver jhumka earrings on both ears, large expressive dark brown eyes, JiivaaKart color palette #0A2342 navy blue and #F28C28 vibrant orange, clean lines, high quality vector-art shading, friendly and professional expression, 100% facial consistency',
} as const;

export const JIIVAA_ASSETS: Record<string, MascotAsset> = {
  // Hero Assets
  heroFullBanner: {
    id: 'hero-full-banner',
    name: 'Hero Full Banner',
    title: 'Meet Jiivaa - Hero Presentation Card',
    path: '/brand/jiivaa/crops/hero-full-banner.png',
    category: 'hero',
    description:
      'Full brand hero composition with Meet Jiivaa headline, mascot pointing forward, shopping bag, and brand mission tagline.',
    suggestedUseCases: [
      'Homepage Hero Section',
      'About Us Page',
      'Seller Onboarding Welcome Modal',
      'App Splash Screen',
    ],
  },
  heroHeadAvatar: {
    id: 'hero-head-avatar',
    name: 'Hero Head Avatar',
    title: 'Jiivaa Smiling Head Avatar',
    path: '/brand/jiivaa/crops/hero-head-avatar.png',
    category: 'avatar',
    description: 'High-res close-up avatar of Jiivaas friendly smiling face with silver jhumkas.',
    suggestedUseCases: [
      'Chatbot / Support Bot Avatar',
      'Admin Header Assistant',
      'Navbar Floating Help',
      'Notification Toast Avatar',
    ],
  },

  // 6 Expressions (Full with Labels)
  exprHappy: {
    id: 'expression-1-happy',
    name: 'Happy',
    title: 'Jiivaa - Happy Expression',
    path: '/brand/jiivaa/crops/expression-1-happy.png',
    category: 'expression',
    description: 'Warm bright smile with friendly wave gesture.',
    suggestedUseCases: [
      'Order Confirmation Success',
      'Account Created Modal',
      'Welcome Banner',
      'Review Submitted Toast',
    ],
  },
  exprWinking: {
    id: 'expression-2-winking',
    name: 'Winking',
    title: 'Jiivaa - Winking Expression',
    path: '/brand/jiivaa/crops/expression-2-winking.png',
    category: 'expression',
    description: 'Playful left-eye wink with double peace sign.',
    suggestedUseCases: [
      'Coupon Successfully Applied',
      'Discount Unlocked Alert',
      'Flash Sale Countdown',
      'Loyalty Rewards',
    ],
  },
  exprExcited: {
    id: 'expression-3-excited',
    name: 'Excited',
    title: 'Jiivaa - Excited Expression',
    path: '/brand/jiivaa/crops/expression-3-excited.png',
    category: 'expression',
    description:
      'Wide open laughing smile with raised hands, celebration hearts, and sparkle accents.',
    suggestedUseCases: [
      'Mega Sale Launch',
      'Jackpot Offer Won',
      'Referral Bonus Unlocked',
      'Milestone Order #1000',
    ],
  },
  exprThinking: {
    id: 'expression-4-thinking',
    name: 'Thinking',
    title: 'Jiivaa - Thinking Expression',
    path: '/brand/jiivaa/crops/expression-4-thinking.png',
    category: 'expression',
    description: 'Curious gaze upward with hand to chin and question mark badge.',
    suggestedUseCases: [
      'Zero Search Results Empty State',
      'Empty Wishlist / Cart State',
      '404 Page Not Found',
      'FAQ Section Header',
    ],
  },
  exprCute: {
    id: 'expression-5-cute',
    name: 'Cute',
    title: 'Jiivaa - Cute Expression',
    path: '/brand/jiivaa/crops/expression-5-cute.png',
    category: 'expression',
    description: 'Innocent sparkling wide eyes, sweet smile, hands held together.',
    suggestedUseCases: [
      'Cart Abandonment Reminder Modal',
      'Feedback / Rating Prompt',
      'Please Come Back Push Notification',
      'Newsletter Signup',
    ],
  },
  exprConfident: {
    id: 'expression-6-confident',
    name: 'Confident',
    title: 'Jiivaa - Confident Expression',
    path: '/brand/jiivaa/crops/expression-6-confident.png',
    category: 'expression',
    description: 'Arms crossed, assured proud smile, looking directly at user.',
    suggestedUseCases: [
      'Secure Checkout Guarantee Badge',
      '100% Quality N-Assured Banner',
      'Fast Pan-India Delivery Guarantee',
      'Verified Seller Badge',
    ],
  },

  // 6 Tight Avatars (Circles)
  avatarHappy: {
    id: 'avatar-1-happy',
    name: 'Happy Avatar',
    title: 'Happy Face Circular Avatar',
    path: '/brand/jiivaa/crops/avatar-1-happy.png',
    category: 'avatar',
    description: 'Circular crop of happy smile.',
    suggestedUseCases: ['Order Status: Delivered', 'Profile Completion Badge'],
  },
  avatarWinking: {
    id: 'avatar-2-winking',
    name: 'Winking Avatar',
    title: 'Winking Face Circular Avatar',
    path: '/brand/jiivaa/crops/avatar-2-winking.png',
    category: 'avatar',
    description: 'Circular crop of winking eye.',
    suggestedUseCases: ['Promo Code Input Success Icon', 'Special Offer Pill'],
  },
  avatarExcited: {
    id: 'avatar-3-excited',
    name: 'Excited Avatar',
    title: 'Excited Face Circular Avatar',
    path: '/brand/jiivaa/crops/avatar-3-excited.png',
    category: 'avatar',
    description: 'Circular crop of laughing celebration face.',
    suggestedUseCases: ['Order Placed Celebratory Pill', 'Festival Alert'],
  },
  avatarThinking: {
    id: 'avatar-4-thinking',
    name: 'Thinking Avatar',
    title: 'Thinking Face Circular Avatar',
    path: '/brand/jiivaa/crops/avatar-4-thinking.png',
    category: 'avatar',
    description: 'Circular crop of wondering face.',
    suggestedUseCases: ['Live Search Typeahead Empty State', 'Troubleshooting Bot Icon'],
  },
  avatarCute: {
    id: 'avatar-5-cute',
    name: 'Cute Avatar',
    title: 'Cute Face Circular Avatar',
    path: '/brand/jiivaa/crops/avatar-5-cute.png',
    category: 'avatar',
    description: 'Circular crop of sparkly eye face.',
    suggestedUseCases: ['Wishlist Icon Badge', 'Support Ticket Reply Avatar'],
  },
  avatarConfident: {
    id: 'avatar-6-confident',
    name: 'Confident Avatar',
    title: 'Confident Face Circular Avatar',
    path: '/brand/jiivaa/crops/avatar-6-confident.png',
    category: 'avatar',
    description: 'Circular crop of confident face.',
    suggestedUseCases: ['Admin Dashboard Welcome Pill', 'Security Verification Badge'],
  },

  // 7 Outfits
  outfitSignature: {
    id: 'outfit-1-signature-everyday',
    name: 'Signature Look (Everyday)',
    title: 'Signature Navy/Orange Tracksuit',
    path: '/brand/jiivaa/crops/outfit-1-signature-everyday.png',
    category: 'outfit',
    description:
      'Navy and orange track jacket, white JK tee, navy cargo pants, chunky sneakers, holding JiivaaKart bag.',
    suggestedUseCases: [
      'Default Mascot Across Platform',
      'Daily Shopping Guide',
      'Homepage Promo Card',
    ],
  },
  outfitTraditional: {
    id: 'outfit-2-traditional-festive',
    name: 'Traditional Look (Festive)',
    title: 'Traditional Kurti in Namaste Pose',
    path: '/brand/jiivaa/crops/outfit-2-traditional-festive.png',
    category: 'outfit',
    description:
      'Bright orange embroidered kurti, navy dupatta, white churidar, hands joined in Namaste greeting.',
    suggestedUseCases: [
      'Ethnic Wear Category Banner',
      'Indian Festivals (Holi, Eid, Baisakhi, Pongal)',
      'Welcome Indian Shoppers Banner',
    ],
  },
  outfitShopping: {
    id: 'outfit-3-shopping-casual',
    name: 'Shopping Look (Casual)',
    title: 'White JK Hoodie with Navy Tote',
    path: '/brand/jiivaa/crops/outfit-3-shopping-casual.png',
    category: 'outfit',
    description: 'White oversized hoodie with JK crest, blue denim jeans, navy shopping tote bag.',
    suggestedUseCases: [
      'Casual Wear / Western Wear Section',
      'Cart Slider Summary Drawer',
      'Weekend Sale Banner',
    ],
  },
  outfitSellerSupport: {
    id: 'outfit-4-seller-support-onboarding',
    name: 'Seller Support (Onboarding)',
    title: 'Jiivaa with JiivaaKart Laptop',
    path: '/brand/jiivaa/crops/outfit-4-seller-support-onboarding.png',
    category: 'outfit',
    description: 'Track jacket look holding an open laptop displaying the JiivaaKart logo.',
    suggestedUseCases: [
      'Seller Portal Landing Page',
      'Seller KYC & Catalog Management Steps',
      'Business Onboarding Wizard',
      'Developer / API Docs',
    ],
  },
  outfitDiwali: {
    id: 'outfit-5-diwali-festive',
    name: 'Diwali Look (Festive)',
    title: 'Royal Navy & Gold Lehenga with Diya',
    path: '/brand/jiivaa/crops/outfit-5-diwali-festive.png',
    category: 'outfit',
    description:
      'Rich royal navy blue and gold zari lehenga choli with bright orange dupatta and lit festive diya.',
    suggestedUseCases: [
      'Diwali Mega Festive Sale Banner',
      'Special Holiday Discounts',
      'Gift Card / Dhanteras Offers',
    ],
  },
  outfitTravelBackpack: {
    id: 'outfit-6-travel-backpack',
    name: 'Travel Look (Pan India)',
    title: 'Pan-India Travel Look with Backpack & Cap',
    path: '/brand/jiivaa/crops/outfit-6-travel-backpack.png',
    category: 'outfit',
    description: 'Navy cap, backpack, track suit, ready to travel across India.',
    suggestedUseCases: [
      'Pan-India Express Shipping Info Card',
      'Courier Tracking Status: Out for Delivery',
      'Pincode Serviceability Modal',
    ],
  },
  outfitTravelLuggage: {
    id: 'outfit-7-travel-luggage',
    name: 'Travel Look (Pan India Luggage)',
    title: 'Pan-India Travel Look with Trolley Suitcase',
    path: '/brand/jiivaa/crops/outfit-7-travel-luggage.png',
    category: 'outfit',
    description: 'Navy cap and track suit holding a navy trolley luggage bag.',
    suggestedUseCases: [
      'Luggage & Travel Accessories Category',
      'Inter-State Delivery Tracker',
      'Logistics Hub Update Banner',
    ],
  },

  // Turnaround (360 Character Consistency)
  turnaroundFront: {
    id: 'turnaround-1-front',
    name: 'Turnaround - Front View',
    title: 'Jiivaa Standing Front View',
    path: '/brand/jiivaa/crops/turnaround-1-front.png',
    category: 'turnaround',
    description: 'Clean front standing view, hands in pockets.',
    suggestedUseCases: ['Standard Mascot Asset', 'Brand Kit Documentation'],
  },
  turnaroundSideLeft: {
    id: 'turnaround-2-side-left',
    name: 'Turnaround - Side View (Left)',
    title: 'Jiivaa Side View Left',
    path: '/brand/jiivaa/crops/turnaround-2-side-left.png',
    category: 'turnaround',
    description:
      'Side profile showing orange ponytail tie, cheek bangs, silver jhumka, side stripe on pants.',
    suggestedUseCases: ['Walking Animations', 'Interactive 3D Carousel'],
  },
  turnaroundBack: {
    id: 'turnaround-3-back',
    name: 'Turnaround - Back View',
    title: 'Jiivaa Back View with JiivaaKart Logo',
    path: '/brand/jiivaa/crops/turnaround-3-back.png',
    category: 'turnaround',
    description: 'Back view showing high ponytail hairstyle and JiivaaKart logo printed on jacket.',
    suggestedUseCases: ['Departing Screens', 'Brand Merchandise Preview'],
  },
  turnaroundSideRight: {
    id: 'turnaround-4-side-right',
    name: 'Turnaround - Side View (Right)',
    title: 'Jiivaa Side View Right',
    path: '/brand/jiivaa/crops/turnaround-4-side-right.png',
    category: 'turnaround',
    description: 'Right side profile completing 360-degree character model.',
    suggestedUseCases: ['Turnaround Rotations', 'Animated Lottie Reference'],
  },

  // Props & Elements
  propShoppingBag: {
    id: 'prop-1-shopping-bag',
    name: 'Shopping Bag',
    title: 'Branded JiivaaKart Shopping Bag',
    path: '/brand/jiivaa/crops/prop-1-shopping-bag.png',
    category: 'prop',
    description: 'White & orange branded paper shopping bag with rope handles and logo.',
    suggestedUseCases: [
      'Cart Summary Header',
      'Add to Bag Floating Animation',
      'Checkout Step 1 Indicator',
    ],
  },
  propPackagingBox: {
    id: 'prop-2-packaging-box',
    name: 'Packaging Box',
    title: 'Branded JiivaaKart Shipping Box',
    path: '/brand/jiivaa/crops/prop-2-packaging-box.png',
    category: 'prop',
    description: 'Kraft corrugated shipping box with JiivaaKart logo and tagline.',
    suggestedUseCases: [
      'Shipping & Delivery Information',
      'Unboxing Guarantee Badge',
      'Returns & Exchanges Guide',
    ],
  },
  propLaptop: {
    id: 'prop-3-laptop',
    name: 'Laptop',
    title: 'JiivaaKart Branded Laptop',
    path: '/brand/jiivaa/crops/prop-3-laptop.png',
    category: 'prop',
    description: 'Modern silver ultrabook displaying the JiivaaKart logo.',
    suggestedUseCases: [
      'Seller Portal Dashboard CTA',
      'Web-Only Exclusives Badge',
      'Desktop App Promo',
    ],
  },
  propCap: {
    id: 'prop-4-cap',
    name: 'Cap',
    title: 'Branded JiivaaKart Navy Baseball Cap',
    path: '/brand/jiivaa/crops/prop-4-cap.png',
    category: 'prop',
    description: 'Navy blue curved visor baseball cap with embroidered JiivaaKart logo.',
    suggestedUseCases: ['Merchandise Store / Free Swag Offer', 'Delivery Partner ID Badge'],
  },

  // Brand Badges
  brandLogoCard: {
    id: 'brand-logo-card',
    name: 'Official Logo Card',
    title: 'JiivaaKart STYLE THAT SPEAKS Logo',
    path: '/brand/jiivaa/crops/brand-logo-card.png',
    category: 'brand',
    description: 'Official shopping bag motif logo with JK initials and STYLE THAT SPEAKS tagline.',
    suggestedUseCases: ['Navbar Brand Header', 'Footer Logo', 'Invoice / Bill Header'],
  },
  brandColorsCard: {
    id: 'brand-colors-card',
    name: 'Brand Colours Swatch Card',
    title: 'Official JiivaaKart Color Swatches',
    path: '/brand/jiivaa/crops/brand-colors-card.png',
    category: 'brand',
    description: 'Hex #0A2342 Navy Blue, #F28C28 Orange, #FFFFFF White.',
    suggestedUseCases: ['Design System Documentation', 'Tailwind Config Reference'],
  },
};

/**
 * Helper to get all assets by category
 */
export function getMascotAssetsByCategory(category: MascotAsset['category']): MascotAsset[] {
  return Object.values(JIIVAA_ASSETS).filter((asset) => asset.category === category);
}

/**
 * Master sheet path
 */
export const JIIVAA_MASTER_SHEET_PATH = '/brand/jiivaa/jiivaa-master-sheet.jpg';
