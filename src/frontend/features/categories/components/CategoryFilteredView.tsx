'use client';

import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  Grid,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';

import { ProductCard } from '@/frontend/features/products/components/ProductCard';

export interface CategoryFilteredViewProps {
  initialProducts: any[];
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

// 1. PRINT TYPE OPTIONS
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
  { id: 'printed', label: 'Digital Print' },
  { id: 'polka', label: 'Polka Dots' },
  { id: 'checked', label: 'Checks / Tartan' },
];

// 2. SLEEVE LENGTH OPTIONS
const SLEEVE_LENGTHS = [
  { id: 'full', label: 'Full Sleeve' },
  { id: 'three_quarter', label: '3/4th Sleeve' },
  { id: 'half', label: 'Half Sleeve' },
  { id: 'short', label: 'Short Sleeve' },
  { id: 'sleeveless', label: 'Sleeveless' },
];

// 3. SLEEVE STYLE OPTIONS
const SLEEVE_STYLES = [
  { id: 'regular', label: 'Regular Sleeves' },
  { id: 'puff', label: 'Puff Sleeves' },
  { id: 'bell', label: 'Bell Sleeves' },
  { id: 'bishop', label: 'Bishop Sleeves' },
  { id: 'rollup', label: 'Roll-Up Sleeves' },
  { id: 'cap', label: 'Cap Sleeves' },
  { id: 'cold_shoulder', label: 'Cold Shoulder' },
];

