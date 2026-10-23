import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/session';

export const maxDuration = 30;

interface GenerateDescriptionPayload {
  title: string;
  brand?: string;
  category?: string;
  department?: string;
  fabric?: string;
  pattern?: string;
  color?: string;
  sareeType?: string;
  occasion?: string;
  attributes?: Record<string, any>;
  currentDescription?: string;
  tone?: 'royal' | 'bullet' | 'seo';
}

/**
 * High-precision Indian Boutique AI Copywriting Engine
 * Produces authentic, customer-delighting ethnic fashion descriptions
 * with Zero latency and zero external dependency risk.
 */
function generateBoutiqueDescription(payload: GenerateDescriptionPayload): {
  description: string;
  metaDescription: string;
  keywords: string[];
} {
  const title = (payload.title || 'Fashion Garment').trim();
  const brand = (payload.brand || 'Navya Collection').trim();
  const category = (payload.category || '').trim();
  const color = (payload.color || payload.attributes?.color || 'Classic Tone').trim();
  const tone = payload.tone || 'royal';

  const lowerTitle = title.toLowerCase();
  const lowerCat = category.toLowerCase();
  const lowerDept = (payload.department || '').toLowerCase();

  // Category classifiers
  const isSaree = lowerCat.includes('saree') || lowerTitle.includes('saree');
  const isLehenga =
    lowerCat.includes('lehenga') || lowerTitle.includes('lehenga') || lowerTitle.includes('choli');
  const isWomensEthnicKurta =
    (lowerCat.includes('kurta') ||
      lowerCat.includes('kurti') ||
      lowerCat.includes('anarkali') ||
      lowerCat.includes('salwar') ||
      lowerTitle.includes('kurti')) &&
    !lowerDept.includes('men');
  const isFormalWear =
    lowerCat.includes('formal') ||
    lowerTitle.includes('formal') ||
    lowerCat.includes('trouser') ||
    lowerTitle.includes('trouser') ||
    lowerTitle.includes('pant') ||
    lowerCat.includes('chino') ||
    lowerCat.includes('suit') ||
    lowerTitle.includes('blazer') ||
    lowerTitle.includes('suit');
  const isCasualOrDenim =
    lowerCat.includes('jeans') ||
    lowerTitle.includes('jeans') ||
    lowerCat.includes('denim') ||
    lowerTitle.includes('t-shirt') ||
    lowerTitle.includes('tshirt') ||
    lowerCat.includes('t-shirt') ||
    lowerCat.includes('cargo') ||
    lowerTitle.includes('cargo') ||
    lowerCat.includes('short') ||
    lowerTitle.includes('short') ||
    lowerCat.includes('polo') ||
    lowerTitle.includes('polo');
  const isMensEthnic =
    (lowerCat.includes('sherwani') ||
      lowerTitle.includes('sherwani') ||
      lowerTitle.includes('kurta') ||
      lowerCat.includes('kurta') ||
      lowerCat.includes('nehru') ||
      lowerTitle.includes('nehru')) &&
    (lowerDept.includes('men') || lowerCat.includes('men') || lowerTitle.includes('men'));
  const isActiveOrLoungewear =
    lowerCat.includes('track') ||
    lowerTitle.includes('track') ||
    lowerCat.includes('hoodie') ||
    lowerTitle.includes('hoodie') ||
    lowerCat.includes('sweatshirt') ||
    lowerTitle.includes('sweatshirt') ||
    lowerCat.includes('active') ||
    lowerCat.includes('gym') ||
    lowerCat.includes('thermal') ||
    lowerCat.includes('sleep') ||
    lowerCat.includes('night');
  const isKids =
    lowerDept.includes('kids') ||
    lowerCat.includes('kids') ||
    lowerTitle.includes('kids') ||
    lowerCat.includes('baby') ||
    lowerTitle.includes('baby') ||
    lowerCat.includes('teen');
  const isWomensWestern =
    (lowerCat.includes('dress') ||
      lowerTitle.includes('dress') ||
      lowerCat.includes('top') ||
      lowerTitle.includes('top') ||
      lowerCat.includes('skirt') ||
      lowerTitle.includes('skirt') ||
      lowerCat.includes('coord') ||
      lowerTitle.includes('jumpsuit')) &&
    !isSaree &&
    !isLehenga;

  let storyHook = '';
  let fabricSection = '';
  let specSection = '';
  let stylingSection = '';
  let careSection = '';

  let fabric = (payload.fabric || payload.attributes?.fabric || '').trim();
  let pattern = (payload.pattern || payload.attributes?.pattern || '').trim();
  let occasion = (payload.occasion || payload.attributes?.occasion || '').trim();

  if (isSaree) {
    fabric = fabric || 'Pure Silk Blend';
    pattern = pattern || 'Intricate Zari Border & Rich Pallu';
    occasion = occasion || 'Weddings, Festivals & Royal Celebrations';

    storyHook = `Embrace timeless grace and regal heritage with this exquisite ${title} from ${brand}. Handcrafted for connoisseurs of Indian ethnic luxury, this saree brings majestic splendor to every celebratory step.`;
    fabricSection = `Draped in feather-light, luxurious ${fabric}, the body features ${pattern} that reflects subtle opulence under festive lighting with an effortless, graceful fall.`;
    specSection = `• Garment: Traditional Indian Saree\n• Fabric: ${fabric}\n• Weave / Pattern: ${pattern}\n• Primary Color: ${color}\n• Saree Length: 5.5 Metres\n• Blouse Piece: 0.8 Metres unstitched matching/contrast fabric included\n• Drape & Feel: Flowing, structured, and breathable`;
    stylingSection = `Pair with traditional antique temple jewellery, gold-toned jhumkas, a sleek clutch, and embellished mojaris for an unforgettable statement.`;
    careSection = `Dry clean recommended to preserve the lustrous sheen, fabric strength, and delicate zari work. Store wrapped in a soft muslin cloth.`;
  } else if (isLehenga) {
    fabric = fabric || 'Rich Silk & Net Blend';
    pattern = pattern || 'Artisanal Resham, Zari & Sequin Detailing';
    occasion = occasion || 'Weddings, Sangeet & Grand Celebrations';

    storyHook = `Turn every festive moment into a royal spectacle with this breathtaking ${title} by ${brand}. Designed to celebrate the grandeur of Indian festivities with couture finesse.`;
    fabricSection = `Tailored from premium ${fabric}, this ensemble features spellbinding ${pattern} and voluminous flare that moves gracefully with every twirl.`;
    specSection = `• Garment: Designer Ethnic Lehenga Choli Set\n• Fabric: ${fabric}\n• Embellishment: ${pattern}\n• Dominant Color: ${color}\n• Set Includes: Lehenga, Choli Fabric & Embellished Dupatta\n• Occasion: ${occasion}`;
    stylingSection = `Style with a statement choker necklace, maang tikka, high heels, and royal festive makeup.`;
    careSection = `Specialist dry clean only. Handle intricate embroidery with gentle care.`;
  } else if (isFormalWear) {
    fabric = fabric || 'Premium Poly-Viscose Stretch Blend';
    pattern = pattern || 'Solid Classic Tailored Finish';
    occasion = occasion || 'Executive Office, Boardroom, Formal Dinners & Celebrations';

    storyHook = `Exude sharp confidence and executive refinement with this ${title} by ${brand}. Engineered for professional distinction where making a commanding impression is non-negotiable.`;
    fabricSection = `Expertly tailored from handpicked ${fabric}, offering a clean structured drape, high wrinkle recovery, and breathable all-day comfort with sophisticated ${pattern}.`;
    specSection = `• Garment: Tailored Executive Formalwear\n• Fabric: ${fabric}\n• Pattern / Weave: ${pattern}\n• Primary Color: ${color}\n• Occasion: ${occasion}\n• Fit: Sharp Tailored Regular Slim Fit`;
    stylingSection = `Pair with a crisp formal shirt, genuine leather oxfords or derby dress shoes, and a matching leather belt for an assertive, polished look.`;
    careSection = `Machine wash cold on gentle cycle or professional dry clean. Warm iron to maintain sharp creases.`;
  } else if (isMensEthnic) {
    fabric = fabric || 'Rich Silk Blend';
    pattern = pattern || 'Artisanal Resham & Zari Detailing';
    occasion = occasion || 'Weddings, Sangeet, Festivals & Grand Celebrations';

    storyHook = `Exude distinguished royalty and heritage poise with this ${title} by ${brand}. Handcrafted for celebratory occasions where traditional finesse takes center stage.`;
    fabricSection = `Expertly tailored using handpicked ${fabric}, offering an immaculate structured drape, supreme comfort, and sophisticated ${pattern}.`;
    specSection = `• Garment: Mens Designer Ethnic Wear\n• Fabric: ${fabric}\n• Work / Finish: ${pattern}\n• Primary Color: ${color}\n• Occasion: ${occasion}\n• Fit: Sharp Tailored Ethnic Silhouette`;
    stylingSection = `Complement with classic ethnic juttis, a contrast pocket square, and an understated wristwatch for a regal presence.`;
    careSection = `Dry clean recommended for enduring fabric life and crisp embroidery finish.`;
  } else if (isCasualOrDenim) {
    fabric = fabric || '100% Combed Breathable Cotton';
    pattern = pattern || 'Solid Clean Finish';
    occasion = occasion || 'Daily Casual Wear, Weekend Outings & Travel';

    storyHook = `Upgrade your daily wardrobe with the effortless comfort and modern edge of this ${title} by ${brand}. Designed for versatile styling from day out to casual evenings.`;
    fabricSection = `Crafted from premium ${fabric}, ensuring superior breathability, soft-on-skin feel, and durable construction featuring ${pattern}.`;
    specSection = `• Garment: Premium Casual Apparel\n• Fabric: ${fabric}\n• Pattern / Finish: ${pattern}\n• Primary Color: ${color}\n• Occasion: ${occasion}\n• Fit: Modern Comfort Fit`;
    stylingSection = `Pair with clean white sneakers, casual loafers, or layer over a classic jacket for an effortless street-smart aesthetic.`;
    careSection = `Machine wash cold with like colors. Do not bleach. Tumble dry low or air dry in shade.`;
  } else if (isWomensEthnicKurta) {
    fabric = fabric || 'Pure Cotton Silk Blend';
    pattern = pattern || 'Artisanal Embroidery & Printed Motifs';
    occasion = occasion || 'Festivals, Office & Intimate Celebrations';

    storyHook = `Effortless sophistication meets boutique heritage in this ${title} from ${brand}. Perfect for both intimate gatherings and lively festive evenings.`;
    fabricSection = `Crafted from breathable, skin-friendly ${fabric}, ensuring day-long ease without compromising on luxury. Accented with subtle ${pattern}.`;
    specSection = `• Garment: Designer Ethnic Kurta Ensemble\n• Fabric: ${fabric}\n• Detailing: ${pattern}\n• Color: ${color}\n• Occasion: ${occasion}\n• Fit: Comfort Flattering Fit with refined side slits`;
    stylingSection = `Pair with cigarette pants or palazzos, kolhapuri sandals, and silver oxidized jhumkas for an effortlessly chic ethnic look.`;
    careSection = `Gentle machine wash with mild detergent or hand wash in cold water. Iron on reverse side.`;
  } else if (isWomensWestern) {
    fabric = fabric || 'Smooth Flowing Crepe Blend';
    pattern = pattern || 'Contemporary Solid Chic';
    occasion = occasion || 'Brunches, Evening Parties & Casual Outings';

    storyHook = `Make heads turn with the chic silhouette and contemporary charm of this ${title} by ${brand}. Tailored to give you an effortlessly flattering look.`;
    fabricSection = `Cut from hand-selected ${fabric} featuring ${pattern}, offering fluid drape, soft handfeel, and freedom of movement.`;
    specSection = `• Garment: Contemporary Western Wear\n• Fabric: ${fabric}\n• Finish / Pattern: ${pattern}\n• Primary Color: ${color}\n• Occasion: ${occasion}\n• Fit: Tailored Flattering Fit`;
    stylingSection = `Pair with strappy heels or block sandals, a structured shoulder bag, and minimal gold accents.`;
    careSection = `Machine wash gentle cycle cold or hand wash. Hang dry to maintain shape.`;
  } else if (isKids) {
    fabric = fabric || '100% Hypoallergenic Pure Cotton';
    pattern = pattern || 'Kid-Friendly Soft Texture';
    occasion = occasion || 'Festivals, Parties & Everyday Play';

    storyHook = `Delight your little one with the adorable style and super-soft comfort of this ${title} by ${brand}. Crafted with utmost care for delicate skin.`;
    fabricSection = `Made from ultra-gentle, breathable ${fabric} with ${pattern}, designed to keep kids happy, comfortable, and active all day long.`;
    specSection = `• Garment: Kids Fashion Apparel\n• Fabric: ${fabric}\n• Detailing: ${pattern}\n• Primary Color: ${color}\n• Occasion: ${occasion}\n• Safety: Child-safe seams, breathable & non-irritating`;
    stylingSection = `Pair with comfortable sneakers or cute ethnic juttis for celebratory family events.`;
    careSection = `Machine wash cold with mild baby-safe detergent. Easy care & shrink resistant.`;
  } else {
    // General Fallback
    fabric = fabric || 'Premium Quality Blend';
    pattern = pattern || 'Solid Clean Finish';
    occasion = occasion || 'Casual & Festive Celebrations';

    storyHook = `Elevate your wardrobe with the artisanal allure of this ${title} from ${brand}. A harmonious balance of traditional craftsmanship and modern comfort.`;
    fabricSection = `Featuring hand-selected ${fabric} enhanced with ${pattern}, promising unmatched comfort and an enduring silhouette.`;
    specSection = `• Garment: Premium Designer Outfit\n• Fabric: ${fabric}\n• Pattern / Work: ${pattern}\n• Color: ${color}\n• Occasion: ${occasion}`;
    stylingSection = `Versatile styling options—pair with signature accessories for a standout celebration.`;
    careSection = `Gentle wash or dry clean recommended to maintain original sheen and fabric texture.`;
  }

  let finalDescription = '';

  if (tone === 'bullet') {
    finalDescription = `${storyHook}\n\nKey Highlights & Features:\n${specSection}\n\nFabric & Craftsmanship:\n${fabricSection}\n\nStyling Tips:\n${stylingSection}\n\nWash Care:\n${careSection}`;
  } else if (tone === 'seo') {
    finalDescription = `${title} | Premium Collection by ${brand}\n\nLooking for the perfect ${category.toLowerCase() || 'garment'} for ${occasion}? This ${title} is crafted in luxurious ${fabric} featuring ${pattern} in stunning ${color}.\n\nProduct Details:\n${specSection}\n\nCraftsmanship:\n${fabricSection}\n\nHow to Style:\n${stylingSection}\n\nCare Instructions:\n${careSection}\n\n100% Genuine Quality | Fast Delivery Across India | Easy Exchanges`;
  } else {
    // Royal Boutique Tone (Default)
    finalDescription = `${storyHook}\n\nArtisanal Craftsmanship & Design:\n${fabricSection}\n\nGarment Specifications:\n${specSection}\n\nStyling Guide:\n${stylingSection}\n\nCare & Maintenance:\n${careSection}`;
  }

  const metaDescription =
    `${title} by ${brand}. Crafted in luxurious ${fabric} with ${pattern} in ${color}. Perfect for ${occasion}. Shop authentic boutique fashion with fast shipping across India.`
      .slice(0, 160)
      .trim();

  const keywords = Array.from(
    new Set([
      title.toLowerCase(),
      category.toLowerCase(),
      `${fabric.toLowerCase()} ${category.toLowerCase()}`,
      `${color.toLowerCase()} ${category.toLowerCase()}`,
      pattern.toLowerCase(),
      'designer ethnic wear',
      'navya collection',
      brand.toLowerCase(),
    ]),
  ).filter(Boolean);

  return {
    description: finalDescription,
    metaDescription,
    keywords,
  };
}

