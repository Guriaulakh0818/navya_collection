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
  const title = (payload.title || 'Ethnic Garment').trim();
  const brand = (payload.brand || 'Navya Collection').trim();
  const category = (payload.category || 'Ethnic Wear').trim();
  const fabric = (
    payload.fabric ||
    payload.attributes?.fabric ||
    payload.attributes?.fabric_type ||
    'Pure Silk Blend'
  ).trim();
  const pattern = (
    payload.pattern ||
    payload.attributes?.pattern ||
    payload.attributes?.work_type ||
    'Intricate Zari Weave'
  ).trim();
  const color = (payload.color || payload.attributes?.color || 'Regal Hue').trim();
  const occasion = (
    payload.occasion ||
    payload.attributes?.occasion ||
    'Weddings, Festive Celebrations, and Grand Soirees'
  ).trim();
  const tone = payload.tone || 'royal';

  const isSaree = category.toLowerCase().includes('saree') || title.toLowerCase().includes('saree');
  const isLehenga =
    category.toLowerCase().includes('lehenga') || title.toLowerCase().includes('lehenga');
  const isKurta =
    category.toLowerCase().includes('kurta') ||
    category.toLowerCase().includes('suit') ||
    title.toLowerCase().includes('kurta');
  const isMenswear =
    payload.department === 'dept_men' ||
    category.toLowerCase().includes('men') ||
    title.toLowerCase().includes('men');

  let storyHook = '';
  let fabricSection = '';
  let specSection = '';
  let stylingSection = '';
  let careSection = '';

  if (isSaree) {
    storyHook = `Embrace timeless grace and regal heritage with this exquisite ${title} from ${brand}. Meticulously handcrafted for the modern connoisseur of Indian ethnic luxury, this saree brings a touch of royal splendor to every celebratory step.`;
    fabricSection = `Draped in feather-light, luxurious ${fabric}, the body features ${pattern} that reflects subtle opulence under celebratory lighting. The silhouette exudes a majestic fall with an artisanal border and a richly embellished pallu that commands admiration.`;
    specSection = `• Garment: Traditional Indian Saree\n• Fabric: ${fabric}\n• Weave / Pattern: ${pattern}\n• Color: ${color}\n• Saree Length: 5.5 Metres\n• Blouse Piece: 0.8 Metres unstitched matching/contrast fabric included\n• Drape & Feel: Smooth, breathable, and gracefully flowing silhouette`;
    stylingSection = `Pair this heirloom piece with traditional antique temple jewellery, gold-toned jhumkas, a sleek clutch, and embellished mojaris for an unforgettable wedding or festive statement.`;
    careSection = `Dry clean recommended to preserve the lustrous sheen, fabric strength, and delicate zari work. Store wrapped in a soft muslin cloth.`;
  } else if (isLehenga) {
    storyHook = `Turn every festive moment into a royal spectacle with this breathtaking ${title} by ${brand}. Designed to celebrate the grandeur of Indian festivities with couture finesse.`;
    fabricSection = `Tailored from premium ${fabric}, this ensemble features spellbinding ${pattern} and voluminous flare (ghera) that moves gracefully with every twirl. The matching dupatta and artisanal choli complete the mesmerizing silhouette.`;
    specSection = `• Garment: Designer Ethnic Lehenga Choli Set\n• Fabric: ${fabric}\n• Embellishment: ${pattern}\n• Dominant Color: ${color}\n• Set Includes: Semi-stitched/Stitched Lehenga, Choli Fabric, Embellished Dupatta\n• Occasion: ${occasion}`;
    stylingSection = `Style with a statement choker necklace, maang tikka, high heels, and a dewy royal makeup look.`;
    careSection = `Specialist dry clean only. Handle intricate embroidery with gentle care.`;
  } else if (isKurta) {
    storyHook = `Effortless sophistication meets timeless craftsmanship in this ${title} from ${brand}. Perfect for both intimate gatherings and lavish festive evenings.`;
    fabricSection = `Crafted from breathable, skin-friendly ${fabric}, ensuring day-long comfort without compromising on style. Accented with subtle ${pattern} that lends an understated boutique elegance.`;
    specSection = `• Garment: Tailored Kurta Ensemble\n• Fabric: ${fabric}\n• Detailing: ${pattern}\n• Color: ${color}\n• Occasion: ${occasion}\n• Fit: Comfort Flattering Fit with refined side slits`;
    stylingSection = `Pair with cigarette pants or palazzo, kolhapuri sandals, and silver oxidized earrings for an effortlessly chic look.`;
    careSection = `Gentle machine wash with mild detergent or hand wash in cold water. Iron on reverse side.`;
  } else if (isMenswear) {
    storyHook = `Exude distinguished royalty and impeccable poise with this ${title} by ${brand}. Designed for celebrations where making an impression is non-negotiable.`;
    fabricSection = `Expertly tailored using handpicked ${fabric}, offering a structured drape, supreme comfort, and immaculate stitching with sophisticated ${pattern}.`;
    specSection = `• Garment: Mens Ethnic Designer Wear\n• Fabric: ${fabric}\n• Work / Finish: ${pattern}\n• Primary Color: ${color}\n• Occasion: ${occasion}\n• Fit: Sharp Tailored Silhouette`;
    stylingSection = `Complement with classic ethnic juttis, a pocket square, and an understated wristwatch for a commanding presence.`;
    careSection = `Dry clean recommended for crisp finish and enduring fabric life.`;
  } else {
    storyHook = `Elevate your wardrobe with the artisanal allure of this ${title} from ${brand}. A harmonious symphony of traditional craftsmanship and contemporary luxury.`;
    fabricSection = `Featuring hand-selected ${fabric} enhanced with exquisite ${pattern}, this outfit promises unmatched comfort and a flattering silhouette.`;
    specSection = `• Garment: Premium Designer Outfit\n• Fabric: ${fabric}\n• Work: ${pattern}\n• Color: ${color}\n• Occasion: ${occasion}`;
    stylingSection = `Versatile styling options—pair with signature ethnic accessories for a standout celebration.`;
    careSection = `Dry clean recommended or gentle care to maintain original sheen and fabric texture.`;
  }

  let finalDescription = '';

  if (tone === 'bullet') {
    finalDescription = `${storyHook}\n\nKey Highlights & Features:\n${specSection}\n\nFabric & Craftsmanship:\n${fabricSection}\n\nStyling Tips:\n${stylingSection}\n\nWash Care:\n${careSection}`;
  } else if (tone === 'seo') {
    finalDescription = `${title} | Premium Ethnic Collection by ${brand}\n\nLooking for the perfect ${category.toLowerCase()} for ${occasion}? This ${title} is crafted in luxurious ${fabric} featuring ${pattern} in stunning ${color}.\n\nProduct Details:\n${specSection}\n\nCraftsmanship:\n${fabricSection}\n\nHow to Style:\n${stylingSection}\n\nCare Instructions:\n${careSection}\n\n100% Genuine Artisan Quality | Fast Delivery Across India | Easy Exchanges`;
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
      'indian wedding collection',
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