// 4. PRICE RANGE OPTIONS
const PRICE_RANGES = [
  { id: 'under_499', label: 'Under ₹499', min: 0, max: 499 },
  { id: '500_999', label: '₹500 - ₹999', min: 500, max: 999 },
  { id: '1000_1999', label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
  { id: '2000_4999', label: '₹2,000 - ₹4,999', min: 2000, max: 4999 },
  { id: 'above_5000', label: '₹5,000 & Above', min: 5000, max: 999999 },
];

// 5. RATINGS OPTIONS
const RATING_OPTIONS = [
  { id: '4_star', label: '4★ & above', minRating: 4.0 },
  { id: '3_star', label: '3★ & above', minRating: 3.0 },
  { id: '2_star', label: '2★ & above', minRating: 2.0 },
];

// 6. DISCOUNT OPTIONS
const DISCOUNT_OPTIONS = [
  { id: '50_percent', label: '50% or more', minDiscount: 50 },
  { id: '40_percent', label: '40% or more', minDiscount: 40 },
  { id: '30_percent', label: '30% or more', minDiscount: 30 },
  { id: '20_percent', label: '20% or more', minDiscount: 20 },
  { id: '10_percent', label: '10% or more', minDiscount: 10 },
];

// 7. NEW ARRIVALS OPTIONS
const NEW_ARRIVALS_OPTIONS = [
  { id: 'last_7_days', label: 'Fresh Drops (Last 7 Days)' },
  { id: 'last_30_days', label: 'New Season (Last 30 Days)' },
  { id: 'all_new', label: 'All New Arrivals' },
];

// 8. OFFERS & DEALS
const OFFERS_OPTIONS = [
  { id: 'special_price', label: 'Special Festive Price' },
  { id: 'budget_finds', label: 'Budget Deals (Under ₹999)' },
  { id: 'free_delivery', label: 'Free Delivery' },
];

// 9. COUNTRY OF ORIGIN
const COUNTRY_OPTIONS = [
  { id: 'india', label: 'Made in India 🇮🇳' },
  { id: 'handcrafted', label: 'Handcrafted by Artisans ✨' },
  { id: 'imported', label: 'Imported' },
];

// 10. FABRIC OPTIONS
const FABRIC_OPTIONS = [
  { id: 'cotton', label: 'Pure Cotton' },
  { id: 'silk', label: 'Pure Silk / Raw Silk' },
  { id: 'banarasi', label: 'Banarasi Brocade' },
  { id: 'georgette', label: 'Georgette' },
  { id: 'chiffon', label: 'Chiffon' },
  { id: 'rayon', label: 'Rayon / Viscose' },
  { id: 'velvet', label: 'Royal Velvet' },
  { id: 'linen', label: 'Linen' },
  { id: 'organza', label: 'Organza' },
  { id: 'denim', label: 'Denim' },
  { id: 'satin', label: 'Satin Silk' },
  { id: 'crepe', label: 'Crepe' },
];

// 11. OCCASION OPTIONS
const OCCASION_OPTIONS = [
  { id: 'wedding', label: 'Wedding & Bridal' },
  { id: 'festive', label: 'Festivals & Grand Puja' },
  { id: 'party', label: 'Party & Evening' },
  { id: 'casual', label: 'Casual & Daily Wear' },
  { id: 'formal', label: 'Office & Formals' },
  { id: 'traditional', label: 'Traditional Ethnic' },
];

// 12. COLOR OPTIONS
const COLOR_OPTIONS = [
  { id: 'red', label: 'Red', hex: '#E11D48' },
  { id: 'blue', label: 'Blue', hex: '#2563EB' },
  { id: 'green', label: 'Green', hex: '#059669' },
  { id: 'black', label: 'Black', hex: '#0F172A' },
  { id: 'pink', label: 'Pink', hex: '#EC4899' },
  { id: 'white', label: 'White', hex: '#F8FAFC' },
  { id: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { id: 'gold', label: 'Gold', hex: '#D97706' },
  { id: 'maroon', label: 'Maroon', hex: '#881337' },
  { id: 'purple', label: 'Purple', hex: '#9333EA' },
  { id: 'peach', label: 'Peach', hex: '#FB923C' },
  { id: 'navy', label: 'Navy', hex: '#1E3A8A' },
  { id: 'beige', label: 'Beige', hex: '#D4B996' },
  {
    id: 'multicolor',
    label: 'Multicolor',
    hex: 'linear-gradient(135deg, #f43f5e, #3b82f6, #10b981)',
  },
];

// 13. SIZES
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

export function CategoryFilteredView({ initialProducts, category }: CategoryFilteredViewProps) {
  // Mobile drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<string>('print_type');

  // Filter states
  const [selectedPrintTypes, setSelectedPrintTypes] = useState<string[]>([]);
  const [selectedSleeveLengths, setSelectedSleeveLengths] = useState<string[]>([]);
  const [selectedSleeveStyles, setSelectedSleeveStyles] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [isNavyaAssuredOnly, setIsNavyaAssuredOnly] = useState<boolean>(false);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [selectedNewArrivals, setSelectedNewArrivals] = useState<string[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [availabilityInStockOnly, setAvailabilityInStockOnly] = useState<boolean>(false);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('popularity');

  // Expanded Accordion Sections on Desktop
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    print_type: true,
    price: true,
    ratings: true,
    discount: true,
    fabrics: true,
    colors: true,
    sleeve_length: false,
    sleeve_style: false,
    n_assured: false,
    new_arrivals: false,
    offers: false,
    availability: false,
    origin: false,
    sizes: false,
    occasion: false,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper toggle function
  const toggleArrayItem = (item: string, state: string[], setter: (v: string[]) => void) => {
    setter(state.includes(item) ? state.filter((i) => i !== item) : [...state, item]);
  };

  // Reset all filters
  const handleClearAllFilters = () => {
    setSelectedPrintTypes([]);
    setSelectedSleeveLengths([]);
    setSelectedSleeveStyles([]);
    setSelectedPriceRanges([]);
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSelectedRatings([]);
    setIsNavyaAssuredOnly(false);
    setSelectedDiscounts([]);
    setSelectedNewArrivals([]);
    setSelectedOffers([]);
    setAvailabilityInStockOnly(false);
    setSelectedOrigins([]);
    setSelectedFabrics([]);
    setSelectedOccasions([]);
    setSelectedColors([]);
    setSelectedSizes([]);
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return (
      selectedPrintTypes.length +
      selectedSleeveLengths.length +
      selectedSleeveStyles.length +
      selectedPriceRanges.length +
      (customMinPrice || customMaxPrice ? 1 : 0) +
      selectedRatings.length +
      (isNavyaAssuredOnly ? 1 : 0) +
      selectedDiscounts.length +
      selectedNewArrivals.length +
      selectedOffers.length +
      (availabilityInStockOnly ? 1 : 0) +
      selectedOrigins.length +
      selectedFabrics.length +
      selectedOccasions.length +
      selectedColors.length +
      selectedSizes.length
    );
  }, [
    selectedPrintTypes,
    selectedSleeveLengths,
    selectedSleeveStyles,
    selectedPriceRanges,
    customMinPrice,
    customMaxPrice,
    selectedRatings,
    isNavyaAssuredOnly,
    selectedDiscounts,
    selectedNewArrivals,
    selectedOffers,
    availabilityInStockOnly,
    selectedOrigins,
    selectedFabrics,
    selectedOccasions,
    selectedColors,
    selectedSizes,
  ]);

  // Main Filtering Logic
  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    // 1. Print Type Filter
    if (selectedPrintTypes.length > 0) {
      list = list.filter((p) => {
        const text =
          `${p.name || ''} ${p.description || ''} ${p.metaKeywords || ''} ${p.fabric || ''}`.toLowerCase();
        return selectedPrintTypes.some((type) => {
          if (type === 'block_print')
            return text.includes('block') || text.includes('bagru') || text.includes('kalamkari');
          if (type === 'bandhani')
            return (
              text.includes('bandhani') || text.includes('tie-dye') || text.includes('leheriya')
            );
          if (type === 'embroidered')
            return (
              text.includes('embroid') ||
              text.includes('zari') ||
              text.includes('chikan') ||
              text.includes('sequin')
            );
          if (type === 'solid')
            return text.includes('solid') || text.includes('plain') || text.includes('monochrome');
          if (type === 'floral')
            return text.includes('floral') || text.includes('flower') || text.includes('botanical');
          if (type === 'geometric')
            return text.includes('geometric') || text.includes('ikat') || text.includes('abstract');
          if (type === 'striped') return text.includes('stripe') || text.includes('lined');
          if (type === 'jacquard')
            return text.includes('jacquard') || text.includes('woven') || text.includes('brocade');
          if (type === 'checked')
            return text.includes('check') || text.includes('plaid') || text.includes('tartan');
          if (type === 'polka') return text.includes('polka') || text.includes('dot');
          return text.includes(type);
        });
      });
    }

    // 2. Sleeve Length Filter
    if (selectedSleeveLengths.length > 0) {
      list = list.filter((p) => {
        const text = `${p.name || ''} ${p.description || ''} ${p.metaKeywords || ''}`.toLowerCase();
        return selectedSleeveLengths.some((slv) => {
          if (slv === 'full') return text.includes('full sleeve') || text.includes('long sleeve');
          if (slv === 'half') return text.includes('half sleeve') || text.includes('short sleeve');
          if (slv === 'three_quarter')
            return (
              text.includes('3/4') ||
              text.includes('three quarter') ||
              text.includes('three-quarter')
            );
          if (slv === 'sleeveless')
            return (
              text.includes('sleeveless') ||
              text.includes('strapless') ||
              text.includes('noodle strap')
            );
          return text.includes(slv);
        });
      });
    }

    // 3. Sleeve Style Filter
    if (selectedSleeveStyles.length > 0) {
      list = list.filter((p) => {
        const text = `${p.name || ''} ${p.description || ''} ${p.metaKeywords || ''}`.toLowerCase();
        return selectedSleeveStyles.some((st) => {
          if (st === 'puff') return text.includes('puff') || text.includes('balloon');
          if (st === 'bell') return text.includes('bell') || text.includes('flared sleeve');
          if (st === 'bishop') return text.includes('bishop') || text.includes('lantern');
          if (st === 'cold_shoulder')
            return text.includes('cold shoulder') || text.includes('cut out');
          if (st === 'cap') return text.includes('cap sleeve');
          if (st === 'rollup') return text.includes('roll-up') || text.includes('rollup');
          return true;
        });
      });
    }

    // 4. Price Ranges & Custom Min/Max
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

    // 5. Customer Ratings
    if (selectedRatings.length > 0) {
      const minSelectedRating = Math.min(
        ...selectedRatings.map((rId) => RATING_OPTIONS.find((r) => r.id === rId)?.minRating || 4.0),
      );
      list = list.filter((p) => (p.rating ?? 4.8) >= minSelectedRating);
    }

    // 6. N-Assured (Navya Assured / Verified)
    if (isNavyaAssuredOnly) {
      list = list.filter((p) => p.shop?.verificationBadge || (p.rating ?? 4.8) >= 4.5);
    }

    // 7. Discounts
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

    // 8. New Arrivals
    if (selectedNewArrivals.length > 0) {
      list = list.filter((p) => {
        if (p.isNewArrival) return true;
        if (!p.createdAt) return false;
        const daysOld = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (selectedNewArrivals.includes('last_7_days')) return daysOld <= 7;
        if (selectedNewArrivals.includes('last_30_days')) return daysOld <= 30;
        return true;
      });
    }

    // 9. Offers & Deals
    if (selectedOffers.length > 0) {
      list = list.filter((p) => {
        if (selectedOffers.includes('budget_finds') && Number(p.price || 0) <= 999) return true;
        if (
          selectedOffers.includes('special_price') &&
          Number(p.compareAtPrice || 0) > Number(p.price || 0)
        )
          return true;
        if (selectedOffers.includes('free_delivery')) return true;
        return false;
      });
    }

    // 10. Availability (In Stock)
    if (availabilityInStockOnly) {
      list = list.filter((p) => Number(p.stock || 0) > 0);
    }

    // 11. Country of Origin
    if (selectedOrigins.length > 0) {
      list = list.filter((p) => {
        const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        if (selectedOrigins.includes('imported'))
          return text.includes('imported') || text.includes('korean');
        if (selectedOrigins.includes('handcrafted'))
          return (
            text.includes('handcraft') ||
            text.includes('artisan') ||
            text.includes('handloom') ||
            text.includes('khadi')
          );
        return true; // Default India
      });
    }

    // 12. Fabrics
    if (selectedFabrics.length > 0) {
      list = list.filter((p) => {
        const text = `${p.fabric || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
        return selectedFabrics.some((f) => text.includes(f));
      });
    }

    // 13. Occasion
    if (selectedOccasions.length > 0) {
      list = list.filter((p) => {
        const text = `${p.occasion || ''} ${p.name || ''} ${p.description || ''}`.toLowerCase();
        return selectedOccasions.some((occ) => text.includes(occ));
      });
    }

    // 14. Colors
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

    // 15. Sizes
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

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'rating') return (b.rating ?? 4.8) - (a.rating ?? 4.8);
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
      return 0; // default popularity / natural
    });

    return list;
  }, [
    initialProducts,
    selectedPrintTypes,
    selectedSleeveLengths,
    selectedSleeveStyles,
    selectedPriceRanges,
    customMinPrice,
    customMaxPrice,
    selectedRatings,
    isNavyaAssuredOnly,
    selectedDiscounts,
    selectedNewArrivals,
    selectedOffers,
    availabilityInStockOnly,
    selectedOrigins,
    selectedFabrics,
    selectedOccasions,
    selectedColors,
    selectedSizes,
    sortBy,
  ]);

  // Mobile Filter Categories Sidebar items matching user image exactly
  const MOBILE_FILTER_TABS = [
    { id: 'print_type', label: 'Print Type', count: selectedPrintTypes.length },
    { id: 'sleeve_length', label: 'Sleeve Length', count: selectedSleeveLengths.length },
    { id: 'sleeve_style', label: 'Sleeve Style', count: selectedSleeveStyles.length },
    {
      id: 'price',
      label: 'Price',
      count: selectedPriceRanges.length + (customMinPrice || customMaxPrice ? 1 : 0),
    },
    { id: 'ratings', label: 'Customer Ratings', count: selectedRatings.length },
    { id: 'n_assured', label: 'F-Assured / N-Assured', count: isNavyaAssuredOnly ? 1 : 0 },
    { id: 'discount', label: 'Discount', count: selectedDiscounts.length },
    { id: 'new_arrivals', label: 'New Arrivals', count: selectedNewArrivals.length },
    { id: 'offers', label: 'Offers', count: selectedOffers.length },
    { id: 'availability', label: 'Availability', count: availabilityInStockOnly ? 1 : 0 },
    { id: 'origin', label: 'Country Of Origin', count: selectedOrigins.length },
    { id: 'fabric', label: 'Fabric / Material', count: selectedFabrics.length },
    { id: 'color', label: 'Color', count: selectedColors.length },
    { id: 'size', label: 'Size', count: selectedSizes.length },
    { id: 'occasion', label: 'Occasion', count: selectedOccasions.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 bg-navy text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="h-4.5 w-4.5 rounded-full bg-[#F15A25] text-white text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Showing <strong className="text-navy">{filteredProducts.length}</strong> products
            {activeFilterCount > 0 && <span className="text-amber-700 font-bold"> (Filtered)</span>}
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
        <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
          <span className="text-xs font-black text-amber-900 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-amber-600" /> Active Filters ({activeFilterCount}):
          </span>

          {selectedPrintTypes.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedPrintTypes, setSelectedPrintTypes)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-slate-200 shadow-2xs hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <span>{PRINT_TYPES.find((p) => p.id === id)?.label || id}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {selectedSleeveLengths.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedSleeveLengths, setSelectedSleeveLengths)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-slate-200 shadow-2xs hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <span>{SLEEVE_LENGTHS.find((s) => s.id === id)?.label || id}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {selectedPriceRanges.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedPriceRanges, setSelectedPriceRanges)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-slate-200 shadow-2xs hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <span>{PRICE_RANGES.find((r) => r.id === id)?.label || id}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {selectedRatings.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedRatings, setSelectedRatings)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-slate-200 shadow-2xs hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <span>{RATING_OPTIONS.find((r) => r.id === id)?.label || id}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {isNavyaAssuredOnly && (
            <button
              onClick={() => setIsNavyaAssuredOnly(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-slate-200 shadow-2xs hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <span>N-Assured</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {selectedFabrics.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedFabrics, setSelectedFabrics)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-slate-200 shadow-2xs hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <span>{FABRIC_OPTIONS.find((f) => f.id === id)?.label || id}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          {selectedColors.map((id) => (
            <button
              key={id}
              onClick={() => toggleArrayItem(id, selectedColors, setSelectedColors)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-navy font-bold text-[11px] rounded-full border border-slate-200 shadow-2xs hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <span>Color: {id}</span>
              <X className="w-3 h-3" />
            </button>
          ))}

          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs font-black text-rose-700 hover:text-rose-900 underline underline-offset-2 ml-auto shrink-0 cursor-pointer"
          >
            Clear All ✕
          </button>
        </div>
      )}

      {/* Main Dual-Layout: Desktop Left Sidebar + Right Products Grid */}
      <div className="flex items-start gap-6 lg:gap-8">
        {/* DESKTOP FILTER SIDEBAR (280px) */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto space-y-4 scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#F15A25]" />
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* 1. PRINT TYPE ACCORDION */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('print_type')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Print Type</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.print_type ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.print_type && (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {PRINT_TYPES.map((pt) => {
                    const checked = selectedPrintTypes.includes(pt.id);
                    return (
                      <label
                        key={pt.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(pt.id, selectedPrintTypes, setSelectedPrintTypes)
                          }
                          className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-navy' : 'font-medium'}>
                          {pt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. SLEEVE LENGTH ACCORDION */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('sleeve_length')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Sleeve Length</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.sleeve_length ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.sleeve_length && (
                <div className="mt-2 space-y-1.5">
                  {SLEEVE_LENGTHS.map((sl) => {
                    const checked = selectedSleeveLengths.includes(sl.id);
                    return (
                      <label
                        key={sl.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(sl.id, selectedSleeveLengths, setSelectedSleeveLengths)
                          }
                          className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-navy' : 'font-medium'}>
                          {sl.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. SLEEVE STYLE ACCORDION */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('sleeve_style')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Sleeve Style</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.sleeve_style ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.sleeve_style && (
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {SLEEVE_STYLES.map((st) => {
                    const checked = selectedSleeveStyles.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(st.id, selectedSleeveStyles, setSelectedSleeveStyles)
                          }
                          className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-navy' : 'font-medium'}>
                          {st.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. PRICE RANGE ACCORDION */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('price')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Price</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.price ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.price && (
                <div className="mt-2 space-y-2">
                  <div className="space-y-1.5">
                    {PRICE_RANGES.map((pr) => {
                      const checked = selectedPriceRanges.includes(pr.id);
                      return (
                        <label
                          key={pr.id}
                          className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleArrayItem(pr.id, selectedPriceRanges, setSelectedPriceRanges)
                            }
                            className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                          />
                          <span className={checked ? 'font-bold text-navy' : 'font-medium'}>
                            {pr.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {/* Min - Max Input Range */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={customMinPrice}
                      onChange={(e) => setCustomMinPrice(e.target.value)}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono outline-none"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={customMaxPrice}
                      onChange={(e) => setCustomMaxPrice(e.target.value)}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. CUSTOMER RATINGS */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('ratings')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Customer Ratings</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.ratings ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.ratings && (
                <div className="mt-2 space-y-1.5">
                  {RATING_OPTIONS.map((ro) => {
                    const checked = selectedRatings.includes(ro.id);
                    return (
                      <label
                        key={ro.id}
                        className="flex items-center gap-2 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(ro.id, selectedRatings, setSelectedRatings)
                          }
                          className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                        />
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {ro.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. N-ASSURED (F-ASSURED EQUIVALENT) */}
            <div className="border-b border-slate-100 pb-3.5">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-navy">Navya Assured</span>
                </div>
                <input
                  type="checkbox"
                  checked={isNavyaAssuredOnly}
                  onChange={(e) => setIsNavyaAssuredOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                />
              </label>
              <p className="text-[10px] text-slate-500 font-medium pl-6">
                Verified boutique partners & quality-checked couture
              </p>
            </div>

            {/* 7. DISCOUNT */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('discount')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Discount</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.discount ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.discount && (
                <div className="mt-2 space-y-1.5">
                  {DISCOUNT_OPTIONS.map((doItem) => {
                    const checked = selectedDiscounts.includes(doItem.id);
                    return (
                      <label
                        key={doItem.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(doItem.id, selectedDiscounts, setSelectedDiscounts)
                          }
                          className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-[#F15A25]' : 'font-medium'}>
                          {doItem.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 8. FABRIC / MATERIAL */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('fabrics')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Fabric / Material</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.fabrics ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.fabrics && (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {FABRIC_OPTIONS.map((fo) => {
                    const checked = selectedFabrics.includes(fo.id);
                    return (
                      <label
                        key={fo.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(fo.id, selectedFabrics, setSelectedFabrics)
                          }
                          className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-navy' : 'font-medium'}>
                          {fo.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 9. COLOR SWATCHES */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('colors')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Color</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.colors ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.colors && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((co) => {
                    const active = selectedColors.includes(co.id);
                    return (
                      <button
                        key={co.id}
                        type="button"
                        onClick={() => toggleArrayItem(co.id, selectedColors, setSelectedColors)}
                        className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          active
                            ? 'border-navy bg-navy/5 font-extrabold ring-1 ring-navy/30'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs mb-1"
                          style={{ background: co.hex }}
                        />
                        <span className="text-[10px] text-slate-700 truncate max-w-full">
                          {co.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 10. SIZES */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('sizes')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Size</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.sizes ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.sizes && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SIZE_OPTIONS.map((sz) => {
                    const active = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleArrayItem(sz, selectedSizes, setSelectedSizes)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          active
                            ? 'bg-navy text-white border-navy shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-navy'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 11. OCCASION */}
            <div className="border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => toggleSection('occasion')}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Occasion</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.occasion ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.occasion && (
                <div className="mt-2 space-y-1.5">
                  {OCCASION_OPTIONS.map((occ) => {
                    const checked = selectedOccasions.includes(occ.id);
                    return (
                      <label
                        key={occ.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(occ.id, selectedOccasions, setSelectedOccasions)
                          }
                          className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-navy' : 'font-medium'}>
                          {occ.label}
                        </span>
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
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide hover:text-navy cursor-pointer py-1"
              >
                <span>Country Of Origin</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    expandedSections.origin ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSections.origin && (
                <div className="mt-2 space-y-1.5">
                  {COUNTRY_OPTIONS.map((co) => {
                    const checked = selectedOrigins.includes(co.id);
                    return (
                      <label
                        key={co.id}
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-navy cursor-pointer py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(co.id, selectedOrigins, setSelectedOrigins)
                          }
                          className="w-3.5 h-3.5 rounded text-navy accent-navy focus:ring-0 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-navy' : 'font-medium'}>
                          {co.label}
                        </span>
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-14 text-center space-y-4 shadow-xs my-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold mx-auto shadow-xs text-2xl">
                🛍️
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-extrabold text-navy">
                  No matching products found
                </h3>
                <p className="text-xs text-slate-500">
                  Try clearing some filters (like Print Type, Fabric or Price) to view more items.
                </p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-navy/90"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* FLIPKART STYLE MOBILE DUAL-PANE FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Mobile Filter Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="flex items-center gap-2 text-navy font-bold text-sm cursor-pointer"
            >
              <span className="text-lg">←</span>
              <span>Filters</span>
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-bold text-rose-600 underline cursor-pointer"
              >
                Clear Filters
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
                        ? 'bg-white text-navy font-black border-l-4 border-l-navy'
                        : 'text-slate-600 hover:bg-slate-200/60 font-semibold'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="h-4 w-4 rounded-full bg-[#F15A25] text-white text-[9px] font-black flex items-center justify-center shrink-0 ml-1">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Pane Filter Options */}
            <div className="flex-1 bg-white p-4 overflow-y-auto">
              {/* 1. PRINT TYPE */}
              {mobileActiveTab === 'print_type' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Select Print Type
                  </h4>
                  {PRINT_TYPES.map((pt) => {
                    const checked = selectedPrintTypes.includes(pt.id);
                    return (
                      <label key={pt.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(pt.id, selectedPrintTypes, setSelectedPrintTypes)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span
                          className={`text-xs ${checked ? 'font-bold text-navy' : 'text-slate-700'}`}
                        >
                          {pt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 2. SLEEVE LENGTH */}
              {mobileActiveTab === 'sleeve_length' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Select Sleeve Length
                  </h4>
                  {SLEEVE_LENGTHS.map((sl) => {
                    const checked = selectedSleeveLengths.includes(sl.id);
                    return (
                      <label key={sl.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(sl.id, selectedSleeveLengths, setSelectedSleeveLengths)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span
                          className={`text-xs ${checked ? 'font-bold text-navy' : 'text-slate-700'}`}
                        >
                          {sl.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 3. SLEEVE STYLE */}
              {mobileActiveTab === 'sleeve_style' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Select Sleeve Style
                  </h4>
                  {SLEEVE_STYLES.map((st) => {
                    const checked = selectedSleeveStyles.includes(st.id);
                    return (
                      <label key={st.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(st.id, selectedSleeveStyles, setSelectedSleeveStyles)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span
                          className={`text-xs ${checked ? 'font-bold text-navy' : 'text-slate-700'}`}
                        >
                          {st.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 4. PRICE */}
              {mobileActiveTab === 'price' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Select Price Range
                  </h4>
                  {PRICE_RANGES.map((pr) => {
                    const checked = selectedPriceRanges.includes(pr.id);
                    return (
                      <label key={pr.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(pr.id, selectedPriceRanges, setSelectedPriceRanges)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span
                          className={`text-xs ${checked ? 'font-bold text-navy' : 'text-slate-700'}`}
                        >
                          {pr.label}
                        </span>
                      </label>
                    );
                  })}
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={customMinPrice}
                      onChange={(e) => setCustomMinPrice(e.target.value)}
                      className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={customMaxPrice}
                      onChange={(e) => setCustomMaxPrice(e.target.value)}
                      className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 5. RATINGS */}
              {mobileActiveTab === 'ratings' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Customer Ratings
                  </h4>
                  {RATING_OPTIONS.map((ro) => {
                    const checked = selectedRatings.includes(ro.id);
                    return (
                      <label key={ro.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(ro.id, selectedRatings, setSelectedRatings)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span className="text-xs font-bold text-amber-700">{ro.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 6. N-ASSURED */}
              {mobileActiveTab === 'n_assured' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Navya Assured Quality
                  </h4>
                  <label className="flex items-center gap-3 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNavyaAssuredOnly}
                      onChange={(e) => setIsNavyaAssuredOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-navy accent-navy"
                    />
                    <span className="text-xs font-bold text-navy">N-Assured Products Only</span>
                  </label>
                  <p className="text-xs text-slate-500">
                    Products from top-rated boutiques with strict quality checks and fast order
                    dispatch.
                  </p>
                </div>
              )}

              {/* 7. DISCOUNT */}
              {mobileActiveTab === 'discount' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Discount %
                  </h4>
                  {DISCOUNT_OPTIONS.map((doItem) => {
                    const checked = selectedDiscounts.includes(doItem.id);
                    return (
                      <label
                        key={doItem.id}
                        className="flex items-center gap-3 py-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(doItem.id, selectedDiscounts, setSelectedDiscounts)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span className="text-xs font-bold text-[#F15A25]">{doItem.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 8. NEW ARRIVALS */}
              {mobileActiveTab === 'new_arrivals' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    New Arrivals
                  </h4>
                  {NEW_ARRIVALS_OPTIONS.map((na) => {
                    const checked = selectedNewArrivals.includes(na.id);
                    return (
                      <label key={na.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(na.id, selectedNewArrivals, setSelectedNewArrivals)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span className="text-xs text-slate-700">{na.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 9. OFFERS */}
              {mobileActiveTab === 'offers' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Offers & Deals
                  </h4>
                  {OFFERS_OPTIONS.map((off) => {
                    const checked = selectedOffers.includes(off.id);
                    return (
                      <label key={off.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(off.id, selectedOffers, setSelectedOffers)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span className="text-xs font-bold text-slate-800">{off.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 10. AVAILABILITY */}
              {mobileActiveTab === 'availability' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Stock Availability
                  </h4>
                  <label className="flex items-center gap-3 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availabilityInStockOnly}
                      onChange={(e) => setAvailabilityInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-navy accent-navy"
                    />
                    <span className="text-xs font-bold text-emerald-700">In Stock Only</span>
                  </label>
                </div>
              )}

              {/* 11. ORIGIN */}
              {mobileActiveTab === 'origin' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Country Of Origin
                  </h4>
                  {COUNTRY_OPTIONS.map((co) => {
                    const checked = selectedOrigins.includes(co.id);
                    return (
                      <label key={co.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(co.id, selectedOrigins, setSelectedOrigins)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span className="text-xs font-bold text-slate-800">{co.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 12. FABRIC */}
              {mobileActiveTab === 'fabric' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Fabric / Material
                  </h4>
                  {FABRIC_OPTIONS.map((fo) => {
                    const checked = selectedFabrics.includes(fo.id);
                    return (
                      <label key={fo.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(fo.id, selectedFabrics, setSelectedFabrics)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span className="text-xs text-slate-800">{fo.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 13. COLOR */}
              {mobileActiveTab === 'color' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Colors
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_OPTIONS.map((co) => {
                      const active = selectedColors.includes(co.id);
                      return (
                        <button
                          key={co.id}
                          type="button"
                          onClick={() => toggleArrayItem(co.id, selectedColors, setSelectedColors)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer ${
                            active ? 'border-navy bg-navy/5 font-bold' : 'border-slate-200'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                            style={{ background: co.hex }}
                          />
                          <span className="text-xs text-slate-800">{co.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 14. SIZE */}
              {mobileActiveTab === 'size' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Sizes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((sz) => {
                      const active = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleArrayItem(sz, selectedSizes, setSelectedSizes)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            active
                              ? 'bg-navy text-white border-navy shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 15. OCCASION */}
              {mobileActiveTab === 'occasion' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-2">
                    Occasion
                  </h4>
                  {OCCASION_OPTIONS.map((occ) => {
                    const checked = selectedOccasions.includes(occ.id);
                    return (
                      <label key={occ.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleArrayItem(occ.id, selectedOccasions, setSelectedOccasions)
                          }
                          className="w-4 h-4 rounded text-navy accent-navy"
                        />
                        <span className="text-xs text-slate-800">{occ.label}</span>
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
              className="w-1/3 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 active:bg-slate-100"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-2/3 py-3 bg-[#F15A25] hover:bg-[#d94e1d] text-white rounded-xl text-xs font-extrabold shadow-md active:scale-98 transition-transform"
            >
              Apply ({filteredProducts.length} Items)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
