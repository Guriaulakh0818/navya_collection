'use client';

import {
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Filter,
  Gift,
  Grid,
  IndianRupee,
  Layers,
  Palette,
  RotateCcw,
  Ruler,
  Scissors,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { ProductCard } from '@/frontend/features/products/components/ProductCard';

export interface CategoryFilteredViewProps {
  initialProducts: any[];
  initialGender?: 'all' | 'men' | 'women' | 'unisex';
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentName?: string;
    parentSlug?: string;
    subCategories?: any[];
  };
}

// 1. PRODUCT TYPES (Clothing, Footwear & Accessories Context-Aware)
const CLOTHING_PRODUCT_TYPE_OPTIONS = [
  { id: 'shirts', label: 'Shirts', sublabel: 'Shirt / Shirts', count: 245, icon: Shirt },
  { id: 'tshirts', label: 'T-Shirts', sublabel: 'T-Shirt / Tees', count: 189, icon: Shirt },
  { id: 'kurtas', label: 'Kurtas', sublabel: 'Kurta / Ethnic Wear', count: 132, icon: Sparkles },
  { id: 'jeans', label: 'Jeans', sublabel: 'Jeans and Denim', count: 148, icon: Layers },
  { id: 'trousers', label: 'Trousers', sublabel: 'Pants / Trousers', count: 98, icon: Ruler },
  { id: 'jackets', label: 'Jackets', sublabel: 'Outerwear / Jackets', count: 76, icon: Shirt },
  { id: 'innerwear', label: 'Innerwear', sublabel: 'Innerwear / Thermals', count: 34, icon: Shirt },
  {
    id: 'ethnic_wear',
    label: 'Ethnic Wear',
    sublabel: 'Tailored / Blazer & Ethnic',
    count: 210,
    icon: Sparkles,
  },
];

const FOOTWEAR_PRODUCT_TYPE_OPTIONS = [
  {
    id: 'sneakers',
    label: 'Sneakers & Casual',
    sublabel: 'Low-top / Chunky',
    count: 120,
    icon: ShoppingBag,
  },
  {
    id: 'sports_shoes',
    label: 'Sports & Running',
    sublabel: 'Gym / Walking',
    count: 85,
    icon: Sparkles,
  },
  {
    id: 'formal_shoes',
    label: 'Formal Shoes',
    sublabel: 'Oxfords / Derbies',
    count: 64,
    icon: ShieldCheck,
  },
  { id: 'loafers', label: 'Loafers', sublabel: 'Moccasins / Slip-on', count: 52, icon: Layers },
  {
    id: 'heels',
    label: 'Heels & Wedges',
    sublabel: 'Block / Stilettos',
    count: 94,
    icon: Sparkles,
  },
  { id: 'flats', label: 'Flats & Ballerinas', sublabel: 'Daily / Bellies', count: 110, icon: Tag },
  {
    id: 'juttis',
    label: 'Ethnic Juttis',
    sublabel: 'Mojaris / Kolhapuri',
    count: 145,
    icon: Sparkles,
  },
  {
    id: 'sandals',
    label: 'Sandals & Slippers',
    sublabel: 'Floaters / Sliders',
    count: 78,
    icon: ShoppingBag,
  },
  { id: 'boots', label: 'Boots', sublabel: 'Chelsea / Ankle', count: 36, icon: ShieldCheck },
];

const ACCESSORIES_PRODUCT_TYPE_OPTIONS = [
  {
    id: 'bags',
    label: 'Handbags & Totes',
    sublabel: 'Totes / Shoulder',
    count: 132,
    icon: ShoppingBag,
  },
  {
    id: 'clutches',
    label: 'Clutches & Potlis',
    sublabel: 'Bridal / Slings',
    count: 88,
    icon: Sparkles,
  },
  {
    id: 'jewellery',
    label: 'Jewellery & Sets',
    sublabel: 'Jhumkas / Chokers',
    count: 175,
    icon: Sparkles,
  },
  { id: 'watches', label: 'Watches', sublabel: 'Analog / Smart', count: 96, icon: Star },
  { id: 'wallets', label: 'Wallets', sublabel: 'Leather / RFID', count: 84, icon: Layers },
  { id: 'belts', label: 'Belts', sublabel: 'Leather / Kamarbandh', count: 62, icon: Ruler },
  {
    id: 'sunglasses',
    label: 'Sunglasses',
    sublabel: 'UV400 / Aviators',
    count: 74,
    icon: Sparkles,
  },
  { id: 'scarves', label: 'Scarves & Stoles', sublabel: 'Silk / Phulkari', count: 58, icon: Tag },
  {
    id: 'backpacks',
    label: 'Backpacks & Travel',
    sublabel: 'Laptop / Duffle',
    count: 49,
    icon: ShoppingBag,
  },
  { id: 'hair_caps', label: 'Caps, Ties & Hair', sublabel: 'Groom / Clips', count: 44, icon: Gift },
];

// 2. FABRIC / MATERIAL OPTIONS
const CLOTHING_FABRIC_OPTIONS = [
  { id: 'cotton', label: 'Pure Cotton', count: 320 },
  { id: 'cotton_blend', label: 'Cotton Blend', count: 214 },
  { id: 'linen', label: 'Linen', count: 86 },
  { id: 'polyester', label: 'Polyester', count: 142 },
  { id: 'denim', label: 'Denim', count: 98 },
  { id: 'chiffon', label: 'Chiffon', count: 64 },
  { id: 'silk', label: 'Pure Silk / Raw Silk', count: 78 },
  { id: 'banarasi', label: 'Banarasi Brocade', count: 54 },
  { id: 'georgette', label: 'Georgette', count: 112 },
  { id: 'rayon', label: 'Rayon / Viscose', count: 92 },
  { id: 'velvet', label: 'Royal Velvet', count: 42 },
  { id: 'satin', label: 'Satin Silk', count: 58 },
  { id: 'crepe', label: 'Crepe', count: 36 },
];

const FOOTWEAR_MATERIAL_OPTIONS = [
  { id: 'leather', label: 'Genuine Leather', count: 115 },
  { id: 'pu_leather', label: 'Faux / PU Leather', count: 142 },
  { id: 'suede', label: 'Suede', count: 48 },
  { id: 'mesh', label: 'Breathable Mesh / Knit', count: 96 },
  { id: 'canvas', label: 'Canvas', count: 64 },
  { id: 'velvet', label: 'Velvet / Embroidered Silk', count: 88 },
  { id: 'rubber', label: 'Rubber / EVA', count: 112 },
];

const ACCESSORIES_MATERIAL_OPTIONS = [
  { id: 'leather', label: 'Genuine Leather', count: 120 },
  { id: 'faux_leather', label: 'Vegan / Faux Leather', count: 158 },
  { id: 'brass', label: 'Brass / Kundan / Alloy', count: 134 },
  { id: 'oxidised', label: 'Oxidised Silver', count: 86 },
  { id: 'steel', label: 'Stainless Steel', count: 92 },
  { id: 'silver', label: '925 Sterling Silver', count: 44 },
  { id: 'silk', label: 'Silk / Pashmina', count: 62 },
  { id: 'canvas', label: 'Canvas / Nylon', count: 54 },
];

