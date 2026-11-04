/**
 * JiivaaKart 200 Push Notification Master Library
 * Brand: JiivaaKart | Style that speaks | Deep Navy (#183A73) & Warm Orange (#F28C28)
 * Approved by User for automated and manual marketing campaigns.
 */

export type NotificationCategoryKey =
  | 'FUNNY_RELATABLE'
  | 'GENZ_MEME'
  | 'CURIOSITY_SUSPENSE'
  | 'PLAYFUL_ROAST'
  | 'CART_WISHLIST'
  | 'FASHION_SEGMENTS'
  | 'BOUTIQUE_DISCOVERY'
  | 'OFFERS_DEALS'
  | 'COMEBACK_LOYALTY'
  | 'FESTIVALS_SEASONS';

export interface PushNotificationTemplate {
  id: string; // '001' - '200'
  category: NotificationCategoryKey;
  categoryLabel: string;
  title: string;
  message: string;
  cta: string;
  url: string;
  trigger: string;
  tags: string[];
}

export const JIIVAA_TEMPLATE_CATEGORIES: Record<
  NotificationCategoryKey,
  { label: string; icon: string; description: string }
> = {
  FUNNY_RELATABLE: {
    label: 'Funny & Relatable Shopping',
    icon: '😂',
    description: 'Everyday wardrobe dilemmas and relatable humor hooks',
  },
  GENZ_MEME: {
    label: 'Gen-Z, Meme & Internet Energy',
    icon: '😜',
    description: 'Fit checks, drip, POV hooks, and aesthetic vibes',
  },
  CURIOSITY_SUSPENSE: {
    label: 'Curiosity, Suspense & Click-Worthy',
    icon: '👀',
    description: 'High-CTR suspense drops and exclusive reveals',
  },
  PLAYFUL_ROAST: {
    label: 'Playful Roast & Savage (Friendly)',
    icon: '🔥',
    description: 'Humorous wardrobe call-outs and friendly nudges',
  },
  CART_WISHLIST: {
    label: 'Cart, Wishlist & Browsing Nudges',
    icon: '🛍️',
    description: 'High-intent abandoned cart, wishlist, and recently viewed triggers',
  },
  FASHION_SEGMENTS: {
    label: 'Men, Women & Kids Fashion Fun',
    icon: '👗',
    description: 'Direct category alerts for shirts, denim, ethnic, and kidswear',
  },
  BOUTIQUE_DISCOVERY: {
    label: 'Boutique Discovery & Uniqueness',
    icon: '🏬',
    description: 'Highlighting local craft, authentic Hisar roots, and unique designs',
  },
  OFFERS_DEALS: {
    label: 'Offers, Deals & Campaign Humour',
    icon: '🎉',
    description: 'Budget-friendly value hooks, ₹150 sets, and ₹50 referral perks',
  },
  COMEBACK_LOYALTY: {
    label: 'Comeback, Loyalty & Friendly Engagement',
    icon: '💌',
    description: 'Re-activating inactive users and coin passbook balance reminders',
  },
  FESTIVALS_SEASONS: {
    label: 'Festivals, Seasons & Occasion Fun',
    icon: '🎊',
    description: 'Weddings, Diwali, Eid, Rakhi, Valentine, and seasonal wardrobe switches',
  },
};