/**
 * Optional Live LLM Enrichment (via Hugging Face or OpenAI or Gemini if configured)
 */
async function tryLiveLLMGeneration(payload: GenerateDescriptionPayload): Promise<string | null> {
  const token =
    process.env.HUGGINGFACE_API_TOKEN?.trim() ||
    process.env.HF_TOKEN?.trim() ||
    process.env.HUGGING_FACE_TOKEN?.trim();

  if (!token) return null;

  try {
    const prompt = `You are a world-class Indian luxury ethnic boutique copywriter for "Navya Collection".
Write an enticing, SEO-rich, premium product description for:
Product Title: ${payload.title}
Brand: ${payload.brand || 'Navya Collection'}
Category: ${payload.category || 'Ethnic Wear'}
Fabric: ${payload.fabric || 'Pure Silk Blend'}
Pattern/Work: ${payload.pattern || 'Artisanal Zari Work'}
Color: ${payload.color || 'Royal'}
Occasion: ${payload.occasion || 'Weddings & Celebrations'}
Existing Seller Notes: ${payload.currentDescription || 'None'}

Format with:
1. An evocative 2-line opening storytelling hook
2. Key Highlights (bullet points: Fabric, Weave, Color, Length/Set details)
3. Styling Advice (Jewellery, footwear)
4. Care Instructions (Wash care)

Return strictly the description text without conversational filler.`;

    // Attempt fast inference with a strict 4-second abort signal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://router.huggingface.co/hf-inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content && content.length > 80) {
        return content;
      }
    }
  } catch {
    // If live call fails or times out, silently fallback to boutique generator
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 },
      );
    }

    const payload: GenerateDescriptionPayload = await request.json();

    if (!payload.title || !payload.title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a Product Title first so AI can generate tailored description.',
        },
        { status: 400 },
      );
    }

    // Generate high-converting description via Boutique Engine
    const boutiqueResult = generateBoutiqueDescription(payload);

    // Attempt optional live LLM if available; if not or if it takes too long, use boutique result
    const liveLLMText = await tryLiveLLMGeneration(payload);
    const finalDescription = liveLLMText || boutiqueResult.description;

    return NextResponse.json({
      success: true,
      data: {
        description: finalDescription,
        metaDescription: boutiqueResult.metaDescription,
        keywords: boutiqueResult.keywords.join(', '),
        source: liveLLMText ? 'ai-live' : 'boutique-engine',
      },
    });
  } catch (error: any) {
    console.error('AI Description Generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate product description.',
      },
      { status: 500 },
    );
  }
}