// 3. COLOR PALETTES (Reference UI Image 4: circular dot swatches with badges)
const COLOR_OPTIONS = [
  { id: 'red', label: 'Red', hex: '#EF4444' },
  { id: 'blue', label: 'Blue', hex: '#2563EB' },
  { id: 'green', label: 'Green', hex: '#10B981' },
  { id: 'black', label: 'Black', hex: '#0F172A' },
  { id: 'white', label: 'White', hex: '#FFFFFF' },
  { id: 'pink', label: 'Pink', hex: '#EC4899' },
  { id: 'grey', label: 'Grey', hex: '#9CA3AF' },
  { id: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
  { id: 'purple', label: 'Purple', hex: '#9333EA' },
  { id: 'maroon', label: 'Maroon', hex: '#881337' },
  { id: 'beige', label: 'Beige', hex: '#D4B996' },
  { id: 'brown', label: 'Brown', hex: '#78350F' },
  { id: 'navy', label: 'Navy', hex: '#1E3A8A' },
  {
    id: 'multi',
    label: 'Multi',
    hex: 'conic-gradient(from 180deg at 50% 50%, #EF4444 0deg, #F59E0B 72deg, #10B981 144deg, #3B82F6 216deg, #8B5CF6 288deg, #EF4444 360deg)',
  },
];

// 4. SIZE PILLS (Context-Aware)
const CLOTHING_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
const FOOTWEAR_SIZE_OPTIONS = [
  'UK 3',
  'UK 4',
  'UK 5',
  'UK 6',
  'UK 7',
  'UK 8',
  'UK 9',
  'UK 10',
  'UK 11',
  'UK 12',
];
const ACCESSORIES_SIZE_OPTIONS = [
  'Free Size',
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '2.4',
  '2.6',
  '2.8',
  'Adjustable',
];

// Curated Sub-Categories with Gender Tags for Footwear & Accessories Quick Navigation
const FOOTWEAR_SUBCAT_SHOWCASE: {
  name: string;
  slug: string;
  gender: 'men' | 'women';
  image: string;
  badge?: string;
}[] = [
  {
    name: 'Men Sneakers',
    slug: 'men-casual-shoes',
    gender: 'men',
    image: '/images/categories/footwear-men-sneakers.png',
    badge: 'HOT',
  },
  {
    name: 'Men Sports',
    slug: 'men-sports-shoes',
    gender: 'men',
    image: '/images/categories/footwear-men-sneakers.png',
  },
  {
    name: 'Men Formal',
    slug: 'men-formal-shoes',
    gender: 'men',
    image: '/images/categories/footwear-men-formal.png',
  },
  {
    name: 'Men Loafers',
    slug: 'men-loafers',
    gender: 'men',
    image: '/images/categories/footwear-men-formal.png',
  },
  {
    name: 'Men Juttis & Mojaris',
    slug: 'men-ethnic-footwear',
    gender: 'men',
    image: '/images/categories/footwear-men-ethnic.png',
    badge: 'WEDDING',
  },
  {
    name: 'Men Sandals',
    slug: 'men-sandals',
    gender: 'men',
    image: '/images/categories/footwear-men-formal.png',
  },
  {
    name: 'Men Slippers',
    slug: 'men-flip-flops',
    gender: 'men',
    image: '/images/categories/category-footwear.png',
  },
  {
    name: 'Men Boots',
    slug: 'men-boots',
    gender: 'men',
    image: '/images/categories/footwear-men-formal.png',
  },
  {
    name: 'Women Flats',
    slug: 'women-flats',
    gender: 'women',
    image: '/images/categories/footwear-women-flats.png',
    badge: 'DAILY',
  },
  {
    name: 'Women Heels',
    slug: 'women-heels',
    gender: 'women',
    image: '/images/categories/footwear-women-heels.png',
    badge: 'PARTY',
  },
  {
    name: 'Women Ethnic Juttis',
    slug: 'women-juttis-mojaris',
    gender: 'women',
    image: '/images/categories/footwear-women-juttis.png',
    badge: 'BRIDAL',
  },
  {
    name: 'Women Sneakers',
    slug: 'women-sneakers',
    gender: 'women',
    image: '/images/categories/footwear-men-sneakers.png',
  },
  {
    name: 'Women Sports',
    slug: 'women-sports-shoes',
    gender: 'women',
    image: '/images/categories/footwear-men-sneakers.png',
  },
  {
    name: 'Women Sandals',
    slug: 'women-sandals',
    gender: 'women',
    image: '/images/categories/footwear-women-flats.png',
  },
  {
    name: 'Women Slippers',
    slug: 'women-flip-flops',
    gender: 'women',
    image: '/images/categories/footwear-women-flats.png',
  },
  {
    name: 'Women Boots',
    slug: 'women-boots',
    gender: 'women',
    image: '/images/categories/footwear-women-heels.png',
  },
];

const ACCESSORIES_SUBCAT_SHOWCASE: {
  name: string;
  slug: string;
  gender: 'men' | 'women';
  image: string;
  badge?: string;
}[] = [
  {
    name: 'Handbags & Totes',
    slug: 'women-bags',
    gender: 'women',
    image: '/images/categories/Handbags (womens).png',
    badge: 'POPULAR',
  },
  {
    name: 'Clutches & Potlis',
    slug: 'women-clutches',
    gender: 'women',
    image: '/images/categories/Clutches & Potlis (womens).png',
    badge: 'BRIDAL',
  },
  {
    name: 'Ethnic Jewellery',
    slug: 'women-jewellery',
    gender: 'women',
    image: '/images/categories/Jewellery & Sets (womens).png',
    badge: 'FESTIVE',
  },
  {
    name: 'Women Watches',
    slug: 'women-watches',
    gender: 'women',
    image: '/images/categories/Watches (womens).png',
  },
  {
    name: 'Women Sunglasses',
    slug: 'women-sunglasses',
    gender: 'women',
    image: '/images/categories/Sunglasses (womens).png',
  },
  {
    name: 'Scarves & Stoles',
    slug: 'women-scarves-stoles',
    gender: 'women',
    image: '/images/categories/Scarves, Stoles & Dupattas (womens).png',
  },
  {
    name: 'Women Belts',
    slug: 'women-belts',
    gender: 'women',
    image: '/images/categories/Belts (womens).png',
  },
  {
    name: 'Hair Accessories',
    slug: 'women-hair-accessories',
    gender: 'women',
    image: '/images/categories/Jewellery & Sets (womens).png',
    badge: 'NEW',
  },
  {
    name: 'Men Wallets',
    slug: 'men-wallets',
    gender: 'men',
    image: '/images/categories/men-wallets.png',
    badge: 'BESTSELLER',
  },
  {
    name: 'Men Belts',
    slug: 'men-belts',
    gender: 'men',
    image: '/images/categories/men-belts.png',
  },
  {
    name: 'Men Watches',
    slug: 'men-watches',
    gender: 'men',
    image: '/images/categories/men-accessories.png',
    badge: 'PREMIUM',
  },
  {
    name: 'Men Sunglasses',
    slug: 'men-sunglasses',
    gender: 'men',
    image: '/images/categories/men-sunglasses.png',
  },
  {
    name: 'Backpacks & Office',
    slug: 'men-bags-backpacks',
    gender: 'men',
    image: '/images/categories/men-all-accessories.png',
  },
  {
    name: 'Caps & Hats',
    slug: 'men-caps-hats',
    gender: 'men',
    image: '/images/categories/men-all-caps.png',
  },
  {
    name: 'Ties & Cufflinks',
    slug: 'men-ties',
    gender: 'men',
    image: '/images/categories/men-ties.png',
  },
  {
    name: 'Groom Accessories',
    slug: 'men-groom-accessories',
    gender: 'men',
    image: '/images/categories/men-ties.png',
    badge: 'WEDDING',
  },
];

// 5. CUSTOMER RATINGS (Reference UI Image 1: golden star rows with counts)
const RATING_OPTIONS = [
  { id: '4_5_star', label: '4.5 & above', minRating: 4.5, count: 320, stars: 4.5 },
  { id: '4_0_star', label: '4.0 & above', minRating: 4.0, count: 480, stars: 4.0 },
  { id: '3_5_star', label: '3.5 & above', minRating: 3.5, count: 690, stars: 3.5 },
  { id: '3_0_star', label: '3.0 & above', minRating: 3.0, count: 820, stars: 3.0 },
  { id: '2_5_star', label: '2.5 & above', minRating: 2.5, count: 910, stars: 2.5 },
];

// 6. PRICE BUCKETS & MILESTONES (Reference UI Image 1: dual inputs, track slider, checkboxes)
const PRICE_RANGES = [
  { id: 'under_499', label: 'Under ₹499', min: 0, max: 499 },
  { id: '500_999', label: '₹500 - ₹999', min: 500, max: 999 },
  { id: '1000_1999', label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
  { id: '2000_4999', label: '₹2,000 - ₹4,999', min: 2000, max: 4999 },
  { id: 'above_5000', label: '₹5,000 & Above', min: 5000, max: 999999 },
];

const PRICE_MILESTONES = [
  { label: '₹0', value: 0 },
  { label: '₹500', value: 500 },
  { label: '₹1,000', value: 1000 },
  { label: '₹2,000', value: 2000 },
  { label: '₹5,000+', value: 5000 },
];

// 7. PRINT TYPES
const PRINT_TYPES = [
  { id: 'floral', label: 'Floral Print' },
  { id: 'solid', label: 'Solid / Plain' },
  { id: 'embroidered', label: 'Embroidered Work' },
  { id: 'block_print', label: 'Block Print' },
  { id: 'geometric', label: 'Geometric Print' },
  { id: 'striped', label: 'Striped' },
  { id: 'abstract', label: 'Abstract Art' },
  { id: 'bandhani', label: 'Bandhani / Tie-Dye' },
  { id: 'jacquard', label: 'Jacquard / Woven' },
];

// 8. SLEEVE LENGTHS & STYLES
const SLEEVE_LENGTHS = [
  { id: 'full', label: 'Full Sleeve' },
  { id: 'three_quarter', label: '3/4th Sleeve' },
  { id: 'half', label: 'Half Sleeve' },
  { id: 'short', label: 'Short Sleeve' },
  { id: 'sleeveless', label: 'Sleeveless' },
];

const SLEEVE_STYLES = [
  { id: 'regular', label: 'Regular Sleeves' },
  { id: 'puff', label: 'Puff Sleeves' },
  { id: 'bell', label: 'Bell Sleeves' },
  { id: 'bishop', label: 'Bishop Sleeves' },
  { id: 'rollup', label: 'Roll-Up Sleeves' },
];

// 9. OCCASION OPTIONS
const OCCASION_OPTIONS = [
  { id: 'wedding', label: 'Wedding & Bridal' },
  { id: 'festive', label: 'Festivals & Grand Puja' },
  { id: 'party', label: 'Party & Evening' },
  { id: 'casual', label: 'Casual & Daily Wear' },
  { id: 'formal', label: 'Office & Formals' },
  { id: 'traditional', label: 'Traditional Ethnic' },
];

// 10. DISCOUNT OPTIONS
const DISCOUNT_OPTIONS = [
  { id: '50_percent', label: '50% or more', minDiscount: 50 },
  { id: '40_percent', label: '40% or more', minDiscount: 40 },
  { id: '30_percent', label: '30% or more', minDiscount: 30 },
  { id: '20_percent', label: '20% or more', minDiscount: 20 },
  { id: '10_percent', label: '10% or more', minDiscount: 10 },
];

// 11. COUNTRY OF ORIGIN
const COUNTRY_OPTIONS = [
  { id: 'india', label: 'Made in India 🇮🇳' },
  { id: 'handcrafted', label: 'Handcrafted by Artisans ✨' },
  { id: 'imported', label: 'Imported Fashion' },
];

/** Helper function to render 5-star rating preview */
function renderStarRating(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = rating >= star;
        const isHalf = !isFull && rating >= star - 0.5;
        return (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              isFull
                ? 'fill-[#F59E0B] text-[#F59E0B]'
                : isHalf
                  ? 'fill-[#F59E0B]/50 text-[#F59E0B]'
                  : 'fill-slate-200 text-slate-200'
            }`}
          />
        );
      })}
    </div>
  );
}

function resolveProductGender(p: any): 'men' | 'women' | 'unisex' | 'kids' {
  const g = String(p.gender || '')
    .toLowerCase()
    .trim();
  if (g === 'men' || g === 'male') return 'men';
  if (g === 'women' || g === 'female') return 'women';
  if (g === 'unisex') return 'unisex';
  if (g === 'kids') return 'kids';

  const catSlug = String(p.category?.slug || '').toLowerCase();
  const text = `${catSlug} ${p.name || ''} ${p.category?.name || ''}`.toLowerCase();
  if (
    catSlug.startsWith('women-') ||
    /\b(women|woman|ladies|bridal|heel|jutti|saree|lehenga|handbag|potli|clutch|jhumka)\b/.test(
      text,
    )
  ) {
    return 'women';
  }
  if (
    catSlug.startsWith('men-') ||
    /\b(men|mens|gent|formal shoe|oxford|loafer|sherwani|tie|cufflink|groom)\b/.test(text)
  ) {
    return 'men';
  }
  return 'unisex';
}

export function CategoryFilteredView({
  initialProducts,
  category,
  initialGender = 'all',
}: CategoryFilteredViewProps) {
  const slugLower = (category.slug || '').toLowerCase();
  const parentSlugLower = (category.parentSlug || '').toLowerCase();

  const isFootwearCategory =
    slugLower === 'footwear' ||
    slugLower.startsWith('footwear-') ||
    slugLower === 'all-footwear' ||
    parentSlugLower === 'footwear' ||
    category.id === 'group_footwear' ||
    /shoe|sneaker|heel|flat|jutti|mojari|loafer|sandal|flip-flop|boot/.test(slugLower);

  const isAccessoriesCategory =
    slugLower === 'accessories' ||
    slugLower.startsWith('accessories-') ||
    slugLower === 'all-accessories' ||
    parentSlugLower === 'accessories' ||
    category.id === 'group_accessories' ||
    /wallet|belt|watch|sunglass|jewellery|bag|clutch|scarf|stole|caps-hats|ties|hair-acc|groom-acc/.test(
      slugLower,
    );

  // Show prominent Men / Women / Unisex switcher on Footwear, Accessories, and mixed hubs
  const showGenderFilter =
    isFootwearCategory ||
    isAccessoriesCategory ||
    slugLower === 'spotlight' ||
    slugLower === 'trending' ||
    slugLower === 'new-arrivals' ||
    slugLower === 'best-sellers';

  // Context-aware filter options (replaces clothing filters on Footwear & Accessories pages)
  const PRODUCT_TYPE_OPTIONS = isFootwearCategory
    ? FOOTWEAR_PRODUCT_TYPE_OPTIONS
    : isAccessoriesCategory
      ? ACCESSORIES_PRODUCT_TYPE_OPTIONS
      : CLOTHING_PRODUCT_TYPE_OPTIONS;

  const FABRIC_OPTIONS = isFootwearCategory
    ? FOOTWEAR_MATERIAL_OPTIONS
    : isAccessoriesCategory
      ? ACCESSORIES_MATERIAL_OPTIONS
      : CLOTHING_FABRIC_OPTIONS;

  const SIZE_OPTIONS = isFootwearCategory
    ? FOOTWEAR_SIZE_OPTIONS
    : isAccessoriesCategory
      ? ACCESSORIES_SIZE_OPTIONS
      : CLOTHING_SIZE_OPTIONS;

  // Mobile drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<string>('product_type');

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileFilterOpen]);

  // Primary Filter states
  const [selectedGender, setSelectedGender] = useState<'all' | 'men' | 'women' | 'unisex'>(
    initialGender,
  );
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [productTypeViewMode, setProductTypeViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [showAllFabrics, setShowAllFabrics] = useState<boolean>(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [isNavyaAssuredOnly, setIsNavyaAssuredOnly] = useState<boolean>(false);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedPrintTypes, setSelectedPrintTypes] = useState<string[]>([]);
  const [selectedSleeveLengths, setSelectedSleeveLengths] = useState<string[]>([]);
  const [selectedSleeveStyles, setSelectedSleeveStyles] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);

  const handleGenderChange = (gender: 'all' | 'men' | 'women' | 'unisex') => {
    setSelectedGender(gender);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (gender === 'all') {
        url.searchParams.delete('gender');
      } else {
        url.searchParams.set('gender', gender);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Gender breakdown counts for top segmented tabs
  const genderCounts = useMemo(() => {
    const counts = { all: initialProducts.length, men: 0, women: 0, unisex: 0 };
    for (const p of initialProducts) {
      const g = resolveProductGender(p);
      if (g === 'men') counts.men += 1;
      else if (g === 'women') counts.women += 1;
      else if (g === 'unisex') counts.unisex += 1;
    }
    return counts;
  }, [initialProducts]);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('popularity');

  // Desktop Accordion expand/collapse states (default matches screenshots)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    gender: true,
    product_type: true,
    fabric: true,
    color: true,
    size: true,
    price: true,
    ratings: true,
    n_assured: true,
    shop: false,
    print_type: false,
    sleeve_length: false,
    sleeve_style: false,
    occasion: false,
    discount: false,
    origin: false,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleArrayItem = (item: string, state: string[], setter: (v: string[]) => void) => {
    setter(state.includes(item) ? state.filter((i) => i !== item) : [...state, item]);
  };

  // Extract available shops from initial products
  const availableShops = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const p of initialProducts) {
      if (p.shop?.name) {
        const id = p.shop.id || p.shop.slug || p.shop.name;
        const current = map.get(id);
        if (current) {
          current.count += 1;
        } else {
          map.set(id, { id, name: p.shop.name, count: 1 });
        }
      }
    }
    if (map.size === 0) {
      map.set('navya-collection', { id: 'navya-collection', name: 'Navya Collection', count: 11 });
    }
    return Array.from(map.values());
  }, [initialProducts]);

  // Reset all filters
  const handleClearAllFilters = () => {
    handleGenderChange('all');
    setSelectedProductTypes([]);
    setSelectedFabrics([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedPriceRanges([]);
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSelectedRatings([]);
    setIsNavyaAssuredOnly(false);
    setSelectedShops([]);
    setSelectedPrintTypes([]);
    setSelectedSleeveLengths([]);
    setSelectedSleeveStyles([]);
    setSelectedOccasions([]);
    setSelectedDiscounts([]);
    setSelectedOrigins([]);
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return (
      (selectedGender !== 'all' ? 1 : 0) +
      selectedProductTypes.length +
      selectedFabrics.length +
      selectedColors.length +
      selectedSizes.length +
      selectedPriceRanges.length +
      (customMinPrice || customMaxPrice ? 1 : 0) +
      selectedRatings.length +
      (isNavyaAssuredOnly ? 1 : 0) +
      selectedShops.length +
      selectedPrintTypes.length +
      selectedSleeveLengths.length +
      selectedSleeveStyles.length +
      selectedOccasions.length +
      selectedDiscounts.length +
      selectedOrigins.length
    );
  }, [
    selectedGender,
    selectedProductTypes,
    selectedFabrics,
    selectedColors,
    selectedSizes,
    selectedPriceRanges,
    customMinPrice,
    customMaxPrice,
    selectedRatings,
    isNavyaAssuredOnly,
    selectedShops,
    selectedPrintTypes,
    selectedSleeveLengths,
    selectedSleeveStyles,
    selectedOccasions,
    selectedDiscounts,
    selectedOrigins,
  ]);

  // Main Filtering Logic
  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    // 0. Gender Filter (Men / Women / Unisex)
    if (selectedGender !== 'all') {
      list = list.filter((p) => {
        const g = resolveProductGender(p);
        if (selectedGender === 'unisex') return g === 'unisex';
        return g === selectedGender || g === 'unisex';
      });
    }

    // 1. Product Type
    if (selectedProductTypes.length > 0) {
      list = list.filter((p) => {
        const text =
          `${p.name || ''} ${p.description || ''} ${p.category?.name || ''} ${p.category?.slug || ''} ${p.categoryName || ''}`.toLowerCase();
        return selectedProductTypes.some((type) => {
          if (type === 'shirts')
            return text.includes('shirt') && !text.includes('t-shirt') && !text.includes('tshirt');
          if (type === 'tshirts')
            return text.includes('t-shirt') || text.includes('tshirt') || text.includes('tee');
          if (type === 'kurtas') return text.includes('kurta') || text.includes('kurti');
          if (type === 'jeans') return text.includes('jean') || text.includes('denim');
          if (type === 'trousers') return text.includes('trouser') || text.includes('pant');
          if (type === 'jackets')
            return text.includes('jacket') || text.includes('blazer') || text.includes('coat');
          if (type === 'innerwear') return text.includes('inner') || text.includes('thermal');
          if (type === 'ethnic_wear')
            return (
              text.includes('ethnic') ||
              text.includes('lehenga') ||
              text.includes('saree') ||
              text.includes('sherwani')
            );
          // Footwear product types
          if (type === 'sneakers') return text.includes('sneaker') || text.includes('casual shoe');
          if (type === 'sports_shoes')
            return text.includes('sport') || text.includes('running') || text.includes('walking');
          if (type === 'formal_shoes')
            return text.includes('formal') || text.includes('oxford') || text.includes('derby');
          if (type === 'loafers') return text.includes('loafer') || text.includes('moccasin');
          if (type === 'heels')
            return text.includes('heel') || text.includes('wedge') || text.includes('stiletto');
          if (type === 'flats') return text.includes('flat') || text.includes('ballerina');
          if (type === 'juttis')
            return (
              text.includes('jutti') ||
              text.includes('mojari') ||
              text.includes('kolhapuri') ||
              text.includes('ethnic-footwear')
            );
          if (type === 'sandals')
            return (
              text.includes('sandal') ||
              text.includes('floater') ||
              text.includes('slipper') ||
              text.includes('flip-flop') ||
              text.includes('slider')
            );
          if (type === 'boots') return text.includes('boot');
          // Accessories product types
          if (type === 'bags')
            return (
              text.includes('handbag') ||
              text.includes('tote') ||
              text.includes('shoulder bag') ||
              text.includes('women-bags')
            );
          if (type === 'clutches')
            return text.includes('clutch') || text.includes('potli') || text.includes('sling');
          if (type === 'jewellery')
            return (
              text.includes('jewellery') ||
              text.includes('jewelry') ||
              text.includes('earring') ||
              text.includes('jhumka') ||
              text.includes('necklace') ||
              text.includes('bangle')
            );
          if (type === 'watches') return text.includes('watch');
          if (type === 'wallets') return text.includes('wallet') || text.includes('cardholder');
          if (type === 'belts') return text.includes('belt') || text.includes('kamarbandh');
          if (type === 'sunglasses') return text.includes('sunglass') || text.includes('eyewear');
          if (type === 'scarves')
            return text.includes('scarf') || text.includes('stole') || text.includes('dupatta');
          if (type === 'backpacks')
            return (
              text.includes('backpack') || text.includes('duffle') || text.includes('travel bag')
            );
          if (type === 'hair_caps')
            return (
              text.includes('cap') ||
              text.includes('hat') ||
              text.includes('tie') ||
              text.includes('cufflink') ||
              text.includes('hair') ||
              text.includes('groom')
            );
          return text.includes(type);
        });
      });
    }

    // 2. Fabric / Material
    if (selectedFabrics.length > 0) {
      list = list.filter((p) => {
        const text = `${p.fabric || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
        return selectedFabrics.some((f) => {
          if (f === 'cotton_blend') return text.includes('blend') || text.includes('poly cotton');
          return text.includes(f);
        });
      });
    }

    // 3. Colors
    if (selectedColors.length > 0) {
      list = list.filter((p) => {
        const prodColor = (p.color || '').toLowerCase();
        const variantColors = (p.variants || []).map((v: any) => (v.color || '').toLowerCase());
        const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        return selectedColors.some((clr) => {
          return (
            prodColor.includes(clr) ||
            variantColors.some((vc: string) => vc.includes(clr)) ||
            text.includes(clr)
          );
        });
      });
    }

    // 4. Sizes
    if (selectedSizes.length > 0) {
      list = list.filter((p) => {
        const variantSizes = (p.variants || []).map((v: any) => (v.size || '').toLowerCase());
        const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        return selectedSizes.some((sz) => {
          const szLower = sz.toLowerCase();
          return (
            variantSizes.includes(szLower) ||
            text.includes(`size ${szLower}`) ||
            text.includes(szLower)
          );
        });
      });
    }

    // 5. Price Ranges & Custom Min/Max
    if (selectedPriceRanges.length > 0) {
      list = list.filter((p) => {
        const pPrice = Number(p.price || 0);
        return selectedPriceRanges.some((rId) => {
          const rangeObj = PRICE_RANGES.find((r) => r.id === rId);
          if (!rangeObj) return true;
          return pPrice >= rangeObj.min && pPrice <= rangeObj.max;
        });
      });
    }
    if (customMinPrice) {
      const minP = parseFloat(customMinPrice);
      if (!isNaN(minP)) list = list.filter((p) => Number(p.price || 0) >= minP);
    }
    if (customMaxPrice) {
      const maxP = parseFloat(customMaxPrice);
      if (!isNaN(maxP)) list = list.filter((p) => Number(p.price || 0) <= maxP);
    }

    // 6. Customer Ratings
    if (selectedRatings.length > 0) {
      const minSelectedRating = Math.min(
        ...selectedRatings.map((rId) => RATING_OPTIONS.find((r) => r.id === rId)?.minRating || 4.0),
      );
      list = list.filter((p) => (Number(p.rating) || 0) >= minSelectedRating);
    }

    // 7. Navya Assured (Verified boutique / quality certified)
    if (isNavyaAssuredOnly) {
      list = list.filter((p) =>
        Boolean(
          p.isNavyaAssured ||
          p.shop?.verificationBadge ||
          p.shop?.name === 'NAVYA COLLECTION' ||
          (Number(p.rating) || 0) >= 4.2,
        ),
      );
    }

    // 8. Shop / Boutique
    if (selectedShops.length > 0) {
      list = list.filter((p) => {
        const shopId = p.shop?.id || p.shop?.slug || p.shop?.name;
        return selectedShops.includes(shopId);
      });
    }

    // 9. Print Types
    if (selectedPrintTypes.length > 0) {
      list = list.filter((p) => {
        const text =
          `${p.name || ''} ${p.description || ''} ${p.metaKeywords || ''} ${p.fabric || ''}`.toLowerCase();
        return selectedPrintTypes.some((type) => {
          if (type === 'block_print') return text.includes('block') || text.includes('bagru');
          if (type === 'bandhani') return text.includes('bandhani') || text.includes('tie-dye');
          if (type === 'embroidered') return text.includes('embroid') || text.includes('zari');
          if (type === 'solid') return text.includes('solid') || text.includes('plain');
          if (type === 'floral') return text.includes('floral') || text.includes('flower');
          if (type === 'geometric') return text.includes('geometric') || text.includes('ikat');
          if (type === 'striped') return text.includes('stripe') || text.includes('lined');
          return text.includes(type);
        });
      });
    }

    // 10. Sleeve Lengths & Styles
    if (selectedSleeveLengths.length > 0) {
      list = list.filter((p) => {
        const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        return selectedSleeveLengths.some((slv) => {
          if (slv === 'full') return text.includes('full sleeve') || text.includes('long sleeve');
          if (slv === 'half') return text.includes('half sleeve') || text.includes('short sleeve');
          if (slv === 'sleeveless') return text.includes('sleeveless');
          return text.includes(slv);
        });
      });
    }

    // 11. Discounts
    if (selectedDiscounts.length > 0) {
      const minRequiredDiscount = Math.min(
        ...selectedDiscounts.map(
          (dId) => DISCOUNT_OPTIONS.find((d) => d.id === dId)?.minDiscount || 10,
        ),
      );
      list = list.filter((p) => {
        const compareAt = Number(p.compareAtPrice || 0);
        const curPrice = Number(p.price || 0);
        if (compareAt > curPrice) {
          const discount = Math.round(((compareAt - curPrice) / compareAt) * 100);
          return discount >= minRequiredDiscount;
        }
        return false;
      });
    }

    // 12. Occasion
    if (selectedOccasions.length > 0) {
      list = list.filter((p) => {
        const text = `${p.occasion || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
        return selectedOccasions.some((occ) => text.includes(occ));
      });
    }

    // 13. Country of Origin
    if (selectedOrigins.length > 0) {
      list = list.filter((p) => {
        const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        if (selectedOrigins.includes('imported')) return text.includes('imported');
        if (selectedOrigins.includes('handcrafted'))
          return text.includes('handcraft') || text.includes('artisan') || text.includes('khadi');
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'discount') {
        const discA = a.compareAtPrice
          ? ((a.compareAtPrice - a.price) / a.compareAtPrice) * 100
          : 0;
        const discB = b.compareAtPrice
          ? ((b.compareAtPrice - b.price) / b.compareAtPrice) * 100
          : 0;
        return discB - discA;
      }
      return 0;
    });

    return list;
  }, [
    initialProducts,
    selectedGender,
    selectedProductTypes,
    selectedFabrics,
    selectedColors,
    selectedSizes,
    selectedPriceRanges,
    customMinPrice,
    customMaxPrice,
    selectedRatings,
    isNavyaAssuredOnly,
    selectedShops,
    selectedPrintTypes,
    selectedSleeveLengths,
    selectedDiscounts,
    selectedOccasions,
    selectedOrigins,
    sortBy,
  ]);

  // Mobile drawer categories tab list (context-aware: hides sleeve length on Footwear & Accessories)
  const MOBILE_FILTER_TABS = [
    ...(showGenderFilter
      ? [{ id: 'gender', label: 'Gender (Men/Women)', count: selectedGender !== 'all' ? 1 : 0 }]
      : []),
    { id: 'product_type', label: 'Product Type', count: selectedProductTypes.length },
    {
      id: 'fabric',
      label: isFootwearCategory || isAccessoriesCategory ? 'Material' : 'Fabric / Material',
      count: selectedFabrics.length,
    },
    { id: 'color', label: 'Color', count: selectedColors.length },
    {
      id: 'size',
      label: isFootwearCategory ? 'UK Shoe Size' : 'Size',
      count: selectedSizes.length,
    },
    {
      id: 'price',
      label: 'Price',
      count: selectedPriceRanges.length + (customMinPrice || customMaxPrice ? 1 : 0),
    },
    { id: 'ratings', label: 'Customer Ratings', count: selectedRatings.length },
    { id: 'n_assured', label: 'JiivaaKart Assured', count: isNavyaAssuredOnly ? 1 : 0 },
    { id: 'shop', label: 'Boutique Store', count: selectedShops.length },
    ...(!isFootwearCategory && !isAccessoriesCategory
      ? [
          { id: 'print_type', label: 'Print Type', count: selectedPrintTypes.length },
          { id: 'sleeve_length', label: 'Sleeve Length', count: selectedSleeveLengths.length },
        ]
      : []),
    { id: 'occasion', label: 'Occasion', count: selectedOccasions.length },
    { id: 'discount', label: 'Discount %', count: selectedDiscounts.length },
    { id: 'origin', label: 'Country Of Origin', count: selectedOrigins.length },
  ];

  // Visual Sub-Category Showcase filtered by active Gender (Men / Women / All)
  const visibleShowcaseSubcats = useMemo(() => {
    const source = isFootwearCategory
      ? FOOTWEAR_SUBCAT_SHOWCASE
      : isAccessoriesCategory
        ? ACCESSORIES_SUBCAT_SHOWCASE
        : [];
    if (selectedGender === 'men' || selectedGender === 'women') {
      return source.filter((item) => item.gender === selectedGender);
    }
    return source;
  }, [isFootwearCategory, isAccessoriesCategory, selectedGender]);

  // Reusable Gender Switcher + Visual Sub-Category Strip for Footwear & Accessories
  const genderAndSubcatStrip = showGenderFilter ? (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Shop For:
          </span>
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1">
            {(
              [
                { id: 'all', label: 'All', count: genderCounts.all },
                { id: 'men', label: 'Men', count: genderCounts.men },
                { id: 'women', label: 'Women', count: genderCounts.women },
                { id: 'unisex', label: 'Unisex', count: genderCounts.unisex },
              ] as const
            ).map((opt) => {
              const isActive = selectedGender === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleGenderChange(opt.id)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-navy text-white shadow-xs'
                      : 'text-slate-600 hover:text-navy hover:bg-white/70'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-[11px] font-semibold text-slate-500">
          {selectedGender === 'all'
            ? `Showing Men & Women ${isFootwearCategory ? 'Footwear' : isAccessoriesCategory ? 'Accessories' : 'Styles'}`
            : `Filtered for ${selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}`}
        </span>
      </div>

      {/* Gender-Filtered Visual Sub-Category Strip (Footwear & Accessories) */}
      {visibleShowcaseSubcats.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {visibleShowcaseSubcats.map((item) => {
            const isActive = item.slug === slugLower;
            return (
              <Link
                key={item.slug}
                href={`/category/${item.slug}`}
                className={`group flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full border shrink-0 transition-all ${
                  isActive
                    ? 'bg-navy text-white border-navy shadow-xs'
                    : 'bg-slate-50 hover:bg-orange-50/70 text-slate-800 border-slate-200 hover:border-orange'
                }`}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight whitespace-nowrap">
                    {item.name}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-wider ${
                      isActive ? 'text-orange-300' : 'text-slate-400 group-hover:text-orange'
                    }`}
                  >
                    {item.gender === 'men' ? "Men's" : "Women's"}
                    {item.badge ? ` • ${item.badge}` : ''}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  ) : null;

  if (initialProducts.length === 0) {
    return (
      <div className="space-y-6">
        {genderAndSubcatStrip}
        <div className="space-y-8 max-w-5xl mx-auto py-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-navy via-[#1e3a6c] to-[#0f2142] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-white/10 text-center space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-widest shadow-xs">
              <Sparkles className="w-4 h-4 text-orange animate-pulse" />
              <span>Curated Boutique Collection</span>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
                {selectedGender !== 'all'
                  ? `${selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}'s ${category.name}`
                  : category.name}{' '}
                Arrivals Landing Soon
              </h2>
              <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed font-medium">
                Verified boutique designers and regional artisans are currently preparing
                handcrafted, exclusive season releases for{' '}
                <strong className="text-white font-bold">{category.name}</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/category/women-sarees"
                className="px-5 py-2.5 rounded-full bg-white text-navy font-extrabold text-xs shadow-md hover:bg-slate-100 transition-all hover:scale-105"
              >
                Explore Festive Sarees
              </Link>
              <Link
                href="/category/women-lehengas"
                className="px-5 py-2.5 rounded-full bg-white/15 text-white border border-white/30 font-bold text-xs hover:bg-white/25 transition-all"
              >
                Explore Designer Lehengas
              </Link>
              <Link
                href="/category/men-shirts"
                className="px-5 py-2.5 rounded-full bg-white/15 text-white border border-white/30 font-bold text-xs hover:bg-white/25 transition-all"
              >
                Explore Men&apos;s Shirts
              </Link>
              <Link
                href="/category"
                className="px-5 py-2.5 rounded-full bg-orange text-white font-extrabold text-xs shadow-md shadow-orange/20 hover:bg-orange/90 transition-all"
              >
                Browse All Categories
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/10 via-orange/10 to-amber-500/10 border border-amber-300/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange bg-orange/10 px-3 py-1 rounded-full">
                Boutique Merchants Wanted
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-navy font-heading">
                Are you a boutique seller or designer in {category.name}?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Partner with JiivaaKart to showcase your collections to thousands of fashion
                shoppers across India. Enjoy 0% listing fee, pan-India express courier pickup, and
                guaranteed weekly payouts.
              </p>
            </div>
            <Link
              href="/become-seller"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-orange hover:bg-[#d94817] text-white text-xs font-black rounded-2xl shadow-lg shrink-0 transition-all hover:scale-105"
            >
              <span>Register as a Seller</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Gender Quick Switcher (All | Men | Women | Unisex) & Visual Sub-Categories */}
      {genderAndSubcatStrip}

      {/* Top Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 bg-orange text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="h-4.5 w-4.5 rounded-full bg-white text-orange text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Showing <strong className="text-navy">{filteredProducts.length}</strong> products
            {activeFilterCount > 0 && (
              <span className="text-orange font-bold"> ({activeFilterCount} active filters)</span>
            )}
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">
            Sort By:
          </span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-navy outline-none cursor-pointer shadow-2xs focus:ring-2 focus:ring-navy/20"
            >
              <option value="popularity">Popularity / Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Customer Rating (Highest)</option>
              <option value="newest">Newest First</option>
              <option value="discount">Biggest Discount %</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-orange-50/70 border border-orange-200/80 rounded-2xl">
          <span className="text-xs font-black text-orange flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-orange" /> Active Filters ({activeFilterCount}):
          </span>

          {selectedGender !== 'all' && (
            <button
              onClick={() => handleGenderChange('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-navy text-white font-bold text-[11px] rounded-full shadow-2xs hover:bg-navy/90 transition-colors cursor-pointer"
            >
              <span>
                Gender: {selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}
              </span>
              <X className="w-3 h-3 text-orange-300" />
            </button>
          )}

          {selectedProductTypes.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedProductTypes, setSelectedProductTypes)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-orange-200 shadow-2xs hover:bg-orange-100/50 transition-colors cursor-pointer"
            >
              <span>Type: {PRODUCT_TYPE_OPTIONS.find((p) => p.id === id)?.label || id}</span>
              <X className="w-3 h-3 text-orange" />
            </button>
          ))}

          {selectedFabrics.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedFabrics, setSelectedFabrics)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-orange-200 shadow-2xs hover:bg-orange-100/50 transition-colors cursor-pointer"
            >
              <span>Fabric: {FABRIC_OPTIONS.find((f) => f.id === id)?.label || id}</span>
              <X className="w-3 h-3 text-orange" />
            </button>
          ))}

          {selectedColors.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedColors, setSelectedColors)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-orange-200 shadow-2xs hover:bg-orange-100/50 transition-colors cursor-pointer"
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300"
                style={{ background: COLOR_OPTIONS.find((c) => c.id === id)?.hex || id }}
              />
              <span>Color: {COLOR_OPTIONS.find((c) => c.id === id)?.label || id}</span>
              <X className="w-3 h-3 text-orange" />
            </button>
          ))}

          {selectedSizes.map((sz) => (
            <button
              key={sz}
              onClick={() => toggleArrayItem(sz, selectedSizes, setSelectedSizes)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-orange-200 shadow-2xs hover:bg-orange-100/50 transition-colors cursor-pointer"
            >
              <span>Size: {sz}</span>
              <X className="w-3 h-3 text-orange" />
            </button>
          ))}

          {selectedRatings.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedRatings, setSelectedRatings)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-orange-200 shadow-2xs hover:bg-orange-100/50 transition-colors cursor-pointer"
            >
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{RATING_OPTIONS.find((r) => r.id === id)?.label || id}</span>
              <X className="w-3 h-3 text-orange" />
            </button>
          ))}

          {isNavyaAssuredOnly && (
            <button
              onClick={() => setIsNavyaAssuredOnly(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-full border border-emerald-300 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Navya Assured</span>
              <X className="w-3 h-3 text-emerald-600" />
            </button>
          )}

          {selectedShops.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedShops, setSelectedShops)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-orange-200 shadow-2xs hover:bg-orange-100/50 transition-colors cursor-pointer"
            >
              <Store className="w-3 h-3 text-orange" />
              <span>Shop: {availableShops.find((s) => s.id === id)?.name || id}</span>
              <X className="w-3 h-3 text-orange" />
            </button>
          ))}

          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs font-black text-orange hover:text-[#d94817] underline underline-offset-2 ml-auto shrink-0 cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* Main Dual-Layout: Desktop Left Filter Sidebar + Right Products Grid */}
      <div className="flex items-start gap-6 lg:gap-8">
        {/* DESKTOP FILTER SIDEBAR (Matching User's Reference Screenshots 1 & 4) */}
        <aside className="hidden lg:block w-80 shrink-0 select-none">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto space-y-5 scrollbar-thin">
            {/* Header: Filters + Subtitle + Clear All */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange shrink-0">
                    <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-navy tracking-tight leading-none">
                      Filters
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Find your perfect match
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:text-[#d94817] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Pill: 3 Filters Applied > (Reference UI Image 4) */}
              {activeFilterCount > 0 && (
                <div className="mt-3 flex items-center justify-between bg-orange-50/90 border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange text-white text-[11px] font-black flex items-center justify-center shadow-2xs">
                      {activeFilterCount}
                    </span>
                    <span className="text-navy font-bold">Filters Applied</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-orange" />
                </div>
              )}
            </div>

            {/* 0. GENDER FILTER (Footwear, Accessories & Mixed Hubs) */}
            {showGenderFilter && (
              <div className="border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => toggleSection('gender')}
                  className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                      Gender
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSections.gender ? 'rotate-180 text-navy' : ''
                    }`}
                  />
                </button>

                {expandedSections.gender && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'all', label: 'All', count: genderCounts.all },
                        { id: 'men', label: 'Men', count: genderCounts.men },
                        { id: 'women', label: 'Women', count: genderCounts.women },
                        { id: 'unisex', label: 'Unisex', count: genderCounts.unisex },
                      ] as const
                    ).map((opt) => {
                      const active = selectedGender === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleGenderChange(opt.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-navy text-white border-navy shadow-xs'
                              : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:border-orange hover:text-orange'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`text-[10px] font-extrabold ${
                              active ? 'text-orange-300' : 'text-slate-400'
                            }`}
                          >
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 1. PRODUCT TYPE (Reference UI Image 1 & 4) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('product_type')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Shirt className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Product Type
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.product_type ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.product_type && (
                <div className="mt-3 space-y-2.5">
                  {/* View Mode Toggle: Grid Cards vs List */}
                  <div className="flex items-center justify-end gap-1 pb-1">
                    <button
                      type="button"
                      onClick={() => setProductTypeViewMode('cards')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        productTypeViewMode === 'cards'
                          ? 'bg-orange text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductTypeViewMode('list')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        productTypeViewMode === 'list'
                          ? 'bg-orange text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      List
                    </button>
                  </div>

                  {productTypeViewMode === 'cards' ? (
                    /* 2x4 Visual Cards Grid (Matching User Screenshot 4) */
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCT_TYPE_OPTIONS.map((pt) => {
                        const active = selectedProductTypes.includes(pt.id);
                        const IconComp = pt.icon;
                        return (
                          <button
                            key={pt.id}
                            type="button"
                            onClick={() =>
                              toggleArrayItem(pt.id, selectedProductTypes, setSelectedProductTypes)
                            }
                            className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center cursor-pointer ${
                              active
                                ? 'border-orange bg-orange-50/50 ring-1 ring-orange/40 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            {active && (
                              <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-orange text-white flex items-center justify-center shadow-xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                                active
                                  ? 'bg-white text-orange shadow-xs'
                                  : 'bg-slate-50 text-slate-600'
                              }`}
                            >
                              <IconComp className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-navy truncate max-w-full">
                              {pt.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({pt.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Clean List Mode with Custom Checkboxes & Counts (Matching User Screenshot 1) */
                    <div className="space-y-1">
                      {PRODUCT_TYPE_OPTIONS.map((pt) => {
                        const checked = selectedProductTypes.includes(pt.id);
                        return (
                          <label
                            key={pt.id}
                            onClick={() =>
                              toggleArrayItem(pt.id, selectedProductTypes, setSelectedProductTypes)
                            }
                            className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                              checked
                                ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                  checked
                                    ? 'bg-orange border-orange text-white shadow-xs'
                                    : 'border-slate-300 bg-white group-hover:border-orange'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span
                                className={`text-xs truncate ${
                                  checked ? 'font-bold text-navy' : 'font-medium'
                                }`}
                              >
                                {pt.sublabel || pt.label}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium shrink-0">
                              ({pt.count})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. FABRIC / MATERIAL (Reference UI Image 4) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('fabric')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Fabric / Material
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.fabric ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.fabric && (
                <div className="mt-2.5 space-y-1">
                  {(showAllFabrics ? FABRIC_OPTIONS : FABRIC_OPTIONS.slice(0, 6)).map((fo) => {
                    const checked = selectedFabrics.includes(fo.id);
                    return (
                      <label
                        key={fo.id}
                        onClick={() => toggleArrayItem(fo.id, selectedFabrics, setSelectedFabrics)}
                        className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                          checked
                            ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              checked
                                ? 'bg-orange border-orange text-white shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-orange'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              checked ? 'font-bold text-navy' : 'font-medium'
                            }`}
                          >
                            {fo.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          ({fo.count})
                        </span>
                      </label>
                    );
                  })}

                  {FABRIC_OPTIONS.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllFabrics(!showAllFabrics)}
                      className="text-xs font-bold text-orange hover:text-[#d94817] pt-1 flex items-center gap-1 cursor-pointer pl-1"
                    >
                      <span>
                        {showAllFabrics
                          ? '- Show less'
                          : `+ Show ${FABRIC_OPTIONS.length - 6} more`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          showAllFabrics ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. COLOR (Reference UI Image 4: 5-columns color swatch cards) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('color')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Palette className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Color
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.color ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.color && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map((co) => {
                    const active = selectedColors.includes(co.id);
                    return (
                      <button
                        key={co.id}
                        type="button"
                        onClick={() => toggleArrayItem(co.id, selectedColors, setSelectedColors)}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center cursor-pointer ${
                          active
                            ? 'border-orange bg-orange-50/50 ring-1 ring-orange/40 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        title={co.label}
                      >
                        {active && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <span
                          className="w-5 h-5 rounded-full border border-slate-200/90 shadow-2xs mb-1"
                          style={{ background: co.hex }}
                        />
                        <span className="text-[10px] font-bold text-slate-700 truncate max-w-full">
                          {co.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. SIZE (Reference UI Image 4: horizontal pill buttons) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('size')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Ruler className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Size
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.size ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.size && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((sz) => {
                    const active = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleArrayItem(sz, selectedSizes, setSelectedSizes)}
                        className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                          active
                            ? 'border-orange text-orange bg-orange-50/70 shadow-xs ring-1 ring-orange/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. PRICE (Reference UI Image 1: Min/Max inputs + track slider + presets) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('price')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <IndianRupee className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Price
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.price ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.price && (
                <div className="mt-3 space-y-3.5">
                  {/* Min Price & Max Price Input Boxes */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        Min Price
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          placeholder="500"
                          value={customMinPrice}
                          onChange={(e) => setCustomMinPrice(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy outline-none focus:border-orange focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        Max Price
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          placeholder="2000"
                          value={customMaxPrice}
                          onChange={(e) => setCustomMaxPrice(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy outline-none focus:border-orange focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interactive Slider Track with Milestones */}
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="100"
                      value={customMaxPrice ? Number(customMaxPrice) : 2000}
                      onChange={(e) => setCustomMaxPrice(e.target.value)}
                      className="w-full accent-[#F15A25] cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-0.5">
                      {PRICE_MILESTONES.map((m) => (
                        <button
                          key={m.label}
                          type="button"
                          onClick={() => {
                            setCustomMinPrice(
                              m.value > 0 ? String(Math.max(0, m.value - 500)) : '0',
                            );
                            setCustomMaxPrice(String(m.value));
                          }}
                          className="hover:text-orange transition-colors cursor-pointer"
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Price Ranges Checkboxes */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    {PRICE_RANGES.map((pr) => {
                      const checked = selectedPriceRanges.includes(pr.id);
                      return (
                        <label
                          key={pr.id}
                          onClick={() =>
                            toggleArrayItem(pr.id, selectedPriceRanges, setSelectedPriceRanges)
                          }
                          className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                            checked
                              ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                checked
                                  ? 'bg-orange border-orange text-white shadow-xs'
                                  : 'border-slate-300 bg-white group-hover:border-orange'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span
                              className={`text-xs truncate ${
                                checked ? 'font-bold text-navy' : 'font-medium'
                              }`}
                            >
                              {pr.label}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 6. CUSTOMER RATINGS (Reference UI Image 1: golden star rows with counts) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('ratings')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Star className="w-3.5 h-3.5 fill-[#F15A25]" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Customer Ratings
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.ratings ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.ratings && (
                <div className="mt-2.5 space-y-1">
                  {RATING_OPTIONS.map((ro) => {
                    const checked = selectedRatings.includes(ro.id);
                    return (
                      <label
                        key={ro.id}
                        onClick={() => toggleArrayItem(ro.id, selectedRatings, setSelectedRatings)}
                        className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                          checked
                            ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              checked
                                ? 'bg-orange border-orange text-white shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-orange'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {renderStarRating(ro.stars)}
                            <span
                              className={`text-xs ${
                                checked ? 'font-bold text-navy' : 'font-medium text-slate-700'
                              }`}
                            >
                              {ro.label}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          ({ro.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 7. NAVYA ASSURED (Reference UI Image 1 & 4: Emerald Shield + Quality Checked Badge) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('n_assured')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-emerald-700 transition-colors">
                    Navya Assured
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.n_assured ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.n_assured && (
                <div className="mt-3">
                  <div
                    onClick={() => setIsNavyaAssuredOnly(!isNavyaAssuredOnly)}
                    className={`border rounded-2xl p-3.5 space-y-2.5 transition-all cursor-pointer ${
                      isNavyaAssuredOnly
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-emerald-50/20 border-emerald-200/80 hover:bg-emerald-50/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-4.5 h-4.5 rounded-md border mt-0.5 flex items-center justify-center transition-all shrink-0 ${
                          isNavyaAssuredOnly
                            ? 'bg-orange border-orange text-white shadow-xs'
                            : 'border-emerald-300 bg-white'
                        }`}
                      >
                        {isNavyaAssuredOnly && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-navy tracking-tight">
                            Navya Assured
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">(420)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                          Top-rated boutiques with verified quality & priority dispatch
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                      <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        100% Quality Checked
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide shadow-2xs">
                        ✓ ASSURED
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 8. BOUTIQUE / SHOP FILTER (Reference UI Image 1: Shop / Store) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('shop')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Shop / Store
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.shop ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.shop && (
                <div className="mt-2.5 space-y-1">
                  {availableShops.map((shop) => {
                    const checked = selectedShops.includes(shop.id);
                    return (
                      <label
                        key={shop.id}
                        onClick={() => toggleArrayItem(shop.id, selectedShops, setSelectedShops)}
                        className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                          checked
                            ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              checked
                                ? 'bg-orange border-orange text-white shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-orange'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              checked ? 'font-bold text-navy' : 'font-medium'
                            }`}
                          >
                            {shop.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          ({shop.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 9. OCCASION & STYLE (Reference UI Image 4) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('occasion')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Occasion
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.occasion ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.occasion && (
                <div className="mt-2.5 space-y-1">
                  {OCCASION_OPTIONS.map((occ) => {
                    const checked = selectedOccasions.includes(occ.id);
                    return (
                      <label
                        key={occ.id}
                        onClick={() =>
                          toggleArrayItem(occ.id, selectedOccasions, setSelectedOccasions)
                        }
                        className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                          checked
                            ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              checked
                                ? 'bg-orange border-orange text-white shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-orange'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              checked ? 'font-bold text-navy' : 'font-medium'
                            }`}
                          >
                            {occ.label}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 10. DISCOUNT (Reference UI Image 1) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('discount')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Discount
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.discount ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.discount && (
                <div className="mt-2.5 space-y-1">
                  {DISCOUNT_OPTIONS.map((doItem) => {
                    const checked = selectedDiscounts.includes(doItem.id);
                    return (
                      <label
                        key={doItem.id}
                        onClick={() =>
                          toggleArrayItem(doItem.id, selectedDiscounts, setSelectedDiscounts)
                        }
                        className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                          checked
                            ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              checked
                                ? 'bg-orange border-orange text-white shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-orange'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              checked ? 'font-bold text-orange' : 'font-medium'
                            }`}
                          >
                            {doItem.label}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 11. PRINT TYPE (Reference UI Image 1) */}
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection('print_type')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Print Type
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.print_type ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.print_type && (
                <div className="mt-2.5 space-y-1 max-h-48 overflow-y-auto pr-1">
                  {PRINT_TYPES.map((pt) => {
                    const checked = selectedPrintTypes.includes(pt.id);
                    return (
                      <label
                        key={pt.id}
                        onClick={() =>
                          toggleArrayItem(pt.id, selectedPrintTypes, setSelectedPrintTypes)
                        }
                        className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                          checked
                            ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              checked
                                ? 'bg-orange border-orange text-white shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-orange'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              checked ? 'font-bold text-navy' : 'font-medium'
                            }`}
                          >
                            {pt.label}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 12. COUNTRY OF ORIGIN */}
            <div className="pb-1">
              <button
                type="button"
                onClick={() => toggleSection('origin')}
                className="w-full flex items-center justify-between text-left cursor-pointer group py-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 text-orange flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-navy tracking-tight group-hover:text-orange transition-colors">
                    Country of Origin
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedSections.origin ? 'rotate-180 text-navy' : ''
                  }`}
                />
              </button>

              {expandedSections.origin && (
                <div className="mt-2.5 space-y-1">
                  {COUNTRY_OPTIONS.map((co) => {
                    const checked = selectedOrigins.includes(co.id);
                    return (
                      <label
                        key={co.id}
                        onClick={() => toggleArrayItem(co.id, selectedOrigins, setSelectedOrigins)}
                        className={`group flex items-center justify-between gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer transition-all ${
                          checked
                            ? 'bg-orange-50/70 border border-orange-200/80 text-navy font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              checked
                                ? 'bg-orange border-orange text-white shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-orange'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              checked ? 'font-bold text-navy' : 'font-medium'
                            }`}
                          >
                            {co.label}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT PRODUCT GRID CONTAINER */}
        <main className="flex-1 min-w-0">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-14 text-center space-y-4 shadow-xs my-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange font-bold mx-auto shadow-xs">
                <ShoppingBag className="w-7 h-7 text-orange" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-extrabold text-navy">
                  No matching products found
                </h3>
                <p className="text-xs text-slate-500">
                  Try clearing some filters (like Product Type, Fabric, Price or Ratings) to view
                  more boutique couture.
                </p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange hover:bg-[#d94817] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE FULL-SCREEN DUAL-PANE FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Mobile Filter Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="flex items-center gap-2 text-navy font-black text-sm cursor-pointer"
            >
              <span className="text-lg">←</span>
              <span>Filters</span>
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-bold text-orange underline cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Dual-Pane Filter Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Rail Categories */}
            <div className="w-36 sm:w-44 bg-slate-100/90 border-r border-slate-200 overflow-y-auto select-none">
              {MOBILE_FILTER_TABS.map((tab) => {
                const isActive = mobileActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMobileActiveTab(tab.id)}
                    className={`w-full text-left p-3.5 text-xs transition-colors flex items-center justify-between cursor-pointer border-b border-slate-200/50 ${
                      isActive
                        ? 'bg-white text-navy font-black border-l-4 border-l-[#F15A25]'
                        : 'text-slate-600 hover:bg-slate-200/60 font-semibold'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="h-4 w-4 rounded-full bg-orange text-white text-[9px] font-black flex items-center justify-center shrink-0 ml-1">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Pane Filter Options */}
            <div className="flex-1 bg-white p-4 overflow-y-auto">
              {/* 0. GENDER */}
              {mobileActiveTab === 'gender' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Shop By Gender
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        { id: 'all', label: 'All (Men & Women)', count: genderCounts.all },
                        { id: 'men', label: 'Men', count: genderCounts.men },
                        { id: 'women', label: 'Women', count: genderCounts.women },
                        { id: 'unisex', label: 'Unisex', count: genderCounts.unisex },
                      ] as const
                    ).map((opt) => {
                      const active = selectedGender === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleGenderChange(opt.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? 'bg-navy text-white border-navy shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span className={active ? 'text-orange-300' : 'text-slate-400'}>
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1. PRODUCT TYPE */}
              {mobileActiveTab === 'product_type' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Select Product Type
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {PRODUCT_TYPE_OPTIONS.map((pt) => {
                      const active = selectedProductTypes.includes(pt.id);
                      const IconComp = pt.icon;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() =>
                            toggleArrayItem(pt.id, selectedProductTypes, setSelectedProductTypes)
                          }
                          className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center ${
                            active
                              ? 'border-orange bg-orange-50/50 ring-1 ring-orange/40 shadow-xs'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          {active && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                          <IconComp className="w-4 h-4 text-slate-600 mb-1" />
                          <span className="text-xs font-bold text-navy">{pt.label}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({pt.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. FABRIC */}
              {mobileActiveTab === 'fabric' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Fabric / Material
                  </h4>
                  {FABRIC_OPTIONS.map((fo) => {
                    const checked = selectedFabrics.includes(fo.id);
                    return (
                      <label
                        key={fo.id}
                        onClick={() => toggleArrayItem(fo.id, selectedFabrics, setSelectedFabrics)}
                        className="flex items-center justify-between py-1.5 cursor-pointer"
                      >
                        <span
                          className={`text-xs ${checked ? 'font-bold text-navy' : 'text-slate-700'}`}
                        >
                          {fo.label}
                        </span>
                        <span className="text-[11px] text-slate-400">({fo.count})</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 3. COLOR */}
              {mobileActiveTab === 'color' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Select Colors
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_OPTIONS.map((co) => {
                      const active = selectedColors.includes(co.id);
                      return (
                        <button
                          key={co.id}
                          type="button"
                          onClick={() => toggleArrayItem(co.id, selectedColors, setSelectedColors)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center ${
                            active
                              ? 'border-orange bg-orange-50/50 ring-1 ring-orange'
                              : 'border-slate-200'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 mb-1"
                            style={{ background: co.hex }}
                          />
                          <span className="text-[10px] font-bold text-slate-700">{co.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. SIZE */}
              {mobileActiveTab === 'size' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Select Sizes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((sz) => {
                      const active = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleArrayItem(sz, selectedSizes, setSelectedSizes)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                            active
                              ? 'border-orange bg-orange-50 text-orange'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. PRICE */}
              {mobileActiveTab === 'price' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Price Range
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={customMinPrice}
                      onChange={(e) => setCustomMinPrice(e.target.value)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={customMaxPrice}
                      onChange={(e) => setCustomMaxPrice(e.target.value)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    {PRICE_RANGES.map((pr) => {
                      const checked = selectedPriceRanges.includes(pr.id);
                      return (
                        <label
                          key={pr.id}
                          onClick={() =>
                            toggleArrayItem(pr.id, selectedPriceRanges, setSelectedPriceRanges)
                          }
                          className="flex items-center gap-2 py-1 cursor-pointer text-xs"
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              checked ? 'bg-orange border-orange text-white' : 'border-slate-300'
                            }`}
                          >
                            {checked && <Check className="w-2.5 h-2.5" />}
                          </span>
                          <span className={checked ? 'font-bold text-navy' : 'text-slate-700'}>
                            {pr.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. RATINGS */}
              {mobileActiveTab === 'ratings' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Customer Ratings
                  </h4>
                  {RATING_OPTIONS.map((ro) => {
                    const checked = selectedRatings.includes(ro.id);
                    return (
                      <label
                        key={ro.id}
                        onClick={() => toggleArrayItem(ro.id, selectedRatings, setSelectedRatings)}
                        className="flex items-center justify-between py-1.5 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {renderStarRating(ro.stars)}
                          <span className="font-bold text-slate-800">{ro.label}</span>
                        </div>
                        <span className="text-slate-400 font-medium">({ro.count})</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 7. NAVYA ASSURED */}
              {mobileActiveTab === 'n_assured' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Navya Assured Quality
                  </h4>
                  <div
                    onClick={() => setIsNavyaAssuredOnly(!isNavyaAssuredOnly)}
                    className="border border-emerald-300 bg-emerald-50/60 rounded-2xl p-4 space-y-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy">
                        Show only Navya Assured products
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                        ✓ ASSURED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Strict quality check pass, priority courier dispatch, and verified boutique
                      designs.
                    </p>
                  </div>
                </div>
              )}

              {/* 8. SHOP */}
              {mobileActiveTab === 'shop' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Boutique Partner
                  </h4>
                  {availableShops.map((shop) => {
                    const checked = selectedShops.includes(shop.id);
                    return (
                      <label
                        key={shop.id}
                        onClick={() => toggleArrayItem(shop.id, selectedShops, setSelectedShops)}
                        className="flex items-center justify-between py-1.5 cursor-pointer text-xs"
                      >
                        <span className={checked ? 'font-bold text-navy' : 'text-slate-700'}>
                          {shop.name}
                        </span>
                        <span className="text-slate-400">({shop.count})</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 9. PRINT TYPE */}
              {mobileActiveTab === 'print_type' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Print Type
                  </h4>
                  {PRINT_TYPES.map((pt) => {
                    const checked = selectedPrintTypes.includes(pt.id);
                    return (
                      <label
                        key={pt.id}
                        onClick={() =>
                          toggleArrayItem(pt.id, selectedPrintTypes, setSelectedPrintTypes)
                        }
                        className="flex items-center justify-between py-1 cursor-pointer text-xs"
                      >
                        <span className={checked ? 'font-bold text-navy' : 'text-slate-700'}>
                          {pt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 10. OCCASION */}
              {mobileActiveTab === 'occasion' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Occasion
                  </h4>
                  {OCCASION_OPTIONS.map((occ) => {
                    const checked = selectedOccasions.includes(occ.id);
                    return (
                      <label
                        key={occ.id}
                        onClick={() =>
                          toggleArrayItem(occ.id, selectedOccasions, setSelectedOccasions)
                        }
                        className="flex items-center justify-between py-1 cursor-pointer text-xs"
                      >
                        <span className={checked ? 'font-bold text-navy' : 'text-slate-700'}>
                          {occ.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 11. DISCOUNT */}
              {mobileActiveTab === 'discount' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Discount
                  </h4>
                  {DISCOUNT_OPTIONS.map((doItem) => {
                    const checked = selectedDiscounts.includes(doItem.id);
                    return (
                      <label
                        key={doItem.id}
                        onClick={() =>
                          toggleArrayItem(doItem.id, selectedDiscounts, setSelectedDiscounts)
                        }
                        className="flex items-center justify-between py-1 cursor-pointer text-xs"
                      >
                        <span className={checked ? 'font-bold text-orange' : 'text-slate-700'}>
                          {doItem.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 12. ORIGIN */}
              {mobileActiveTab === 'origin' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Country of Origin
                  </h4>
                  {COUNTRY_OPTIONS.map((co) => {
                    const checked = selectedOrigins.includes(co.id);
                    return (
                      <label
                        key={co.id}
                        onClick={() => toggleArrayItem(co.id, selectedOrigins, setSelectedOrigins)}
                        className="flex items-center justify-between py-1 cursor-pointer text-xs"
                      >
                        <span className={checked ? 'font-bold text-navy' : 'text-slate-700'}>
                          {co.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Bottom Apply Bar */}
          <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-3 shadow-lg">
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="w-1/3 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 active:bg-slate-100 cursor-pointer"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-2/3 py-3 bg-orange hover:bg-[#d94e1d] text-white rounded-xl text-xs font-black shadow-md active:scale-98 transition-transform cursor-pointer"
            >
              Apply ({filteredProducts.length} Items)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