export const JIIVAA_PUSH_TEMPLATES: PushNotificationTemplate[] = [
  // ==========================================
  // 😂 Section 1: Funny & Relatable Shopping (001 - 020)
  // ==========================================
  {
    id: '001',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: "Wardrobe full, phir bhi 'pehenne ko kuch nahi' 🤡",
    message:
      'Classic problem ka stylish solution mil gaya! Hamari textured shirts & denim fits try karo.',
    cta: 'Fix My Wardrobe',
    url: '/shop',
    trigger: 'Weekend Morning (10 AM)',
    tags: ['humor', 'wardrobe', 'weekend'],
  },
  {
    id: '002',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Kapde toh hain… outfit wali feeling nahi 😭',
    message:
      'Wine Maroon Textured Shirt + Diesel Blue Jeans ka combo dekh lo, pure main-character vibe aayegi!',
    cta: 'Find My Look',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'General Browsing (1 PM)',
    tags: ['outfit', 'maroon-shirt', 'diesel-jeans'],
  },
  {
    id: '003',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Aaj shopping nahi karni thi… bas dekhna tha 👀',
    message:
      'Haan haan {customer_name}, hum samajhte hain! Bas 2 minute boutique new arrivals dekh lo.',
    cta: 'Just Browsing',
    url: '/shop',
    trigger: 'Afternoon (3 PM)',
    tags: ['browsing', 'casual'],
  },
  {
    id: '004',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: "Tumhara wardrobe: 'Mujhe upgrade chahiye!' 😂",
    message:
      'Purane kapdon ko thoda rest do. JiivaaKart par Men, Women aur Kids fresh fashion explore karo.',
    cta: 'Upgrade Now',
    url: '/shop',
    trigger: 'Thursday Evening (6 PM)',
    tags: ['upgrade', 'family'],
  },
  {
    id: '005',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Outfit repeat? Camera sab yaad rakhta hai 📸😂',
    message:
      'Kal ke party photos me same shirt mat daalo! Check out Premium Checkered & Striped shirts under ₹699.',
    cta: 'Explore Styles',
    url: '/category/men',
    trigger: 'Friday Evening (7 PM)',
    tags: ['party', 'weekend-prep', 'checkered-shirt'],
  },
  {
    id: '006',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Kapde khareedna hobby nahi… emotion hai 🥹🛍️',
    message:
      'Apne fashion emotions ko treat do. Handcrafted boutique styles aur trending fits ab live hain!',
    cta: 'Shop Now',
    url: '/shop',
    trigger: 'Sunday Morning (11 AM)',
    tags: ['emotion', 'weekend-shopping'],
  },
  {
    id: '007',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: "Mirror ne bola: 'Kuch naya try kar!' 🪞",
    message:
      'Mirror ki suno boss! Olive Green Textured Shirt aur Camo Track Lower try karke dekho.',
    cta: 'Take Challenge',
    url: '/p/men-s-olive-green-textured-casual-full-sleeve-shirt',
    trigger: 'Post-Shower / 9 AM',
    tags: ['olive-shirt', 'mirror-hook'],
  },
  {
    id: '008',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Monday ho ya Sunday, outfit ka drama daily 😅',
    message:
      'Daily office aur college ke liye crisp Cotton Textured Shirts sirf ₹449 se shuru. Drama khatam!',
    cta: 'Browse Everyday',
    url: '/category/men',
    trigger: 'Monday Morning (8 AM)',
    tags: ['monday', 'office', 'budget-shirts'],
  },
  {
    id: '009',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Shopping list: 1 item. Cart: emotional damage 😂',
    message:
      'Koi guilt nahi {customer_name}! JiivaaKart ke boutique prices budget ko bilkul hurt nahi karenge.',
    cta: 'Explore Now',
    url: '/shop',
    trigger: 'Payday / 1st of Month',
    tags: ['payday', 'budget'],
  },
  {
    id: '010',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Aaj ka mood: bas thoda sa fashion 👀',
    message:
      'Thoda sa window shopping karna 100% free hai. Promise, bas ek nazar boutique finds dekh lo!',
    cta: 'Take a Look',
    url: '/shop',
    trigger: 'Late Afternoon (4 PM)',
    tags: ['mood', 'window-shopping'],
  },
  {
    id: '011',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Wardrobe ko bhi kabhi-kabhi vacation chahiye 🧳',
    message:
      'Purane fits bore ho gaye? Summer vacation & weekend getaway ke liye light cotton casuals explore karo.',
    cta: 'Refresh Wardrobe',
    url: '/shop',
    trigger: 'Friday Afternoon (2 PM)',
    tags: ['vacation', 'travel'],
  },
  {
    id: '012',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Kapde bolte nahi… par style sab keh deta hai 😎',
    message:
      'Jis din Black Oversized Graphic Tee pehno, confidence alag hi bolta hai! Check out trending tees.',
    cta: 'Find Your Vibe',
    url: '/p/men-s-black-oversized-graphic-print-cotton-t-shirt',
    trigger: 'Evening (6 PM)',
    tags: ['oversized-tee', 'confidence'],
  },
  {
    id: '013',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Outfit decide karte-karte event hi na nikal jaaye 😭',
    message:
      'Ready-to-wear kurtis, designer shirts aur occasionwear curated hain taaki aap 2 minute me ready ho sako.',
    cta: 'Explore Looks',
    url: '/shop',
    trigger: 'Saturday (4 PM)',
    tags: ['event', 'partywear'],
  },
  {
    id: '014',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Tum aur shopping? Old love story ❤️',
    message:
      '{customer_name}, purani dosti ko naya twist do. Navya Collection boutique ki exclusive designs live hain.',
    cta: 'Continue Story',
    url: '/shop',
    trigger: 'Sunday Evening (7 PM)',
    tags: ['love-story', 'loyalty'],
  },
  {
    id: '015',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Same old look se thoda break le lo 😜',
    message:
      'Mall wale mass-produced kapde chhodo, local boutique crafted fashion pehno. Fark khud dikhega!',
    cta: 'Discover Boutiques',
    url: '/shop',
    trigger: 'Mid-week (Wed 5 PM)',
    tags: ['boutique', 'differentiation'],
  },
  {
    id: '016',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Aaj mirror ko surprise dete hain? 😉',
    message:
      "Beige Textured Shirt ke saath Straight Fit Diesel Jeans pair karo. Sheesha bhi bolega: 'Kya baat hai!'",
    cta: 'Surprise Me',
    url: '/p/men-s-beige-textured-full-sleeve-casual-shirt',
    trigger: 'Morning (9 AM)',
    tags: ['beige-shirt', 'mirror'],
  },
  {
    id: '017',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Shopping karne ka reason chahiye? Ye lo 😌',
    message:
      'Jiivaa VIP Coins me 100 Coins already loaded hain! Unhe use karke flat discount paane ka reason kaafi hai na?',
    cta: 'Find a Reason',
    url: '/account/rewards',
    trigger: 'Inactive User (2 days)',
    tags: ['vip-coins', 'discount'],
  },
  {
    id: '018',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Tumhara style status: loading… ⏳',
    message: 'Style ko 100% loaded banao! JiivaaKart ke top-rated boutique drops browse karo.',
    cta: 'Load My Style',
    url: '/shop',
    trigger: 'Evening (7:30 PM)',
    tags: ['loading', 'status'],
  },
  {
    id: '019',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'Kapdon ka selection meeting ab shuru 😂',
    message:
      'Family ke liye shopping? Men’s shirts, Women’s suits aur Kids sets ek hi cart me add karo.',
    cta: 'Start Exploring',
    url: '/shop',
    trigger: 'Sunday Afternoon',
    tags: ['family', 'meeting'],
  },
  {
    id: '020',
    category: 'FUNNY_RELATABLE',
    categoryLabel: 'Funny & Relatable Shopping',
    title: 'PS: Wardrobe tumse baat karna chahta hai 📩',
    message: "Bol raha hai: 'Bhai ek naya White Textured Shirt add kar de, party ready ho jaunga!'",
    cta: 'Open JiivaaKart',
    url: '/p/men-s-white-textured-casual-full-sleeve-shirt',
    trigger: 'Night (9 PM)',
    tags: ['white-shirt', 'conversation'],
  },

  // ==========================================
  // 😜 Section 2: Gen-Z, Meme & Internet Energy (021 - 040)
  // ==========================================
  {
    id: '021',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'POV: Tum bas 2 minute browse karne aaye the 💀',
    message:
      'Aur ab tum Black Graphic Oversized Tee aur Diesel Jeans dekh ke fan ho chuke ho! Checkout kar lo bestie.',
    cta: 'Explore Fits',
    url: '/p/men-s-black-oversized-graphic-print-cotton-t-shirt',
    trigger: 'High Browsing Session',
    tags: ['pov', 'genz', 'black-tee'],
  },
  {
    id: '022',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Main character energy? Outfit bhi waise chahiye ✨',
    message:
      'Side character outfits pehenna band karo. JiivaaKart ke top boutique drops pehno aur spotlight lo!',
    cta: 'Get the Look',
    url: '/shop',
    trigger: 'College Hours (12 PM)',
    tags: ['main-character', 'aesthetic'],
  },
  {
    id: '023',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: "It's giving… new outfit energy 💅",
    message:
      'Aesthetic vibes only! Wine Maroon textured shirts aur neutral beige tones abhi stock me hain.',
    cta: 'Shop the Vibe',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Evening (5 PM)',
    tags: ['its-giving', 'maroon-shirt'],
  },
  {
    id: '024',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'No thoughts, just cute outfits 🫶',
    message:
      'Overthinking zero, style 100! Women’s ethnic kurtis aur chic boutique collections check out karo.',
    cta: 'See the Fits',
    url: '/category/women',
    trigger: 'Afternoon (3 PM)',
    tags: ['women', 'aesthetic', 'kurtis'],
  },
  {
    id: '025',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: "Bro said 'last shopping'… again 🤡",
    message:
      'Humne kisiko nahi bataya bro! Bas ek chhota sa fit check kar lo, kisi ko pata nahi chalega.',
    cta: 'Browse Now',
    url: '/shop',
    trigger: 'Night (10 PM)',
    tags: ['bro', 'meme'],
  },
  {
    id: '026',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Fit check? JiivaaKart check! 📸',
    message:
      'Insta story daalni hai? First pick: Men’s Grey Camo Lower + Adidas Graphic Tee combo. 10/10 fit check!',
    cta: 'Do Fit Check',
    url: '/p/men-s-grey-camo-print-relaxed-fit-track-lower',
    trigger: 'Weekend (11 AM)',
    tags: ['fit-check', 'camo-lower', 'adidas-tee'],
  },
  {
    id: '027',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Delulu is the solulu… especially for outfits 😭',
    message:
      'Dream aesthetic reality ban sakti hai. Boutique luxury ab pocket-friendly price par available hai!',
    cta: 'Find Your Look',
    url: '/shop',
    trigger: 'Midnight (11:30 PM)',
    tags: ['delulu', 'aesthetic'],
  },
  {
    id: '028',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'The outfit ate. No crumbs. 💅',
    message:
      'Straight-fit dark blue denim + structured white shirt = absolute slay. Dekho kaise lagta hai!',
    cta: 'Explore Fashion',
    url: '/p/diesel-men-s-dark-blue-straight-fit-denim-jeans',
    trigger: 'Evening (7 PM)',
    tags: ['ate-no-crumbs', 'slay', 'diesel-jeans'],
  },
  {
    id: '029',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Certified fashion explorer spotted 🕵️',
    message:
      'Tumhara taste elite hai! Dekho aaj JiivaaKart boutique radar par kaunse naye kapde drop huye hain.',
    cta: 'Explore Finds',
    url: '/shop',
    trigger: 'Browsing Trigger',
    tags: ['explorer', 'elite-taste'],
  },
  {
    id: '030',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Your sign to change that boring fit 🚨',
    message:
      'Yeh universe ka sign hai: Camo prints aur olive textures tumhari feed me feature hone ko ready hain.',
    cta: 'Upgrade My Fit',
    url: '/category/men',
    trigger: 'Lunch Break (1:30 PM)',
    tags: ['universe-sign', 'camo'],
  },
  {
    id: '031',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Bestie, wardrobe ko plot twist do 🎬',
    message:
      "Boring casuals se switch karke handcrafted textured shirts pe aao. Sab puchenge 'Kahan se liya?'",
    cta: 'Show Me More',
    url: '/p/men-s-olive-green-textured-casual-full-sleeve-shirt',
    trigger: 'Late Afternoon',
    tags: ['plot-twist', 'olive-shirt'],
  },
  {
    id: '032',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Low battery? High fashion energy 🔋✨',
    message: 'Phone chahe 5% ho, tumhara drip 100% hona chahiye. Rapid checkout ready hai!',
    cta: 'Recharge Style',
    url: '/shop',
    trigger: 'Evening (8 PM)',
    tags: ['drip', 'battery'],
  },
  {
    id: '033',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: "It's not a phase, it's a fashion era 😌",
    message: 'Fast-fashion chhod ke durable boutique craft apnao. Welcome to your JiivaaKart Era!',
    cta: 'Start My Era',
    url: '/shop',
    trigger: 'Weekend (12 PM)',
    tags: ['fashion-era', 'taylor-hook'],
  },
  {
    id: '034',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Ate breakfast? Now serve looks 🍳💅',
    message:
      'College aur cafe hangouts ke liye oversized comfort tees ready hain. Chalo looks serve karein!',
    cta: 'Serve Looks',
    url: '/p/men-s-black-oversized-graphic-print-cotton-t-shirt',
    trigger: 'Morning (10 AM)',
    tags: ['serve-looks', 'oversized-tee'],
  },
  {
    id: '035',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Main character ka outfit pending hai 👀',
    message:
      'Har film me hero ka entry fit iconic hota hai. Tumhara iconic fit JiivaaKart par wait kar raha hai.',
    cta: 'Find the Fit',
    url: '/shop',
    trigger: 'Friday (6 PM)',
    tags: ['hero-fit', 'main-character'],
  },
  {
    id: '036',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Moodboard se outfit tak ka safar? 📌',
    message:
      'Pinterest pe save karna band karo, JiivaaKart se direct apne wardrobe me deliver karvao!',
    cta: 'Get Inspired',
    url: '/shop',
    trigger: 'Sunday Evening',
    tags: ['pinterest', 'moodboard'],
  },
  {
    id: '037',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Slay karna hai, delay nahi 😎',
    message:
      'Best fits jaldi out of stock ho jaate hain. White & Blue Striped shirt checkout kar lo turant!',
    cta: 'Slay Now',
    url: '/p/men-s-white-blue-vertical-striped-full-sleeve-shirt',
    trigger: 'Flash Trigger',
    tags: ['slay', 'striped-shirt'],
  },
  {
    id: '038',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Not me thinking about outfits again 😭',
    message:
      'Hum sab relatable hain bestie! Thoda sa cart refresh kar lo, mood instantly fresh ho jaayega.',
    cta: "Let's Browse",
    url: '/cart',
    trigger: 'Night (10:30 PM)',
    tags: ['not-me', 'cart-nudge'],
  },
  {
    id: '039',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: 'Fit so good, even your camera says thanks 📸',
    message: 'Grey Abstract Printed Shirt pehno aur selfie game level up karo. No filter needed!',
    cta: 'Explore Picks',
    url: '/p/men-s-grey-abstract-printed-full-sleeve-casual-shirt',
    trigger: 'Day Out Trigger',
    tags: ['selfie', 'abstract-shirt'],
  },
  {
    id: '040',
    category: 'GENZ_MEME',
    categoryLabel: 'Gen-Z, Meme & Internet Energy',
    title: "It's giving shopping o'clock 🕒🛍️",
    message: 'Notification bell ring hui hai matlab JiivaaKart kholne ka perfect time aa gaya hai!',
    cta: 'Shop the Moment',
    url: '/shop',
    trigger: '8:00 PM Sharp',
    tags: ['shopping-oclock', 'evening-rush'],
  },

  // ==========================================
  // 👀 Section 3: Curiosity, Suspense & Click-Worthy (041 - 060)
  // ==========================================
  {
    id: '041',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Ek outfit tumhara wait kar raha hai… 👀',
    message: 'Kisi ne tumhare size aur style ke mutabiq yeh shirt shortlist ki hai. Guess kaunsi?',
    cta: 'Reveal My Style',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Personalized User Alert',
    tags: ['curiosity', 'maroon-shirt'],
  },
  {
    id: '042',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Wait… tumne ye collections dekhe? 😳',
    message:
      'Navya Collection boutique ki limited edition textured shirts live ho chuki hain. Jaldi check karo!',
    cta: 'Take a Look',
    url: '/shop',
    trigger: 'New Arrival Drop',
    tags: ['new-arrival', 'navya-collection'],
  },
  {
    id: '043',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Plot twist: tumhara next look yahin ho sakta hai 🎬',
    message:
      'Normal shopping apps se thak gaye? JiivaaKart ke unique boutique items me kuch alag discover karo.',
    cta: 'Reveal the Look',
    url: '/shop',
    trigger: 'Discovery Push',
    tags: ['plot-twist', 'discovery'],
  },
  {
    id: '044',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Aaj kuch alag dikhayein? 🤫',
    message:
      'Saste polyester nahi, pure breathable cotton shirts & relaxed denim. Bas ek baar fabric check karo!',
    cta: 'Show Me',
    url: '/category/men',
    trigger: 'Afternoon (2:30 PM)',
    tags: ['cotton', 'fabric-quality'],
  },
  {
    id: '045',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Guess what your wardrobe needs… 👀',
    message:
      'Ek classic White Textured Full Sleeve Shirt jo har jeans aur chinos pe zabardast jache. Dekho yahan!',
    cta: 'Find Out',
    url: '/p/men-s-white-textured-casual-full-sleeve-shirt',
    trigger: 'Smart Nudge',
    tags: ['white-shirt', 'versatile'],
  },
  {
    id: '046',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Ek chhota sa fashion secret 🤐',
    message:
      'Boutiques ka fashion luxury malls se 50% kam price pe mil sakta hai JiivaaKart par. Secret unbox karo!',
    cta: 'Reveal Secret',
    url: '/shop',
    trigger: 'Morning (11 AM)',
    tags: ['secret', 'value'],
  },
  {
    id: '047',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Scroll rokne wali baat hai… 🛑',
    message: 'Yeh Grey Camo Track Lower dekho—gym, airport ya lounge, har jagah comfortable swag!',
    cta: "See What's New",
    url: '/p/men-s-grey-camo-print-relaxed-fit-track-lower',
    trigger: 'Evening Browsing',
    tags: ['scroll-stopper', 'camo-lower'],
  },
  {
    id: '048',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Tumne abhi tak ye explore nahi kiya? 😮',
    message:
      'Diesel Dark Blue Straight Fit Denim sirf ₹699 me! Stock limited units me hi bacha hai.',
    cta: 'Explore It',
    url: '/p/diesel-men-s-dark-blue-straight-fit-denim-jeans',
    trigger: 'Low Stock / Trending',
    tags: ['diesel-jeans', 'low-stock'],
  },
  {
    id: '049',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Aaj ka surprise: tumhari choice ka fashion 🎁',
    message:
      'Humne aapke taste ke according boutique recommendations ready ki hain. Khilao apna stylish avatar!',
    cta: 'Unwrap Style',
    url: '/shop',
    trigger: 'VIP User Alert',
    tags: ['personalized', 'recommendation'],
  },
  {
    id: '050',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Psst… fashion update hai 🤫',
    message:
      'Fresh stock drop: Men’s Beige Textured Full Sleeve Shirt just arrived. Size M, L, XL available!',
    cta: 'Get the Update',
    url: '/p/men-s-beige-textured-full-sleeve-casual-shirt',
    trigger: 'Product Drop',
    tags: ['beige-shirt', 'sizes'],
  },
  {
    id: '051',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Ek click. Naye fashion options. ✨',
    message:
      'Bus ek tap aur seedha Hisar ke top verified boutiques ki curated gallery aapke phone screen par!',
    cta: 'Discover Now',
    url: '/shop',
    trigger: 'Evening (7 PM)',
    tags: ['one-click', 'hisar-boutique'],
  },
  {
    id: '052',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: "Your next 'where did you get this?' moment 👀",
    message:
      'Jab sab puchenge ki yeh Blue & White Checkered Shirt kahan se li, proudly bolna: JiivaaKart!',
    cta: 'Find That Look',
    url: '/p/men-s-premium-blue-white-checkered-casual-shirt',
    trigger: 'Weekend Prep',
    tags: ['checkered-shirt', 'compliment-magnet'],
  },
  {
    id: '053',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Kuch naya drop hua hai… 🔔',
    message:
      'Baby Boys Printed T-Shirt & Shorts sets sirf ₹150 se live ho gaye hain. Chhote bacchon ke cute fits!',
    cta: "See What's New",
    url: '/p/baby-boys-printed-t-shirt-shorts-set-1',
    trigger: 'Parents Alert',
    tags: ['kids', 'baby-boys', 'budget-150'],
  },
  {
    id: '054',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Curiosity ka jawab JiivaaKart par hai 🧐',
    message:
      'Daily routine fashion se hatke kuch authentic boutique taste chahiye? Ek click me discover karo.',
    cta: 'Find Out Now',
    url: '/shop',
    trigger: 'Mid-day',
    tags: ['curiosity', 'taste'],
  },
  {
    id: '055',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Aaj ka fashion mystery: your next favourite? 🔍',
    message:
      'Dark Wine Maroon ya Olive Green? Dono shirts trending list me top par hain. Vote karo apne style se!',
    cta: 'Solve It',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Interactive Push',
    tags: ['maroon-vs-olive', 'mystery'],
  },
  {
    id: '056',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Don’t open this… unless you love fashion 😏',
    message:
      'Mana kiya tha na? Ab open kar hi liya hai toh top curated boutique picks dekh ke hi jana!',
    cta: 'Open JiivaaKart',
    url: '/shop',
    trigger: 'Reverse Psychology',
    tags: ['dont-open', 'hook'],
  },
  {
    id: '057',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Ek look. Ek vibe. Full possibility. ✨',
    message:
      'Striped full-sleeve shirt casuals me bhi professional vibe deti hai. Dekho details yahan.',
    cta: 'Explore the Vibe',
    url: '/p/men-s-white-blue-vertical-striped-full-sleeve-shirt',
    trigger: 'Workwear Focus',
    tags: ['striped-shirt', 'workwear'],
  },
  {
    id: '058',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Tumhare taste ka kuch mil sakta hai… 👀',
    message:
      'Casual denim se lekar festive kurtis tak, JiivaaKart par har kisi ke liye ek special pick hai.',
    cta: 'Check It Out',
    url: '/shop',
    trigger: 'Re-engagement',
    tags: ['personalized', 'variety'],
  },
  {
    id: '059',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Fashion radar detected something 🔎',
    message:
      'Hamare algorithm ne aapke profile ke liye ek high-match fit dhoondha hai. Check it now!',
    cta: 'Scan Styles',
    url: '/shop',
    trigger: 'Algorithmic Nudge',
    tags: ['radar', 'recommendation'],
  },
  {
    id: '060',
    category: 'CURIOSITY_SUSPENSE',
    categoryLabel: 'Curiosity, Suspense & Click-Worthy',
    title: 'Secret nahi rakhenge… naye looks yahan hain 🤭',
    message:
      'Pure premium finish casual shirts ab ₹449-₹499 range me direct boutique se live hain!',
    cta: 'Show Me Looks',
    url: '/category/men',
    trigger: 'Price Drop Nudge',
    tags: ['direct-boutique', 'price-drop'],
  },

  // ==========================================
  // 🔥 Section 4: Playful Roast & Savage (Friendly) (061 - 080)
  // ==========================================
  {
    id: '061',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Outfit repeat karne ka world record todna hai? 😂',
    message: 'Dost pehchan gaye hain bhai! Kam se kam ek fresh Wine Maroon Shirt toh le lo!',
    cta: 'Break Record',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Friendly Roast (11 AM)',
    tags: ['repeat-outfit', 'maroon-shirt'],
  },
  {
    id: '062',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: "Wardrobe ko 'seen' pe mat chhodo 😭",
    message:
      'Bechara roz wahi 2 t-shirts dekh ke ro raha hai. Usko thoda Black Oversized Graphic style dikhao!',
    cta: 'Refresh It',
    url: '/p/men-s-black-oversized-graphic-print-cotton-t-shirt',
    trigger: 'Weekend Roast',
    tags: ['seen', 'oversized-tee'],
  },
  {
    id: '063',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Tumhara style potential abhi pending hai 😏',
    message:
      '100% potential unlock karo! JiivaaKart ke structured shirts aur clean straight denim try karo.',
    cta: 'Unlock Style',
    url: '/shop',
    trigger: 'Morning Inspiration',
    tags: ['potential', 'denim'],
  },
  {
    id: '064',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Fashion police nahi, fashion bestie bol raha hai 🚨',
    message:
      'Ab wo college wale ghise huye lowers replace karne ka time aa gaya hai. Grey Camo Lower dekho!',
    cta: 'Browse Now',
    url: '/p/men-s-grey-camo-print-relaxed-fit-track-lower',
    trigger: 'Afternoon Casual',
    tags: ['fashion-police', 'camo-lower'],
  },
  {
    id: '065',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Itna bhi kya sochna? Bas styles dekh lo 😂',
    message:
      'Decision lene me itna time toh Rishte wale bhi nahi lagate! Check out new arrivals in 30 seconds.',
    cta: 'Take a Look',
    url: '/shop',
    trigger: 'Quick Browse',
    tags: ['rishte-joke', 'quick-browse'],
  },
  {
    id: '066',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Same outfit? Bold choice, bestie 💀',
    message:
      'Third time same week me wahi look? Ek Olive Green Textured Shirt add kar lo, reputation bach jayegi!',
    cta: 'Try Something New',
    url: '/p/men-s-olive-green-textured-casual-full-sleeve-shirt',
    trigger: 'Weekday Nudge',
    tags: ['same-outfit', 'olive-shirt'],
  },
  {
    id: '067',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Wardrobe ka budget meeting kab hai? 🧾😂',
    message:
      'Meeting pass ho gayi! JiivaaKart boutique fits me quality premium hai par bill pocket-friendly hai.',
    cta: 'Explore Options',
    url: '/shop',
    trigger: 'Mid-Month Budget',
    tags: ['budget', 'meeting'],
  },
  {
    id: '068',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: "Tumhara 'kal dekhunga' aaj aa gaya 😜",
    message:
      "'Kal order karunga' bolte-bolte size out of stock ho jayega! Aaj hi apni favourite shirt lock karo.",
    cta: 'Shop Today',
    url: '/category/men',
    trigger: 'Cart Delay Alert',
    tags: ['procrastination', 'urgency'],
  },
  {
    id: '069',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Fashion ko ignore karna bhi koi talent hai 😭',
    message:
      'Talent accha hai par stylish lagna usse zyada accha hai. Check out trending boutique shirts under ₹599.',
    cta: 'Give It a Look',
    url: '/shop',
    trigger: 'Re-engagement',
    tags: ['talent', 'under-599'],
  },
  {
    id: '070',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Outfit crisis? Again? 🤦',
    message:
      'Sunday night panic mat karo! Monday office ke liye Beige & White formal textured shirts ready rakho.',
    cta: 'End the Crisis',
    url: '/p/men-s-beige-textured-full-sleeve-casual-shirt',
    trigger: 'Sunday 8 PM',
    tags: ['sunday-panic', 'office-prep'],
  },
  {
    id: '071',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Mirror ne complaint file ki hai 🪞😂',
    message:
      "Bol raha hai: 'Naye kapde kab pehnega?' Naye boutique drops ke saath mirror se settlement kar lo!",
    cta: 'Fix My Look',
    url: '/shop',
    trigger: 'Morning (8:30 AM)',
    tags: ['mirror', 'complaint'],
  },
  {
    id: '072',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Style ko airplane mode se hatao ✈️',
    message:
      'Offline fashion chhod kar JiivaaKart live boutique collection pe aao. Fresh trends deliver ho rahe hain!',
    cta: 'Go Online',
    url: '/shop',
    trigger: 'Lunch Hours',
    tags: ['airplane-mode', 'online'],
  },
  {
    id: '073',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Tumhara fashion game update maang raha hai 🎮',
    message:
      'Patch update available: Straight fit Diesel blue denim + Adidas graphic tee combo. Install now!',
    cta: 'Update My Style',
    url: '/p/diesel-men-s-dark-blue-straight-fit-denim-jeans',
    trigger: 'Gaming / Gen-Z Hook',
    tags: ['game-update', 'patch', 'diesel-jeans'],
  },
  {
    id: '074',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Cart khali, dreams heavy? 😂',
    message:
      'Sapne dekhne se wardrobe nahi bharta boss! Cart me items add karo aur style ko reality banao.',
    cta: 'Start Browsing',
    url: '/cart',
    trigger: 'Empty Cart Alert',
    tags: ['empty-cart', 'dreams'],
  },
  {
    id: '075',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Fashion goals sirf screenshots mein kyun? 👀',
    message:
      'Gallery me saved kapde pehne nahi jaate! Real handcrafted boutique fits JiivaaKart se order karo.',
    cta: 'Make It Real',
    url: '/shop',
    trigger: 'Evening Browsing',
    tags: ['screenshots', 'real-fashion'],
  },
  {
    id: '076',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: "Aaj bhi 'kuch nahi chahiye'? Sure? 🤨",
    message:
      "Ek baar Premium Blue & White Checkered shirt dekh lo, fir bol ke dikhana 'kuch nahi chahiye'!",
    cta: 'Prove It',
    url: '/p/men-s-premium-blue-white-checkered-casual-shirt',
    trigger: 'Challenge Nudge',
    tags: ['checkered-shirt', 'challenge'],
  },
  {
    id: '077',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Outfit planning: 0%. Panic: 100%. 😭',
    message:
      'Shaadi ya party me kya pehnenge? Tension mat lo, JiivaaKart ke curated occasionwear looks dekh lo.',
    cta: 'Plan My Outfit',
    url: '/shop',
    trigger: 'Thursday Evening',
    tags: ['panic', 'planning'],
  },
  {
    id: '078',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Style ka software update available hai 🔄',
    message:
      'Bug fixes: purane boring kapde. New features: fresh textured fits & breathable luxury cotton!',
    cta: 'Update Now',
    url: '/shop',
    trigger: 'System-Style Humor',
    tags: ['software-update', 'cotton'],
  },
  {
    id: '079',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Fashion ko kal pe mat daalo, bestie 😌',
    message:
      'Zindagi choti hai aur acche kapde pehanna zaroori hai. Browse the newest JiivaaKart boutique catalog.',
    cta: 'Explore Today',
    url: '/shop',
    trigger: 'Motivational Poke',
    tags: ['motivation', 'bestie'],
  },
  {
    id: '080',
    category: 'PLAYFUL_ROAST',
    categoryLabel: 'Playful Roast & Savage (Friendly)',
    title: 'Roast khatam. Ab shopping shuru? 😜',
    message:
      'Mazak apni jagah, par stylish lagna personal choice hai! Discover your signature look on JiivaaKart.',
    cta: "Let's Shop",
    url: '/shop',
    trigger: 'Post-Roast Warmup',
    tags: ['warmup', 'signature-look'],
  },

  // ==========================================
  // 🛍️ Section 5: Cart, Wishlist & Browsing Nudges (081 - 100)
  // ==========================================
  {
    id: '081',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Tumhara cart tumhe yaad kar raha hai 🥺',
    message:
      '{customer_name}, aapka pasandeeda outfit cart me akele baitha hai. Complete your order before stock ends!',
    cta: 'Return to Cart',
    url: '/cart',
    trigger: 'Abandoned Cart (1 Hr)',
    tags: ['abandoned-cart', 'cart-1h'],
  },
  {
    id: '082',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Cart mein plot twist pending hai 👀',
    message:
      'Aapke cart items par Jiivaa Coins apply karke extra discount mil sakta hai. Check final price now!',
    cta: 'View Cart',
    url: '/cart',
    trigger: 'Abandoned Cart (3 Hrs)',
    tags: ['coins-discount', 'cart-3h'],
  },
  {
    id: '083',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Woh outfit abhi bhi dimaag mein hai na? 😏',
    message:
      'Recently viewed: Men’s Wine Maroon Textured Shirt. Sirf kuch hi pieces bache hain aapke size me!',
    cta: 'View Item',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Recently Viewed (2 Hrs)',
    tags: ['recently-viewed', 'maroon-shirt'],
  },
  {
    id: '084',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Wishlist = crush list? ❤️😂',
    message:
      'Crush ko sirf door se dekhte rahoge ya ghar bulaoge? Move your saved wishlist items to cart today!',
    cta: 'Open Wishlist',
    url: '/cart',
    trigger: 'Wishlist Reminder (2 Days)',
    tags: ['wishlist', 'crush'],
  },
  {
    id: '085',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Commitment issues? Cart samajhta hai 😭',
    message:
      'Koi pressure nahi, but Diesel Straight Fit Jeans fast selling out hai. Ek baar delivery details confirm karo!',
    cta: 'Continue Checkout',
    url: '/cart',
    trigger: 'Abandoned Cart (6 Hrs)',
    tags: ['diesel-jeans', 'cart-6h'],
  },
  {
    id: '086',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Tumne pasand kiya, humne yaad rakha 🫶',
    message:
      'Aapke curated choices saved hain. Instant checkout karein aur boutique styling ghar mangwayein.',
    cta: 'View Saved Items',
    url: '/cart',
    trigger: 'Saved Items Nudge',
    tags: ['saved-items', 'retention'],
  },
  {
    id: '087',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Cart ka reunion kara dein? 🥹',
    message:
      'Items wait kar rahe hain aur Jiivaa Coins bhi ready hain. Bag open karo aur tap karke order finish karo!',
    cta: 'Reunite with Cart',
    url: '/cart',
    trigger: 'Abandoned Cart (12 Hrs)',
    tags: ['reunion', 'cart-12h'],
  },
  {
    id: '088',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Wishlist mein butterflies ho rahi hain 🦋',
    message:
      'Jo kapde aapne save kiye the, unki stock updates live hain. Ek click me unhe apna bana lo!',
    cta: 'Visit Wishlist',
    url: '/cart',
    trigger: 'Wishlist Activity',
    tags: ['wishlist', 'butterflies'],
  },
  {
    id: '089',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Bas dekh ke chale gaye? 👀',
    message:
      'Grey Printed Shirt aur Camo Lower aapki history me hain. Size check karo aur bag me lock karo!',
    cta: 'Continue Browsing',
    url: '/p/men-s-grey-printed-full-sleeve-casual-shirt',
    trigger: 'Drop-off Re-engagement',
    tags: ['drop-off', 'grey-shirt'],
  },
  {
    id: '090',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Your cart called. It wants closure 📞',
    message:
      'Order complete karo ya confirm karo. Free delivery aur instant dispatch slot abhi open hai!',
    cta: 'Open Cart',
    url: '/cart',
    trigger: 'Abandoned Cart (24 Hrs)',
    tags: ['closure', 'cart-24h'],
  },
  {
    id: '091',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Favourite pick ko phir se hello bolo 👋',
    message:
      'Aapka favourite Olive Green Textured fit cart me ready hai. Bas delivery address select karke confirm karo.',
    cta: 'See Favourites',
    url: '/cart',
    trigger: 'Product-Specific Cart Alert',
    tags: ['olive-shirt', 'cart-specific'],
  },
  {
    id: '092',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Shopping story ka next episode pending 🎬',
    message:
      "Agla episode: 'Order Confirmed & Out for Delivery!' Complete checkout on JiivaaKart right now.",
    cta: 'Continue Story',
    url: '/cart',
    trigger: 'Story Hook Nudge',
    tags: ['story', 'checkout'],
  },
  {
    id: '093',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Cart mein kya chal raha hai? 🕵️',
    message:
      'Price check: Aapke shortlisted items ki price update hui hai. Verify your total savings in cart!',
    cta: 'Check My Cart',
    url: '/cart',
    trigger: 'Price Verification Nudge',
    tags: ['price-check', 'savings'],
  },
  {
    id: '094',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Wishlist ko dust mat collect karne do 😂',
    message:
      'Saved items purane hone se pehle unhe flaunt karo. Move them to cart with just one tap.',
    cta: 'Open Wishlist',
    url: '/cart',
    trigger: 'Periodic Wishlist Sweep',
    tags: ['dust', 'wishlist-sweep'],
  },
  {
    id: '095',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Ek click door hai tumhari shopping journey 🛍️',
    message:
      'Bas Razorpay ya COD select karo aur stylish handcrafted outfit aapke door par hoga in 3-4 days!',
    cta: 'Continue Shopping',
    url: '/cart',
    trigger: 'Checkout Step 2 Drop-off',
    tags: ['cod', 'razorpay', 'fast-delivery'],
  },
  {
    id: '096',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Screenshot nahi, shopping bhi 😉',
    message:
      'Saved screenshot se accha hai real mirror me fit check karna! Checkout your selected pieces today.',
    cta: 'View Selection',
    url: '/cart',
    trigger: 'Screenshot/Cart Hook',
    tags: ['screenshots', 'real-cart'],
  },
  {
    id: '097',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Cart ko happy ending chahiye 🥹',
    message:
      "'Delivered to your doorstep' is the only happy ending we support! Complete checkout now.",
    cta: 'Checkout Now',
    url: '/cart',
    trigger: 'Urgency Cart Alert',
    tags: ['happy-ending', 'delivery'],
  },
  {
    id: '098',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Saved styles ka roll call! 📋',
    message:
      'Present sir! Black Oversized Tee, Straight Jeans aur Striped Shirts sab bag me ready hain. Pack them up!',
    cta: 'See My List',
    url: '/cart',
    trigger: 'Cart Inventory Sweep',
    tags: ['roll-call', 'cart-summary'],
  },
  {
    id: '099',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Browsing partner missing: YOU 😜',
    message:
      'JiivaaKart boutique aisles sunsaan lag rahe hain bina aapke. Wapas aao aur fresh catalogue check karo!',
    cta: 'Come Back',
    url: '/shop',
    trigger: 'Inactive User (4 Days)',
    tags: ['comeback', 'partner'],
  },
  {
    id: '100',
    category: 'CART_WISHLIST',
    categoryLabel: 'Cart, Wishlist & Browsing Nudges',
    title: 'Cart check kar lo, bestie 🫶',
    message:
      'Humne aapka bag hold kiya hua hai, par boutique pieces fast move ho rahe hain. Finalize it today!',
    cta: 'Review Cart',
    url: '/cart',
    trigger: 'Final Cart Expiry Nudge',
    tags: ['hold-cart', 'urgency'],
  },

  // ==========================================
  // 👗 Section 6: Men, Women & Kids Fashion Fun (101 - 120)
  // ==========================================
  {
    id: '101',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Bhai, shirt collection ko upgrade karna hai? 😎',
    message:
      'Wine Maroon, Olive Green aur Crisp White textured shirts under ₹499! Perfect for office & weekend.',
    cta: 'Shop Men',
    url: '/category/men',
    trigger: "Men's Category Focus",
    tags: ['men', 'shirts', 'under-499'],
  },
  {
    id: '102',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Jeans ka rishta purana ho gaya? 😂',
    message:
      'Tight uncomfortable jeans ko bolo bye! Diesel Straight Fit aur Relaxed Printed Denims dekho abhi.',
    cta: 'Explore Denim',
    url: '/p/diesel-men-s-dark-blue-straight-fit-denim-jeans',
    trigger: 'Bottomwear Campaign',
    tags: ['diesel-jeans', 'denim'],
  },
  {
    id: '103',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Formal look, informal confidence 😉',
    message:
      'Button-down textured full sleeve shirts: Office me formal aur shaam ke hangout me smart casual!',
    cta: 'Shop Formal',
    url: '/p/men-s-beige-textured-full-sleeve-casual-shirt',
    trigger: 'Weekday Morning (8:30 AM)',
    tags: ['formal', 'beige-shirt'],
  },
  {
    id: '104',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'T-shirt squad, attendance lagao! 👕',
    message:
      'Adidas Blue Graphic Tee aur Black Oversized Streetwear T-shirts live hain. Pure cotton, zero sweat!',
    cta: 'Shop T-Shirts',
    url: '/p/adidas-blue-graphic-white-t-shirt',
    trigger: 'Casual Weekend Nudge',
    tags: ['tshirts', 'adidas-tee'],
  },
  {
    id: '105',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Bestie, ethnic look loading? ✨',
    message:
      'Handcrafted boutique kurtis, anarkali sets aur designer lehengas Navya Collection par live hain.',
    cta: 'Shop Ethnic',
    url: '/category/women',
    trigger: "Women's Ethnic Alert",
    tags: ['women', 'ethnic', 'kurtis'],
  },
  {
    id: '106',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Aaj ka fit check kis ke naam? 💅',
    message:
      'Women’s ethnic wear aur boutique exclusives: Dupattas, partywear kurtis aur elegant festive suits.',
    cta: 'Shop Women',
    url: '/category/women',
    trigger: "Women's Fashion Push",
    tags: ['women', 'festive-suits'],
  },
  {
    id: '107',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Kurti lovers, idhar dekho! 🫶',
    message:
      'Everyday comfortable cotton kurtis aur festive silk designs direct boutique weavers se available hain.',
    cta: 'Shop Kurtis',
    url: '/category/women',
    trigger: 'Kurti Focus Alert',
    tags: ['kurtis', 'cotton-kurtis'],
  },
  {
    id: '108',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Glam mode: activated ✨',
    message:
      'Shaadi attend karni hai ya family celebration? Check out Navya Collection bridal & partywear edit.',
    cta: 'Explore Dresses',
    url: '/category/women',
    trigger: 'Evening Festive',
    tags: ['glam', 'bridal', 'partywear'],
  },
  {
    id: '109',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Wardrobe ko thoda main-character banao 👑',
    message:
      'Elegant draping, handcrafted borders aur rich Indian fabrics. Elevate your everyday grace today!',
    cta: 'Explore Women',
    url: '/category/women',
    trigger: 'Saturday Afternoon',
    tags: ['main-character', 'draping'],
  },
  {
    id: '110',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Little humans, big fashion energy 🧸',
    message:
      'Baby Boys Printed T-Shirt & Shorts Sets sirf ₹150 me! Super soft, breathable fabric for babies.',
    cta: 'Shop Kids',
    url: '/p/baby-boys-printed-t-shirt-shorts-set-1',
    trigger: 'Kids Category Alert',
    tags: ['kids', 'baby-boy', 'soft-cotton'],
  },
  {
    id: '111',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Mini fashion show ghar par? 😂',
    message: 'Little ones ke liye adorable outfits explore karo. Cute looks guaranteed!',
    cta: 'Explore Kidswear',
    url: '/p/baby-boys-printed-t-shirt-shorts-set-1',
    trigger: 'Morning Family Nudge',
    tags: ['mini-fashion-show', 'kids'],
  },
  {
    id: '112',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Tiny boss ka outfit ready hai? 😎',
    message:
      'Bacchon ke comfortable daily wear sets jo wash karne par bhi soft rahein. Check out kids collection!',
    cta: 'Find Kids Looks',
    url: '/category/kids',
    trigger: 'Afternoon Parents Push',
    tags: ['tiny-boss', 'kidswear'],
  },
  {
    id: '113',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Parents, cute alert! 🚨',
    message:
      'Baby boy printed co-ords at just ₹150! Unbeatable budget find, perfect for gifts aur daily playtime.',
    cta: 'Shop Kids',
    url: '/p/baby-boys-printed-t-shirt-shorts-set-1',
    trigger: 'Budget Alert',
    tags: ['parents-alert', 'budget-150'],
  },
  {
    id: '114',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Family photo ka outfit plan sorted? 📸',
    message:
      'Papa ke liye textured shirt, mummy ke liye ethnic kurti aur baby boy ke liye cute shorts set!',
    cta: 'Shop Family Looks',
    url: '/shop',
    trigger: 'Sunday Morning Photo Prep',
    tags: ['family-photo', 'coordinated'],
  },
  {
    id: '115',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Papa ka style, little champ ka swag 😄',
    message:
      'Matching family styles JiivaaKart par ek hi checkout me mangwayein. Check family fashion collections!',
    cta: 'Explore All',
    url: '/shop',
    trigger: 'Weekend Family Shopping',
    tags: ['papa-champ', 'family'],
  },
  {
    id: '116',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Date night ka dress code? ❤️',
    message:
      'Men: Wine Maroon Textured Shirt. Women: Classic red ethnic suit. Match the romantic vibe perfectly!',
    cta: 'Find an Outfit',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Friday 5 PM',
    tags: ['date-night', 'maroon-shirt'],
  },
  {
    id: '117',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'College fit ko attendance milni chahiye 🎒',
    message:
      'Grey Camo Lower + Black Oversized Graphic Tee = Campus style icon! Check out college budget fits.',
    cta: 'Shop Casuals',
    url: '/p/men-s-black-oversized-graphic-print-cotton-t-shirt',
    trigger: 'Back-to-Campus Focus',
    tags: ['college-fit', 'oversized-tee', 'camo'],
  },
  {
    id: '118',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Wedding invite aaya? Outfit bhi bulao 💌',
    message:
      'Kurta pajamas, sherwanis aur regal silk sarees curated hain aapke celebrations ke liye.',
    cta: 'Explore Occasion',
    url: '/category/women',
    trigger: 'Wedding Season Nudge',
    tags: ['wedding', 'occasionwear'],
  },
  {
    id: '119',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Weekend ka plan: look good, feel good 😌',
    message:
      'Weekend brunch aur road trips ke liye comfortable White & Blue Striped casual shirt choose karo.',
    cta: 'Shop Weekend',
    url: '/p/men-s-white-blue-vertical-striped-full-sleeve-shirt',
    trigger: 'Friday Afternoon',
    tags: ['weekend-look', 'striped-shirt'],
  },
  {
    id: '120',
    category: 'FASHION_SEGMENTS',
    categoryLabel: 'Men, Women & Kids Fashion Fun',
    title: 'Har age ka apna swag 😎',
    message:
      'Chhote bacchon se lekar elders tak, JiivaaKart multi-generational boutique fashion celebrate karta hai.',
    cta: 'Explore All',
    url: '/shop',
    trigger: 'Brand Storytelling Push',
    tags: ['all-ages', 'swag'],
  },

  // ==========================================
  // 🏬 Section 7: Boutique Discovery & JiivaaKart Uniqueness (121 - 140)
  // ==========================================
  {
    id: '121',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Big brands ke beech, boutique wala twist 😉',
    message:
      'Mall me sab ek jaisa pehente hain. JiivaaKart par local boutique ka unique handcrafted touch milta hai!',
    cta: 'Explore Boutiques',
    url: '/shop',
    trigger: 'Marketplace Positioning',
    tags: ['boutique-twist', 'unique-craft'],
  },
  {
    id: '122',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Same-same se bore? Same here 😜',
    message:
      'Mass-manufactured prints chhodkar Hisar ke authentic verified boutiques ke curated pieces dekho.',
    cta: 'Find Unique Styles',
    url: '/shop',
    trigger: 'Discovery Alert',
    tags: ['same-same-bore', 'hisar-boutiques'],
  },
  {
    id: '123',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Har boutique ki apni kahaani 🧵',
    message:
      'Navya Collection flagship store se lekar verified artisans tak, har silai me craftsmanship hai.',
    cta: 'Meet Boutiques',
    url: '/shop',
    trigger: 'Heritage / Craft Push',
    tags: ['artisan', 'craftsmanship'],
  },
  {
    id: '124',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Local style, fresh discovery ❤️',
    message:
      'Bharat ke real boutique fashion ko support karo aur apne doorstep par high-end finish enjoy karo!',
    cta: 'Discover Local',
    url: '/shop',
    trigger: 'Vocal for Local Focus',
    tags: ['vocal-for-local', 'local-boutique'],
  },
  {
    id: '125',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Copy-paste fashion ko bye bolo 👋',
    message:
      'Party me koi doosra aapke jaisa outfit nahi pehne hoga! That is the JiivaaKart boutique promise.',
    cta: 'Explore Unique',
    url: '/shop',
    trigger: 'Differentiation Hook',
    tags: ['copy-paste-bye', 'unique-promise'],
  },
  {
    id: '126',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Tumhara style, boutique ka magic ✨',
    message:
      'Tailored feel aur rich textures jo normal retail me nahi milte. Wine Maroon & Olive shirts check karo!',
    cta: 'Explore Collections',
    url: '/category/men',
    trigger: 'Product Craft Nudge',
    tags: ['tailored', 'textures'],
  },
  {
    id: '127',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Fashion treasure hunt shuru! 🗺️',
    message:
      'JiivaaKart par hidden fashion gems dhoondo: Budget shirts ₹449 se aur cute kids sets ₹150 se!',
    cta: 'Start the Hunt',
    url: '/shop',
    trigger: 'Gamified Push',
    tags: ['treasure-hunt', 'budget-gems'],
  },
  {
    id: '128',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Ek marketplace, alag-alag style stories 🛍️',
    message:
      'Har boutique seller apni best designs showcase kar raha hai. Check verified boutique ratings!',
    cta: 'Browse Boutiques',
    url: '/shop',
    trigger: 'Social Proof Push',
    tags: ['marketplace', 'ratings'],
  },
  {
    id: '129',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Local boutiques deserve a spotlight 🌟',
    message:
      'Local sellers se direct khareedo, middleman commission bachaao aur superior fabric enjoy karo.',
    cta: 'Discover Sellers',
    url: '/shop',
    trigger: 'Fair Commerce Alert',
    tags: ['direct-seller', 'fair-price'],
  },
  {
    id: '130',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Boring scroll ko boutique stroll banao 😄',
    message: 'Sofa pe baithe-baithe pura boutique market explore karo bina dhoop aur traffic ke!',
    cta: 'Take a Stroll',
    url: '/shop',
    trigger: 'Sunday Leisure Browsing',
    tags: ['stroll', 'comfort-shopping'],
  },
  {
    id: '131',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Har look mass-produced feel ka nahi 😉',
    message:
      'Premium Blue & White Checkered Shirt me jo weave density hai, wo standard fast-fashion me nahi milti.',
    cta: 'Find Your Style',
    url: '/p/men-s-premium-blue-white-checkered-casual-shirt',
    trigger: 'Quality Focus Alert',
    tags: ['weave-density', 'checkered-shirt'],
  },
  {
    id: '132',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Your next hidden gem might be local 💎',
    message:
      'Diesel Straight Fit Denim under ₹699—local boutique sourcing ka direct benefit customer ko!',
    cta: 'Find Hidden Gems',
    url: '/p/diesel-men-s-dark-blue-straight-fit-denim-jeans',
    trigger: 'Value Proposition',
    tags: ['hidden-gem', 'diesel-jeans'],
  },
  {
    id: '133',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Boutique hopping, sofa se hi? 🛋️',
    message:
      'Chai piyo aur phone screen par boutique ke best rack browse karo. JiivaaKart delivers pan-India!',
    cta: 'Start Exploring',
    url: '/shop',
    trigger: 'Evening Relax Hours',
    tags: ['boutique-hopping', 'pan-india'],
  },
  {
    id: '134',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Style ki duniya, ek se zyada stories 📖',
    message:
      'Traditional handlooms se modern streetwear lowers tak, discover diverse fashion under one roof.',
    cta: 'Read the Style',
    url: '/shop',
    trigger: 'Broad Catalog Alert',
    tags: ['handloom', 'streetwear'],
  },
  {
    id: '135',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Aaj kuch hatke pehenne ka mood? 😏',
    message:
      'Grey Abstract Printed Casual Shirt dekho—standout graphic prints designed for bold personalities!',
    cta: 'Shop Different',
    url: '/p/men-s-grey-abstract-printed-full-sleeve-casual-shirt',
    trigger: 'Bold Style Nudge',
    tags: ['abstract-shirt', 'bold'],
  },
  {
    id: '136',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'JiivaaKart ka funda: style sabka, choice tumhari 🫶',
    message:
      'Hamare paas har budget aur har occasion ke verified kapde hain. Apna favourite filter karo!',
    cta: 'Explore Now',
    url: '/shop',
    trigger: 'Brand Tagline Campaign',
    tags: ['tagline', 'funda'],
  },
  {
    id: '137',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Local sellers, naye fashion discoveries 🇮🇳',
    message:
      'Direct from Hisar’s iconic fashion hub. Pure trust, verified pickup, aur seamless delivery!',
    cta: 'Support & Shop',
    url: '/shop',
    trigger: 'Trust & Origin Push',
    tags: ['hisar', 'trust'],
  },
  {
    id: '138',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Fashion ka treasure map mil gaya 🧭',
    message:
      'Skip the generic apps. Real boutique fashion is exclusively cataloged right here on JiivaaKart.',
    cta: 'Explore the Map',
    url: '/shop',
    trigger: 'Competitive Alternative',
    tags: ['treasure-map', 'exclusive'],
  },
  {
    id: '139',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Har scroll par ek nayi style story ✨',
    message:
      'Har product card me transparent fabric aur detail specs hain. Shop with 100% confidence!',
    cta: 'See Collections',
    url: '/shop',
    trigger: 'Buyer Trust Focus',
    tags: ['transparency', 'specs'],
  },
  {
    id: '140',
    category: 'BOUTIQUE_DISCOVERY',
    categoryLabel: 'Boutique Discovery & JiivaaKart Uniqueness',
    title: 'Trend se aage, apni choice ke saath 😎',
    message:
      'Trends aate jaate hain, timeless boutique textures hamesha fresh rehte hain. Discover yours!',
    cta: 'Find Your Vibe',
    url: '/shop',
    trigger: 'Timeless Style Hook',
    tags: ['timeless', 'textures'],
  },

  // ==========================================
  // 🎉 Section 8: Offers, Deals & Campaign Humour (141 - 160)
  // ==========================================
  {
    id: '141',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Discount dekhkar dil garden-garden? 🌸',
    message:
      'Flat ₹50 OFF referral credit aur 100 Jiivaa Coins passbook me claim karne ke liye available hain!',
    cta: 'View Offers',
    url: '/account/rewards',
    trigger: 'Loyalty Offer Push',
    tags: ['rewards', 'coins', 'referral-discount'],
  },
  {
    id: '142',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: "Wallet ne kaha: 'Thank you!' 😂",
    message:
      'Premium cotton shirts sirf ₹449-₹499 me milengi toh wallet bhi khushi se jhoom uthega!',
    cta: 'Shop Smart',
    url: '/category/men',
    trigger: 'Value Deals Nudge',
    tags: ['wallet-thankyou', 'under-500'],
  },
  {
    id: '143',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Deal alert! Excitement control karo 🚨',
    message:
      'Baby boy printed sets starting at just ₹150! Unbeatable everyday price without quality compromise.',
    cta: 'Explore Deals',
    url: '/p/baby-boys-printed-t-shirt-shorts-set-1',
    trigger: 'Flash Deal Alert',
    tags: ['deal-alert', 'baby-boys'],
  },
  {
    id: '144',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Price check karna banta hai boss 😎',
    message:
      'Men’s textured casual shirts compare karo kisi bhi high-end brand se—JiivaaKart delivers at 1/3rd price!',
    cta: 'Check Prices',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Comparison Hook',
    tags: ['price-check', 'maroon-shirt'],
  },
  {
    id: '145',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Shopping ka happy dance ready? 💃',
    message:
      'Jab ₹599 me Grey Camo Lower aur ₹499 me graphic tees milein, toh cart checkout banta hai!',
    cta: 'See Deals',
    url: '/p/men-s-grey-camo-print-relaxed-fit-track-lower',
    trigger: 'Joyful Trigger',
    tags: ['happy-dance', 'camo-lower'],
  },
  {
    id: '146',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Offer mila toh batana… pehle khud dekh lo 🤭',
    message:
      'Friend ko invite karo aur flat ₹50 (500 Coins) dono paao! Pehle apna VIP referral link grab karo.',
    cta: 'View Promotions',
    url: '/referral',
    trigger: 'Refer & Earn Hook',
    tags: ['referral', 'invite-friends'],
  },
  {
    id: '147',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Budget bhi khush, style bhi khush? 🥹',
    message:
      'No compromise shopping: High-grade cotton fabrics, rich colors, and guaranteed boutique finishing.',
    cta: 'Shop Fashion',
    url: '/shop',
    trigger: 'High Quality Low Price',
    tags: ['quality', 'finishing'],
  },
  {
    id: '148',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Aaj savings ka mood hai? 💸',
    message:
      'Jiivaa Coins use karke apne order par extra discounts unlock karo. Check your coin balance now!',
    cta: 'Find Deals',
    url: '/account/rewards',
    trigger: 'Coin Balance Alert',
    tags: ['coins', 'savings'],
  },
  {
    id: '149',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Deal hunting: tum vs internet 🕵️',
    message:
      'Search over! Top casual men’s shirts under ₹500 curated in one dedicated collection on JiivaaKart.',
    cta: 'Start Hunting',
    url: '/category/men',
    trigger: 'Deal Hunt Trigger',
    tags: ['deal-hunt', 'under-500'],
  },
  {
    id: '150',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Cart ko good news sunani hai 🎁',
    message:
      'Add items worth ₹499+ and unlock special rewards perks on your delivery! Check your cart now.',
    cta: 'Check Offers',
    url: '/cart',
    trigger: 'Cart Threshold Incentive',
    tags: ['cart-perks', 'threshold-499'],
  },
  {
    id: '151',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Fashion chahiye, budget ka heartbreak nahi 😭',
    message: 'Diesel straight fit dark denim at ₹699 won’t break your bank. Limited stock alert!',
    cta: 'Shop Smart',
    url: '/p/diesel-men-s-dark-blue-straight-fit-denim-jeans',
    trigger: 'Budget Reassurance',
    tags: ['diesel-jeans', 'no-heartbreak'],
  },
  {
    id: '152',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Offer ka FOMO? Pehle details check karo 👀',
    message:
      'Transparent pricing: No hidden platform fees, no fake markups. Direct boutique value.',
    cta: 'See Offer',
    url: '/shop',
    trigger: 'Honesty & Transparency',
    tags: ['fomo', 'transparency'],
  },
  {
    id: '153',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Aaj ka mission: smart shopping 🧠🛍️',
    message:
      '2 items combo: Striped Shirt (₹499) + Diesel Jeans (₹699) = Full designer look under ₹1200!',
    cta: 'Start Mission',
    url: '/p/men-s-white-blue-vertical-striped-full-sleeve-shirt',
    trigger: 'Combo Bundle Nudge',
    tags: ['smart-combo', 'under-1200'],
  },
  {
    id: '154',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Savings ko bhi style pasand hai 😉',
    message:
      'Style that speaks, price that saves! Explore JiivaaKart trending budget-friendly collections.',
    cta: 'Explore Now',
    url: '/shop',
    trigger: 'Tagline Offer Push',
    tags: ['savings', 'tagline'],
  },
  {
    id: '155',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Deal milne par jo smile aati hai… 😁',
    message: 'Wo smile deliver hoti hai har parcel ke saath. Order your favorite look today!',
    cta: 'Find My Deal',
    url: '/shop',
    trigger: 'Customer Delight Focus',
    tags: ['smile', 'delight'],
  },
  {
    id: '156',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Shopping maths: style + smart choice = 😍',
    message:
      '100 Signup Coins + ₹50 Referral bonus = instant checkout savings on your very first order!',
    cta: 'Compare & Shop',
    url: '/referral',
    trigger: 'Value Math Hook',
    tags: ['shopping-math', 'signup-coins'],
  },
  {
    id: '157',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Wallet-friendly finds incoming? 👀',
    message:
      'White Textured Shirt at ₹449! Clean white classic fit designed for office and evenings.',
    cta: 'Browse Deals',
    url: '/p/men-s-white-textured-casual-full-sleeve-shirt',
    trigger: 'Item Price Spotlight',
    tags: ['white-shirt', '449'],
  },
  {
    id: '158',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Offer sach mein fit hai? Check kar lo 🔍',
    message:
      'Read authentic verified buyer reviews and inspect detailed size guides before you buy!',
    cta: 'Check Details',
    url: '/shop',
    trigger: 'Review Social Proof',
    tags: ['verified-reviews', 'size-guide'],
  },
  {
    id: '159',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Aaj ka scroll productive bana do 📱',
    message: 'Random reel scrolling chhodkar 5 minute me wardrobe upgrade plan finalize karo.',
    cta: 'Explore Deals',
    url: '/shop',
    trigger: 'Time-well-spent Angle',
    tags: ['productive', 'upgrade'],
  },
  {
    id: '160',
    category: 'OFFERS_DEALS',
    categoryLabel: 'Offers, Deals & Campaign Humour',
    title: 'Savings ka screenshot baad mein, pehle browse 😂',
    message: 'Best deals fast-selling boutique items me hoti hain. Don’t miss your size!',
    cta: 'View Offers',
    url: '/shop',
    trigger: 'Quick Act Alert',
    tags: ['savings', 'size-alert'],
  },

  // ==========================================
  // 💌 Section 9: Comeback, Loyalty & Friendly Engagement (161 - 180)
  // ==========================================
  {
    id: '161',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Oye, kahan gayab ho? 👀',
    message:
      '{customer_name}, aapke bina JiivaaKart thoda suna-suna lag raha tha! Naye styles check karne aa jao.',
    cta: 'Come Back',
    url: '/shop',
    trigger: 'Inactive 3 Days',
    tags: ['inactive-3d', 'comeback'],
  },
  {
    id: '162',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Long time no style! 🥹',
    message:
      'Aapke favourite boutique ne naye pieces add kiye hain. Dekho kya naya aaya hai collection me!',
    cta: 'Explore Again',
    url: '/shop',
    trigger: 'Inactive 5 Days',
    tags: ['inactive-5d', 'long-time'],
  },
  {
    id: '163',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Humne tumhari browsing wali energy miss ki 😜',
    message:
      "Hamara algorithm bol raha tha: 'Bestie kahan chali gayi?' Wapas aao, fresh fashion wait kar raha hai.",
    cta: 'Visit JiivaaKart',
    url: '/shop',
    trigger: 'Inactive 7 Days',
    tags: ['inactive-7d', 'miss-you'],
  },
  {
    id: '164',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Tumhare bina fashion feed suna-suna hai 😂',
    message:
      'Aapke personalized feed me 10 naye textured shirts aur printed casuals add huye hain. Look now!',
    cta: "See What's New",
    url: '/category/men',
    trigger: 'Feed Refresh Push',
    tags: ['feed-refresh', 'curated'],
  },
  {
    id: '165',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Bestie check-in! Sab stylish? 🫶',
    message:
      'Hum bas yeh check karne aaye the ki aapka wardrobe fully prepped hai ya fresh style delivery chahiye!',
    cta: 'Browse Now',
    url: '/shop',
    trigger: 'Mid-week Check-in',
    tags: ['check-in', 'bestie'],
  },
  {
    id: '166',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Break khatam? Fashion break shuru! ☕',
    message:
      'Kaam ke beech 2 minute ka chai break lo aur JiivaaKart par trending looks scroll karo.',
    cta: 'Take a Look',
    url: '/shop',
    trigger: '4:30 PM Tea Break',
    tags: ['chai-break', 'afternoon'],
  },
  {
    id: '167',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Aaj ka tiny reminder: style is yours ✨',
    message:
      'Never let anyone dull your sparkle! Dress well, feel confident, and conquer your day.',
    cta: 'Find Your Style',
    url: '/shop',
    trigger: 'Morning Encouragement',
    tags: ['confidence', 'morning'],
  },
  {
    id: '168',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Tumhari next discovery pending hai 🔍',
    message:
      'Har hafte hum exclusive boutique finds curate karte hain. Check out this week’s top rated styles!',
    cta: 'Discover Now',
    url: '/shop',
    trigger: 'Weekly Curation Alert',
    tags: ['weekly-curation', 'top-rated'],
  },
  {
    id: '169',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Ek hello toh banta hai 👋',
    message:
      'Hello {customer_name}! Jiivaa VIP club me aapke coins safe hain. Unhe checkout par redeem karo.',
    cta: 'Say Hello',
    url: '/account/rewards',
    trigger: 'VIP Retention Nudge',
    tags: ['coins-retention', 'vip-club'],
  },
  {
    id: '170',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Fashion friendship ko alive rakhein? ❤️',
    message:
      'Ek click aur aap wapas hamare sabse active boutique community ka part ban sakte hain. Visit now!',
    cta: 'Explore Fashion',
    url: '/shop',
    trigger: 'Community Focus',
    tags: ['community', 'friendship'],
  },
  {
    id: '171',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Tumhari style story ka next page 📖',
    message: 'Naya mahina, naya look! Start your fresh month shopping chapter on JiivaaKart today.',
    cta: 'Turn the Page',
    url: '/shop',
    trigger: '1st of Month Hook',
    tags: ['new-month', 'fresh-chapter'],
  },
  {
    id: '172',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Scroll karte-karte idhar bhi aa jao 😄',
    message: 'Insta reels se thoda break lo aur real wardrobe upgrade pieces discover karo.',
    cta: 'Visit Now',
    url: '/shop',
    trigger: 'Social Media Fatigue',
    tags: ['reels-break', 'real-shopping'],
  },
  {
    id: '173',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Aaj kuch naya discover karne ka din hai 🌈',
    message: 'Men, Women aur Kids catalog me 15+ newly stocked premium products check karo.',
    cta: 'Explore All',
    url: '/shop',
    trigger: 'Catalog Overview',
    tags: ['overview', 'all-categories'],
  },
  {
    id: '174',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Your style squad is here 🫶',
    message:
      'Hum aapko sirf trending aur verified quality kapde recommend karte hain. Zero compromise fashion!',
    cta: 'Join the Fun',
    url: '/shop',
    trigger: 'Squad Trust Push',
    tags: ['style-squad', 'trust'],
  },
  {
    id: '175',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Boredom ko fashion se replace karein? 😜',
    message:
      'Boring din ko stylish banao ek naye Wine Maroon Shirt ya Adidas Tee ke saath. Instant mood boost!',
    cta: 'Beat Boredom',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Mood Uplift Trigger',
    tags: ['mood-boost', 'maroon-shirt'],
  },
  {
    id: '176',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Ek minute ka fashion break? ⏰',
    message: 'Sirf 60 seconds me check karo ki aapke city me kaunse boutique looks trending hain!',
    cta: 'Take a Break',
    url: '/shop',
    trigger: 'Quick Scroll Hook',
    tags: ['60-seconds', 'trending-city'],
  },
  {
    id: '177',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Tumhari choice interesting hai… aur options bhi 😉',
    message: 'Aapke previous views ke matching textures aur prints hamare inventory me live hain.',
    cta: 'See More',
    url: '/shop',
    trigger: 'Recommendation Push',
    tags: ['recommendation', 'matching-textures'],
  },
  {
    id: '178',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Aaj ka vibe check: fashion! 💃',
    message:
      'Vibe check: 100/100! Complete your ensemble with JiivaaKart’s top-selling bottomwear and shirts.',
    cta: 'Vibe Check',
    url: '/category/men',
    trigger: 'Friday Night Vibe',
    tags: ['vibe-check', 'friday-night'],
  },
  {
    id: '179',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'Wapas aao, kuch hatke dekhte hain 🤝',
    message: 'Generic retail chhodiye, verified boutique local craft ka charm explore kijiye.',
    cta: 'Explore Unique',
    url: '/shop',
    trigger: 'Differentiator Comeback',
    tags: ['local-craft', 'comeback'],
  },
  {
    id: '180',
    category: 'COMEBACK_LOYALTY',
    categoryLabel: 'Comeback, Loyalty & Friendly Engagement',
    title: 'JiivaaKart bol raha hai: milte hain website par! 💙',
    message:
      'Aapka style companion wait kar raha hai. Tap to open JiivaaKart and start your discovery.',
    cta: 'Visit JiivaaKart',
    url: '/shop',
    trigger: 'Direct Invitation',
    tags: ['invitation', 'brand-voice'],
  },

  // ==========================================
  // 🎊 Section 10: Festivals, Seasons & Occasion Fun (181 - 200)
  // ==========================================
  {
    id: '181',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Festival aa raha hai, outfit abhi soch rahe ho? 😭',
    message:
      'Last minute rush me mat faso! Rich Banarasi sarees, ethnic suits aur kurtas pehle se order kar lo.',
    cta: 'Shop Festive',
    url: '/category/women',
    trigger: '2 Weeks Before Festival',
    tags: ['festive', 'ethnic-suits', 'sarees'],
  },
  {
    id: '182',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Shaadi ka card aaya? Wardrobe ko batao 💌',
    message:
      'Yaar ki shaadi me standard shirts nahi chalegi! Velvet sherwanis, formal textured shirts & lehengas dekho.',
    cta: 'Explore Wedding',
    url: '/category/women',
    trigger: 'Wedding Season Alert',
    tags: ['wedding', 'lehengas', 'sherwani'],
  },
  {
    id: '183',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Party invite: accepted. Outfit: pending? 🪩',
    message:
      'Saturday night plan ready hai? Wine Maroon Textured Shirt + Diesel Jeans = The ultimate party fit!',
    cta: 'Find Partywear',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: 'Thursday Evening (6 PM)',
    tags: ['partywear', 'maroon-shirt', 'diesel-jeans'],
  },
  {
    id: '184',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Summer heat, cool fits ☀️',
    message:
      'Pure breathable cotton textured shirts and lightweight lowers jo summer me bhi cool aur fresh rakhein.',
    cta: 'Shop Summer',
    url: '/category/men',
    trigger: 'Summer Season Launch',
    tags: ['summer', 'breathable-cotton'],
  },
  {
    id: '185',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Winter is coming… wardrobe ko pata hai? 🧣',
    message:
      'Rich textured full sleeve shirts, heavy denim jeans aur layering essentials live ho chuki hain!',
    cta: 'Shop Winter',
    url: '/p/diesel-men-s-dark-blue-straight-fit-denim-jeans',
    trigger: 'Winter Pre-launch',
    tags: ['winter', 'heavy-denim'],
  },
  {
    id: '186',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Vacation booked, outfits unbooked? 🧳',
    message:
      'Goa trip ho ya Himachal getaway, Grey Camo Lower + Graphic Tees ka comfort travel combo pack karo!',
    cta: 'Shop Vacation',
    url: '/p/men-s-grey-camo-print-relaxed-fit-track-lower',
    trigger: 'Vacation Season Push',
    tags: ['vacation', 'travel-pack', 'camo-lower'],
  },
  {
    id: '187',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'College reopen, style bhi reboot 🎒',
    message:
      'New semester, new confidence! Everyday casual shirts and comfortable denim for campus life.',
    cta: 'Shop College',
    url: '/category/men',
    trigger: 'Semester Re-open Alert',
    tags: ['college', 'campus-wear'],
  },
  {
    id: '188',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Birthday tumhara, outfit bhi iconic hona chahiye 🎂',
    message:
      'Aapke special day par aap sabse standout dikhne chahiye. Explore JiivaaKart boutique showstoppers!',
    cta: 'Find Birthday Look',
    url: '/shop',
    trigger: 'User Birthday / Milestone',
    tags: ['birthday', 'showstopper'],
  },
  {
    id: '189',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Diwali lights aur festive fits ✨',
    message:
      'Ghar saaf ho gaya, ab style roshan karo! Heritage silk sarees aur designer men’s festive sets browse karo.',
    cta: 'Shop Festive',
    url: '/category/women',
    trigger: 'Diwali Campaign',
    tags: ['diwali', 'silk-sarees', 'festive'],
  },
  {
    id: '190',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Holi colours, comfy outfits 🌈',
    message:
      'Festive celebration ke baad family dinner ke liye clean, fresh and comfortable cotton attire ready rakho.',
    cta: 'Explore Styles',
    url: '/shop',
    trigger: 'Holi Campaign',
    tags: ['holi', 'cotton-attire'],
  },
  {
    id: '191',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Eid look planning mode: ON 🌙',
    message:
      'Regal kurtas, embroidered dupattas aur festive boutique ethnic wear curated for Eid celebrations.',
    cta: 'Explore Eid Looks',
    url: '/category/women',
    trigger: 'Eid Festive Edit',
    tags: ['eid', 'regal-kurtas', 'dupattas'],
  },
  {
    id: '192',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Raksha Bandhan ka plan? Style bhi plan karo 🎁',
    message:
      'Bhai ke liye crisp Wine/Olive textured shirt aur behen ke liye elegant boutique suit. Gift with love!',
    cta: 'Shop Collection',
    url: '/shop',
    trigger: 'Rakhi Gift Campaign',
    tags: ['rakhi', 'gifting', 'textured-shirts'],
  },
  {
    id: '193',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Valentine date, outfit ka kya scene? ❤️',
    message:
      'First impressions matter! Deep Wine Maroon Shirt aur fitted dark denim jeans gives the sharpest romantic look.',
    cta: 'Find Date Look',
    url: '/p/men-s-wine-maroon-textured-full-sleeve-casual-shirt',
    trigger: "Valentine's Week (Feb)",
    tags: ['valentine', 'date-look', 'maroon-shirt'],
  },
  {
    id: '194',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'New Year, new fit, same fabulous you 🥳',
    message:
      'Start the new year with a fresh fashion upgrade! Celebrate in premium JiivaaKart boutique looks.',
    cta: 'Start Fresh',
    url: '/shop',
    trigger: 'New Year (Dec 30 - Jan 2)',
    tags: ['new-year', 'party'],
  },
  {
    id: '195',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Monsoon mood, fresh wardrobe ☔',
    message:
      'Baarish me chai, pakode aur quick-drying comfortable casual fits. Discover monsoon friendly styles!',
    cta: 'Explore Monsoon',
    url: '/p/men-s-black-oversized-graphic-print-cotton-t-shirt',
    trigger: 'Monsoon Season Alert',
    tags: ['monsoon', 'casual-fits'],
  },
  {
    id: '196',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Weekend getaway? Outfit getaway bhi 🏖️',
    message:
      'Road trip vibes only! Pack the Men’s Relaxed Fit Track Lower and hit the highway in absolute comfort.',
    cta: 'Shop Weekend',
    url: '/p/men-s-grey-camo-print-relaxed-fit-track-lower',
    trigger: 'Friday 12 PM',
    tags: ['road-trip', 'camo-lower'],
  },
  {
    id: '197',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Function ghar mein hai ya outfit crisis? 😂',
    message:
      'Chachi, bua aur friends sabki nazar aapke outfit par hogi! Stand out with authentic boutique tailoring.',
    cta: 'Explore Occasion',
    url: '/shop',
    trigger: 'Family Gathering Alert',
    tags: ['family-function', 'occasionwear'],
  },
  {
    id: '198',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Family function = family fit check 📸',
    message:
      'Coordinated outfits for Men, Women and Kids available from a single trusted marketplace.',
    cta: 'Shop Family',
    url: '/shop',
    trigger: 'Weekend Family Gatherings',
    tags: ['family-fit-check', 'coordinated'],
  },
  {
    id: '199',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Celebration ka dress code: be yourself ✨',
    message:
      'No uncomfortable stiff clothes—breathe easy and look stunning with premium soft cotton weaves.',
    cta: 'Find Your Look',
    url: '/shop',
    trigger: 'Comfort-First Occasion',
    tags: ['comfort', 'cotton-weaves'],
  },
  {
    id: '200',
    category: 'FESTIVALS_SEASONS',
    categoryLabel: 'Festivals, Seasons & Occasion Fun',
    title: 'Calendar mein event, JiivaaKart mein outfit? 😉',
    message:
      'Har date ke liye ek perfect outfit tayyar hai. Plan your style calendar with JiivaaKart!',
    cta: 'Plan My Look',
    url: '/shop',
    trigger: 'Monthly Planner Push',
    tags: ['monthly-plan', 'event-calendar'],
  },
];

/**
 * Utility: Lookup template by ID ('001' - '200')
 */
export function getNotificationTemplateById(id: string): PushNotificationTemplate | undefined {
  const cleanId = id.padStart(3, '0');
  return JIIVAA_PUSH_TEMPLATES.find((t) => t.id === cleanId);
}

/**
 * Utility: Get templates filtered by Category
 */
export function getNotificationTemplatesByCategory(
  category: NotificationCategoryKey,
): PushNotificationTemplate[] {
  return JIIVAA_PUSH_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Utility: Pick a random template, optionally restricted to a specific category
 */
export function getRandomNotificationTemplate(
  category?: NotificationCategoryKey,
): PushNotificationTemplate {
  const pool = category ? getNotificationTemplatesByCategory(category) : JIIVAA_PUSH_TEMPLATES;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || JIIVAA_PUSH_TEMPLATES[0];
}

/**
 * Utility: Format message with dynamic customer name or product variables
 */
export function formatNotificationTemplate(
  template: PushNotificationTemplate,
  variables: { customerName?: string; productName?: string; shopName?: string } = {},
): { title: string; message: string; cta: string; url: string } {
  const name = (variables.customerName || 'Fashion Insider').trim().split(' ')[0];
  const product = variables.productName || 'Boutique Exclusive';
  const shop = variables.shopName || 'JiivaaKart Boutique';

  const formattedMessage = template.message
    .replace(/{customer_name}/gi, name)
    .replace(/{product_name}/gi, product)
    .replace(/{shop_name}/gi, shop);

  const formattedTitle = template.title
    .replace(/{customer_name}/gi, name)
    .replace(/{product_name}/gi, product);

  return {
    title: formattedTitle,
    message: formattedMessage,
    cta: template.cta,
    url: template.url,
  };
}
