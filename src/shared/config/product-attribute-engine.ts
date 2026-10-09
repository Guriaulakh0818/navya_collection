/**
 * NAVYA COLLECTION — DYNAMIC PRODUCT ATTRIBUTE ENGINE & CATEGORY TEMPLATE REGISTRY
 *
 * Architecture:
 * Department -> Category -> Subcategory -> Product Type -> Attribute Template -> Seller Product Form -> Product -> Variants
 *
 * Future-proof & Extensible:
 * When adding new departments (e.g. Shoes, Home & Living, Beauty) in the future,
 * registering their attribute templates here immediately surfaces relevant fields in
 * the seller panel without changing database models or core logic.
 */

export type FieldInputType = 'select' | 'multi-select' | 'text' | 'number' | 'boolean';

export interface AttributeFieldDefinition {
  id: string;
  label: string;
  type: FieldInputType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  group?:
    | 'Styling & Fit'
    | 'Fabric & Material'
    | 'Details & Work'
    | 'Specifications'
    | 'Care & Details';
}

export interface SizeSystemOption {
  id: string;
  name: string;
  description: string;
  sizes: string[];
}

export interface ProductTypeDefinition {
  id: string;
  name: string;
  description?: string;
  sizeSystemId:
    | 'MEN_CLOTHING'
    | 'MEN_BOTTOMWEAR'
    | 'WOMEN_CLOTHING'
    | 'KIDS_AGE'
    | 'ACCESSORIES_ONE_SIZE';
  attributes: AttributeFieldDefinition[];
}

export interface SubCategoryDefinition {
  id: string;
  name: string;
  slug: string;
  productTypes: ProductTypeDefinition[];
}

export interface MainCategoryDefinition {
  id: string;
  name: string;
  slug: string;
  department: 'MEN' | 'WOMEN' | 'KIDS' | 'LIVING' | 'BEAUTY';
  subCategories: SubCategoryDefinition[];
}

// ============================================================================
// 1. SIZE SYSTEMS REGISTRY
// ============================================================================
export const SIZE_SYSTEMS: Record<string, SizeSystemOption> = {
  MEN_CLOTHING: {
    id: 'MEN_CLOTHING',
    name: "Men's Standard Clothing",
    description: 'Standard alpha sizes for men topwear, ethnic wear, formal wear & jackets',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'],
  },
  MEN_BOTTOMWEAR: {
    id: 'MEN_BOTTOMWEAR',
    name: "Men's Bottomwear (Waist)",
    description: 'Numeric waist sizes in inches for Jeans, Chinos, Trousers & Shorts',
    sizes: ['28', '30', '32', '34', '36', '38', '40', '42', '44'],
  },
  WOMEN_CLOTHING: {
    id: 'WOMEN_CLOTHING',
    name: "Women's Clothing",
    description: 'Standard sizes for Kurtas, Kurta Sets, Dresses, Tops, Lehengas & Western Wear',
    sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'Free Size'],
  },
  KIDS_AGE: {
    id: 'KIDS_AGE',
    name: 'Kids Age Groups',
    description: 'Age-based sizes for Infants, Toddlers, Boys, Girls & Teens',
    sizes: [
      '0–3 Months',
      '3–6 Months',
      '6–12 Months',
      '1–2 Years',
      '2–3 Years',
      '3–4 Years',
      '4–5 Years',
      '5–6 Years',
      '6–7 Years',
      '7–8 Years',
      '8–9 Years',
      '9–10 Years',
      '10–11 Years',
      '11–12 Years',
      '12–13 Years',
      '13–14 Years',
    ],
  },
  ACCESSORIES_ONE_SIZE: {
    id: 'ACCESSORIES_ONE_SIZE',
    name: 'One Size / Free Size',
    description: 'For Bags, Jewellery, Watches, Belts & Eyewear',
    sizes: ['One Size'],
  },
};

// ============================================================================
// 2. COMMON CONSTANTS FOR ATTRIBUTE OPTIONS
// ============================================================================
export const COMMON_PATTERNS = [
  'Solid / Plain',
  'Floral Print',
  'Striped',
  'Checked / Plaid',
  'Graphic / Typography',
  'Block Print',
  'Geometric',
  'Abstract',
  'Colourblocked',
  'Bandhani / Tie-Dye',
  'Polka Dots',
  'Self Design / Textured',
  'Embroidered',
  'Jacquard',
  'Batik',
  'Ombre',
];

export const COMMON_OCCASIONS = [
  'Casual & Daily Wear',
  'Festive & Puja',
  'Wedding & Bridal',
  'Party & Evening',
  'Office & Formal Wear',
  'Traditional Ethnic',
  'Lounge & Home',
  'Travel & Vacation',
  'Gym & Sports',
];

export const COMMON_FABRICS = [
  '100% Pure Cotton',
  'Cotton Blend',
  'Pure Silk',
  'Banarasi Silk',
  'Art Silk / Poly Silk',
  'Chanderi Silk',
  'Georgette',
  'Chiffon',
  'Viscose Rayon',
  'Crepe',
  'Organza',
  'Velvet',
  'Linen',
  'Linen Blend',
  'Denim',
  'Satin',
  'Wool / Wool Blend',
  'Polyester',
  'Nylon',
  'Modal',
  'Bamboo Fabric',
];

// ============================================================================
// 3. CATEGORY ENGINE TAXONOMY & ATTRIBUTE TEMPLATES
// ============================================================================
export const CATEGORY_ENGINE_TAXONOMY: MainCategoryDefinition[] = [
  // ==========================================================================
  // 1. MEN DEPARTMENT
  // ==========================================================================
  {
    id: 'dept_men',
    name: 'Men',
    slug: 'men',
    department: 'MEN',
    subCategories: [
      // ----------------------------------------------------------------------
      // 1A. MEN TOPWEAR
      // ----------------------------------------------------------------------
      {
        id: 'men_topwear',
        name: 'Topwear',
        slug: 'men-topwear',
        productTypes: [
          {
            id: 'men_tshirts',
            name: 'T-Shirts',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular', 'Slim', 'Oversized', 'Relaxed'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['Round Neck', 'V-Neck', 'Polo Neck', 'Henley'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Half Sleeve', 'Full Sleeve', 'Sleeveless'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Printed', 'Striped', 'Graphic', 'Colourblocked'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: COMMON_FABRICS,
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fabricComposition',
                label: 'Fabric Composition',
                type: 'text',
                placeholder: 'e.g. 100% Combed Cotton, 95% Cotton 5% Spandex',
                group: 'Fabric & Material',
              },
              {
                id: 'gsm',
                label: 'GSM',
                type: 'select',
                options: ['160 GSM (Lightweight)', '180 GSM (Standard)', '220 GSM (Heavyweight)', '240+ GSM (Super Heavy)'],
                group: 'Fabric & Material',
              },
              {
                id: 'stretch',
                label: 'Stretch',
                type: 'select',
                options: ['Non-Stretch', 'Low Stretch', 'Medium Stretch', 'High Stretch / 4-Way'],
                group: 'Fabric & Material',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Regular', 'Longline', 'Crop'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: COMMON_OCCASIONS,
                group: 'Care & Details',
              },
              {
                id: 'season',
                label: 'Season',
                type: 'select',
                options: ['All Season', 'Summer', 'Winter', 'Monsoon / Autumn'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'men_shirts',
            name: 'Shirts',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Fit', 'Tailored Fit', 'Relaxed / Cuban Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'collarType',
                label: 'Collar Type',
                type: 'select',
                options: ['Spread Collar', 'Button-Down Collar', 'Mandarin / Band Collar', 'Cuban / Camp Collar', 'Cutaway Collar'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Full Sleeve', 'Half Sleeve', 'Roll-Up Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Striped', 'Checked / Plaid', 'Printed', 'Textured / Self Design'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: COMMON_FABRICS,
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fabricComposition',
                label: 'Fabric Composition',
                type: 'text',
                placeholder: 'e.g. 100% Giza Cotton, 60% Linen 40% Cotton',
                group: 'Fabric & Material',
              },
              {
                id: 'pocket',
                label: 'Pocket',
                type: 'select',
                options: ['Single Chest Pocket', 'Double Flap Pockets', 'No Pocket'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Button Placket', 'Concealed Buttons', 'Zip Front', 'Snap Buttons'],
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Regular', 'Longline', 'Curved Hem'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: COMMON_OCCASIONS,
                group: 'Care & Details',
              },
              {
                id: 'season',
                label: 'Season',
                type: 'select',
                options: ['All Season', 'Summer', 'Winter'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'men_polos',
            name: 'Polos',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Slim Fit', 'Athletic Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'collar',
                label: 'Collar',
                type: 'select',
                options: ['Ribbed Polo Collar', 'Tipped Collar', 'Stand Collar', 'Button-Down Polo Collar'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Half Sleeve', 'Full Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Striped', 'Tipped / Contrast', 'Textured / Pique', 'Printed'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Pique Cotton', 'Cotton Matty', 'Poly-Cotton Blend', 'Dry-Fit Poly Knit'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['2-Button Placket', '3-Button Placket', 'Zipper Placket'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_hoodies',
            name: 'Hoodies / Sweatshirts',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Oversized Fit', 'Slim Fit', 'Relaxed Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['Hooded', 'Round Neck / Crew Neck', 'High Neck / Turtle'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Full Sleeve', 'Drop Shoulder Full Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'hood',
                label: 'Hood',
                type: 'select',
                options: ['Drawstring Hood', 'Attached Hood (No Cord)', 'Without Hood (Sweatshirt)'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Printed / Graphic', 'Colourblocked', 'Tie-Dye', 'Embroidered Logo'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Cotton Fleece', 'Cotton Rich Blend', 'Poly-Fleece', 'Heavyweight French Terry'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fleece',
                label: 'Fleece',
                type: 'select',
                options: ['Brushed Fleece (Heavy Warm)', 'French Terry / Loopback (Mid-Weight)', 'Unbrushed Lightweight'],
                group: 'Fabric & Material',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Pullover', 'Full Zip', 'Half Zip'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocket',
                label: 'Pocket',
                type: 'select',
                options: ['Kangaroo Pocket', 'Side Slash Pockets', 'Zipper Pockets', 'No Pocket'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_jackets',
            name: 'Jackets',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'jacketType',
                label: 'Jacket Type',
                type: 'select',
                options: ['Bomber Jacket', 'Denim Jacket', 'Biker Jacket', 'Puffer Jacket', 'Windbreaker', 'Trench Coat', 'Varsity Jacket'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Slim Fit', 'Oversized Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Genuine Leather', 'Faux Leather / PU', 'Denim', 'Nylon', 'Polyester', 'Suede', 'Wool Blend'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'lining',
                label: 'Lining',
                type: 'select',
                options: ['Quilted Fleece', 'Sherpa / Fur', 'Polyester Satin', 'Unlined'],
                group: 'Fabric & Material',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Zipper', 'Snap Buttons', 'Button Front', 'Asymmetric Zip'],
                group: 'Styling & Fit',
              },
              {
                id: 'hood',
                label: 'Hood',
                type: 'select',
                options: ['Detachable Hood', 'Attached Hood', 'No Hood'],
                group: 'Styling & Fit',
              },
              {
                id: 'pockets',
                label: 'Pockets',
                type: 'select',
                options: ['Multi-Pocket Utility', 'Flap Chest Pockets', 'Side Welt Pockets', 'Interior Pocket'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Colourblocked', 'Camouflage', 'Quilted'],
                group: 'Styling & Fit',
              },
              {
                id: 'waterResistance',
                label: 'Water Resistance',
                type: 'select',
                options: ['Water-Resistant', 'Waterproof', 'Windproof', 'Standard Non-Waterproof'],
                group: 'Specifications',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 1B. MEN BOTTOMWEAR
      // ----------------------------------------------------------------------
      {
        id: 'men_bottomwear',
        name: 'Bottomwear',
        slug: 'men-bottomwear',
        productTypes: [
          {
            id: 'men_jeans',
            name: 'Jeans / Denims',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Skinny', 'Slim', 'Straight', 'Relaxed', 'Baggy', 'Wide Leg', 'Bootcut', 'Flared'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'rise',
                label: 'Rise',
                type: 'select',
                options: ['Low', 'Mid', 'High'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'waistSize',
                label: 'Waist Size',
                type: 'select',
                options: ['28', '30', '32', '34', '36', '38', '40', '42', '44'],
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Regular Length', 'Cropped Ankle', 'Stacked Long'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Cotton Denim', 'Cotton Blend with Spandex / Elastane', 'Cotton Poly Stretch'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'stretch',
                label: 'Stretch',
                type: 'select',
                options: ['Non-Stretch', 'Low Stretch (1-2%)', 'Medium Stretch (3-4%)', 'High Stretch / Super Flex'],
                group: 'Fabric & Material',
              },
              {
                id: 'denimWeight',
                label: 'Denim Weight',
                type: 'select',
                options: ['9-11 oz (Lightweight)', '12-13 oz (Standard)', '14+ oz (Heavyweight Rigid)'],
                group: 'Fabric & Material',
              },
              {
                id: 'wash',
                label: 'Wash',
                type: 'select',
                options: ['Light', 'Medium', 'Dark', 'Acid Wash', 'Stone Wash', 'Raw / Clean Dark'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid Plain', 'Whiskered & Faded', 'Clean Dark Wash'],
                group: 'Styling & Fit',
              },
              {
                id: 'distressed',
                label: 'Distressed',
                type: 'select',
                options: ['Clean Look (Non-Distressed)', 'Mildly Distressed', 'Heavily Distressed / Ripped'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocketType',
                label: 'Pocket Type',
                type: 'select',
                options: ['Classic 5-Pocket', 'Slanted Front Pockets', 'Cargo Style Pockets'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Button Fly', 'Zip Fly'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_trousers',
            name: 'Trousers',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Fit', 'Tailored Fit', 'Relaxed Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'waistType',
                label: 'Waist Type',
                type: 'select',
                options: ['Fixed Button Waistband', 'Extended Tab Waistband', 'Elasticated Back Waistband'],
                group: 'Styling & Fit',
              },
              {
                id: 'rise',
                label: 'Rise',
                type: 'select',
                options: ['Low', 'Mid', 'High'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Full Length', 'Ankle Length'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Poly-Viscose Blend', 'Cotton Twill', 'Linen Blend', 'Wool Blend'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pleats',
                label: 'Pleats',
                type: 'select',
                options: ['Flat Front (No Pleats)', 'Single Pleat', 'Double Pleats'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Checked / Houndstooth', 'Textured / Self Design', 'Striped'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocketType',
                label: 'Pocket Type',
                type: 'select',
                options: ['Slanted Side Pockets', 'Chino Pockets', 'Rear Jetted Pockets'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Button & Zip', 'Hook & Bar with Zip'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_chinos',
            name: 'Chinos',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Fit', 'Skinny Fit', 'Tapered Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'rise',
                label: 'Rise',
                type: 'select',
                options: ['Low', 'Mid', 'High'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Cotton Twill', 'Cotton Stretch (98% Cotton 2% Spandex)'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'stretch',
                label: 'Stretch',
                type: 'select',
                options: ['Stretchable', 'Non-Stretch'],
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Micro-Pattern', 'Garment Dyed'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocketType',
                label: 'Pocket Type',
                type: 'select',
                options: ['Slanted Front Pockets with Rear Button Welts', 'Coin Pocket Detail'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Button & Zip Fly', 'Extended Button Tab'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_cargo_pants',
            name: 'Cargo Pants',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Relaxed Fit', 'Baggy Fit', 'Slim Tapered', 'Straight Leg'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'rise',
                label: 'Rise',
                type: 'select',
                options: ['Low', 'Mid', 'High'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Heavy Cotton Twill', 'Ripstop Cotton', 'Canvas', 'Stretch Cotton'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'numberOfPockets',
                label: 'Number of Pockets',
                type: 'select',
                options: ['6 Pockets', '8 Pockets', '10 Pockets Multi-Utility'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocketType',
                label: 'Pocket Type',
                type: 'select',
                options: ['Gusseted Cargo Flap Pockets', 'Velcro Patch Pockets', 'Zippered Utility Pockets'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Button & Zip', 'Drawstring Waist with Fly'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Camouflage', 'Tactical Techwear'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_shorts',
            name: 'Shorts',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Slim Fit', 'Relaxed / Boxy'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Above Knee', 'Mid Thigh', 'Knee Length', 'Long Bermuda'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Cotton Chino', 'Denim', 'French Terry / Fleece', 'Quick-Dry Nylon'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'waistType',
                label: 'Waist Type',
                type: 'select',
                options: ['Elastic Waist with Drawstring', 'Fixed Waistband with Belt Loops'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocketType',
                label: 'Pocket Type',
                type: 'select',
                options: ['Side Slash Pockets', 'Cargo Flap Pockets', 'Zipper Pocket'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Printed', 'Striped', 'Colourblocked'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Drawstring Tie', 'Button & Zip Fly'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_track_pants',
            name: 'Track Pants',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Tapered Jogger', 'Straight Leg', 'Relaxed Baggy'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Polyester Dry-Fit', 'Cotton Fleece', 'Poly-Cotton Interlock', 'Nylon Taslan'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'waistType',
                label: 'Waist Type',
                type: 'select',
                options: ['Ribbed Elastic Waistband', 'Encased Elastic Waistband'],
                group: 'Styling & Fit',
              },
              {
                id: 'drawstring',
                label: 'Drawstring',
                type: 'select',
                options: ['Yes (External Cord)', 'Yes (Internal Cord)', 'No'],
                group: 'Styling & Fit',
              },
              {
                id: 'pockets',
                label: 'Pockets',
                type: 'select',
                options: ['Zippered Hand Pockets', 'Deep Side Pockets', 'Back Pocket'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid with Side Stripes', 'Solid Plain', 'Colourblocked', 'Reflective Detail'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 1C. MEN ETHNIC WEAR
      // ----------------------------------------------------------------------
      {
        id: 'men_ethnic',
        name: 'Ethnic Wear',
        slug: 'men-ethnic',
        productTypes: [
          {
            id: 'men_kurtas',
            name: 'Kurtas',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'kurtaType',
                label: 'Kurta Type',
                type: 'select',
                options: ['Short Kurta', 'Long Knee-Length Kurta', 'Pathani Kurta', 'Asymmetric Hem Kurta', 'Angrakha Kurta'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Slim Fit', 'Tailored Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Pure Cotton', 'Linen', 'Cotton Silk', 'Art Silk', 'Jacquard Silk', 'Chanderi Silk'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Embroidered', 'Floral Printed', 'Ikat', 'Bandhani', 'Chikankari'],
                group: 'Styling & Fit',
              },
              {
                id: 'collar',
                label: 'Collar / Neck',
                type: 'select',
                options: ['Mandarin / Band Collar', 'Shirt Collar', 'Open Placket'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Full Sleeve with Cuffs', 'Full Sleeve Roll-Up', 'Half Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Knee Length', 'Thigh Length (Short)', 'Calf Length'],
                group: 'Styling & Fit',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Lucknowi Chikankari', 'Zari Thread Work', 'Mirror Work', 'Minimal Neck Embroidery', 'None (Plain)'],
                group: 'Details & Work',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: COMMON_OCCASIONS,
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'men_kurta_sets',
            name: 'Kurta Sets',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'setIncludes',
                label: 'Set Includes',
                type: 'select',
                options: ['Kurta + Pyjama', 'Kurta + Churidar', 'Kurta + Dhoti', 'Kurta + Pyjama + Nehru Jacket (3 Pcs)'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'kurtaFabric',
                label: 'Kurta Fabric',
                type: 'select',
                options: ['Cotton Silk', 'Pure Silk', 'Jacquard', 'Chanderi', 'Georgette with Lining'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'bottomFabric',
                label: 'Bottom Fabric',
                type: 'select',
                options: ['Silk Blend', 'Cotton Satin', 'Pure Cotton'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Tailored Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Self-Design Jacquard', 'Printed', 'Embroidered', 'Solid Rich'],
                group: 'Styling & Fit',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Zari Borders', 'Heavy Neck Work', 'Sequin Highlights', 'Minimal Thread Work'],
                group: 'Details & Work',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: COMMON_OCCASIONS,
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'men_sherwanis',
            name: 'Sherwani',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'sherwaniType',
                label: 'Sherwani Type',
                type: 'select',
                options: ['Achkan Sherwani', 'Indo-Western Sherwani', 'Jodhpuri Bandhgala', 'Anarkali Flare Sherwani'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Banarasi Brocade', 'Raw Silk', 'Velvet', 'Heavy Jacquard', 'Matka Silk'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Zardozi Work', 'Hand Thread Embroidery', 'Pearl & Bead Embellishment', 'Zari Jaal Work'],
                group: 'Details & Work',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Floral Brocade', 'Royal Regal Motif', 'Self Woven Textured'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Jewelled Button Placket', 'Concealed Zip with Hooks'],
                group: 'Styling & Fit',
              },
              {
                id: 'setIncludes',
                label: 'Set Includes',
                type: 'select',
                options: ['Sherwani + Churidar', 'Sherwani + Churidar + Stole / Dupatta', 'Complete 4 Pcs Ensemble'],
                group: 'Specifications',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Groom Wedding', 'Royal Sangeet', 'Grand Reception', 'Festive Event'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'men_nehru_jackets',
            name: 'Nehru Jackets',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Raw Silk', 'Matka Silk', 'Linen', 'Cotton Silk', 'Tweed / Wool Blend', 'Velvet'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Tailored', 'Regular Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Jacquard Woven', 'Floral Printed', 'Textured Khadi'],
                group: 'Styling & Fit',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Pocket Square Embroidery', 'Zari Button Loops', 'Minimal Chest Work', 'Plain Non-Embroidered'],
                group: 'Details & Work',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['5-Button Placket', '6-Button Placket', 'Concealed Button Placket'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocket',
                label: 'Pocket',
                type: 'select',
                options: ['1 Chest Pocket + 2 Welt Pockets', '3 Pockets with Pocket Square Detail'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 1D. MEN FORMAL WEAR
      // ----------------------------------------------------------------------
      {
        id: 'men_formal',
        name: 'Formal Wear',
        slug: 'men-formal',
        productTypes: [
          {
            id: 'men_formal_shirts',
            name: 'Formal Shirts',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Fit', 'Tailored Formal'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'collar',
                label: 'Collar',
                type: 'select',
                options: ['Spread Collar', 'Semi-Spread Collar', 'Cutaway Collar', 'Pin Collar'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Full Sleeve with Button Cuffs', 'Full Sleeve with French Cuffs'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Giza Cotton', 'Fine Poplin', 'Oxford Weave', 'Twill Suiting Cotton', 'Linen'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Crisp Solid', 'Fine Micro Check', 'Pinstripe', 'Herringbone'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocket',
                label: 'Pocket',
                type: 'select',
                options: ['Single Patch Pocket', 'Clean No Pocket'],
                group: 'Styling & Fit',
              },
              {
                id: 'cuffType',
                label: 'Cuff Type',
                type: 'select',
                options: ['Single Button Cuff', 'Double Convertible Cuff', 'French Double Cuff'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_formal_trousers',
            name: 'Formal Trousers',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Fit', 'Contemporary Tailored'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'rise',
                label: 'Rise',
                type: 'select',
                options: ['Low', 'Mid', 'High'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Poly-Viscose Worsted', 'Wool Rich Blend', 'Stretch Cotton Suiting'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pleats',
                label: 'Pleats',
                type: 'select',
                options: ['Flat Front', 'Single Reverse Pleat'],
                group: 'Styling & Fit',
              },
              {
                id: 'pocket',
                label: 'Pocket',
                type: 'select',
                options: ['Side Cross Pockets with Rear Button Welts', 'Slanted Front Pockets'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Extended Waistband Tab with Hook & Bar and Zip', 'Standard Button & Zip'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_blazers',
            name: 'Blazers',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Fit', 'Modern Tailored'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'blazerType',
                label: 'Blazer Type',
                type: 'select',
                options: ['Single Breasted', 'Double Breasted', 'Tuxedo Dinner Jacket'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Wool Blend', 'Velvet', 'Linen Blend', 'Textured Tweed', 'Poly-Viscose Suiting'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'numberOfButtons',
                label: 'Number of Buttons',
                type: 'select',
                options: ['1 Button', '2 Buttons', '6 Buttons (Double Breasted)'],
                group: 'Styling & Fit',
              },
              {
                id: 'lapelType',
                label: 'Lapel Type',
                type: 'select',
                options: ['Notch Lapel', 'Peak Lapel', 'Shawl Lapel (Tuxedo)'],
                group: 'Styling & Fit',
              },
              {
                id: 'pockets',
                label: 'Pockets',
                type: 'select',
                options: ['Flap Pockets with Chest Pocket', 'Ticket Pocket Detail', 'Jetted Pockets'],
                group: 'Styling & Fit',
              },
              {
                id: 'lining',
                label: 'Lining',
                type: 'select',
                options: ['Fully Lined Satin', 'Half Lined'],
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Windowpane Check', 'Houndstooth', 'Textured'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_suits',
            name: 'Suits',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'suitType',
                label: 'Suit Type',
                type: 'select',
                options: ['2-Piece Suit (Blazer + Trouser)', '3-Piece Suit (Blazer + Vest + Trouser)', 'Tuxedo Suit'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'numberOfPieces',
                label: 'Number of Pieces',
                type: 'select',
                options: ['2 Pieces', '3 Pieces'],
                group: 'Specifications',
              },
              {
                id: 'blazerFit',
                label: 'Blazer Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Tailored'],
                group: 'Styling & Fit',
              },
              {
                id: 'trouserFit',
                label: 'Trouser Fit',
                type: 'select',
                options: ['Slim Fit', 'Straight Leg'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Premium Wool Blend', 'Super 120s Wool', 'Poly-Viscose Suiting'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid Charcoal / Navy / Black', 'Micro Herringbone', 'Subtle Plaid'],
                group: 'Styling & Fit',
              },
              {
                id: 'lapel',
                label: 'Lapel',
                type: 'select',
                options: ['Notch Lapel', 'Peak Lapel', 'Satin Shawl Lapel'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['2-Button Single Breasted', 'Double Breasted Buttons'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 1E. MEN SPORTS & ACTIVEWEAR
      // ----------------------------------------------------------------------
      {
        id: 'men_activewear',
        name: 'Sports & Activewear',
        slug: 'men-activewear',
        productTypes: [
          {
            id: 'men_activewear',
            name: 'Sports & Activewear',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: ['Gym T-Shirt', 'Compression Top', 'Training Shorts', 'Track Pant', 'Tracksuit Set', 'Running Jacket'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'activity',
                label: 'Activity',
                type: 'select',
                options: ['Gym & Weightlifting', 'Running & Jogging', 'Yoga & Training', 'Outdoor Sports'],
                required: true,
                group: 'Care & Details',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Compression Fit', 'Athletic Slim Fit', 'Regular Active'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Micro Polyester', 'Poly-Spandex Blend', 'Nylon Spandex'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'moistureWicking',
                label: 'Moisture Wicking',
                type: 'select',
                options: ['Yes (Rapid Dry Tech)', 'Standard Breathable'],
                group: 'Specifications',
              },
              {
                id: 'breathability',
                label: 'Breathability',
                type: 'select',
                options: ['High Airflow Mesh Panels', 'Laser Cut Perforations', 'Breathable Knit'],
                group: 'Specifications',
              },
              {
                id: 'stretch',
                label: 'Stretch',
                type: 'select',
                options: ['4-Way Super Stretch', '2-Way Stretch', 'Non-Stretch'],
                group: 'Fabric & Material',
              },
              {
                id: 'quickDry',
                label: 'Quick Dry',
                type: 'select',
                options: ['Fast Drying Fabric', 'Standard'],
                group: 'Specifications',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Heathered / Melange', 'Graphic Sports Print', 'Colourblock'],
                group: 'Styling & Fit',
              },
              {
                id: 'reflectiveDetails',
                label: 'Reflective Details',
                type: 'select',
                options: ['360° Reflective Strips', 'Reflective Brand Logo', 'None'],
                group: 'Specifications',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 1F. MEN ACCESSORIES
      // ----------------------------------------------------------------------
      {
        id: 'men_accessories',
        name: 'Accessories',
        slug: 'men-accessories',
        productTypes: [
          {
            id: 'men_wallets',
            name: 'Wallets',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'walletType',
                label: 'Wallet Type',
                type: 'select',
                options: ['Bi-Fold Wallet', 'Tri-Fold Wallet', 'Slim Card Holder', 'Travel Wallet / Passport Case', 'Money Clip Wallet'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'material',
                label: 'Material',
                type: 'select',
                options: ['Genuine Top-Grain Leather', 'Full-Grain Leather', 'Faux Leather / PU', 'Canvas / Nylon'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'numberOfCardSlots',
                label: 'Number of Card Slots',
                type: 'select',
                options: ['4 Slots', '6-8 Slots', '10+ Slots'],
                group: 'Specifications',
              },
              {
                id: 'numberOfCompartments',
                label: 'Number of Compartments',
                type: 'select',
                options: ['2 Full Currency Compartments', '1 Currency Compartment', 'Hidden Secret Compartment'],
                group: 'Specifications',
              },
              {
                id: 'coinPocket',
                label: 'Coin Pocket',
                type: 'select',
                options: ['Yes (Snap Button Flap)', 'Yes (Zipper)', 'No Coin Pocket (Ultra Slim)'],
                group: 'Specifications',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Fold Closure', 'Zipper Around', 'Elastic Band', 'Snap Button'],
                group: 'Styling & Fit',
              },
              {
                id: 'rfidProtection',
                label: 'RFID Protection',
                type: 'select',
                options: ['RFID Blocking Protected', 'Non-RFID'],
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'men_belts',
            name: 'Belts',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'beltType',
                label: 'Belt Type',
                type: 'select',
                options: ['Formal Dress Belt', 'Casual Belt', 'Reversible (Black/Brown)', 'Braided / Woven Belt'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'material',
                label: 'Material',
                type: 'select',
                options: ['Genuine Buffalo Leather', 'Full Grain Leather', 'Synthetic Leather / PU', 'Canvas Webbing'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'buckleType',
                label: 'Buckle Type',
                type: 'select',
                options: ['Single Prong Pin Buckle', 'Automatic Ratchet Buckle', 'Plate Buckle', 'Reversible Twist Buckle'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'beltWidth',
                label: 'Belt Width',
                type: 'select',
                options: ['30mm (Formal Slim)', '35mm (Standard)', '40mm (Casual / Jeans)'],
                group: 'Specifications',
              },
              {
                id: 'waistRange',
                label: 'Size / Waist Range',
                type: 'select',
                options: ['28-34 inches', '34-40 inches', '40-46 inches', 'Adjustable Cut-to-Fit'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_watches',
            name: 'Watches',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'watchType',
                label: 'Watch Type',
                type: 'select',
                options: ['Chronograph', 'Analog Classic', 'Minimalist Dress Watch', 'Automatic Skeleton', 'Digital Sports'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'movement',
                label: 'Movement',
                type: 'select',
                options: ['Japanese Quartz Movement', 'Automatic Self-Winding', 'Mechanical Hand-Wound', 'Digital Quartz'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'dialShape',
                label: 'Dial Shape',
                type: 'select',
                options: ['Round', 'Square', 'Tonneau', 'Rectangle'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'dialColor',
                label: 'Dial Color',
                type: 'select',
                options: ['Black', 'Navy Blue', 'Silver / White', 'Green', 'Champagne Gold'],
                group: 'Styling & Fit',
              },
              {
                id: 'strapMaterial',
                label: 'Strap Material',
                type: 'select',
                options: ['Stainless Steel Link Bracelet', 'Genuine Leather Strap', 'Silicone / Rubber', 'Mesh Milanese'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'strapColor',
                label: 'Strap Color',
                type: 'select',
                options: ['Silver', 'Black', 'Brown', 'Rose Gold', 'Dual Tone Gold & Silver'],
                group: 'Styling & Fit',
              },
              {
                id: 'waterResistance',
                label: 'Water Resistance',
                type: 'select',
                options: ['30m (Splash Resistant 3 ATM)', '50m (5 ATM)', '100m (10 ATM)', 'Non-Waterproof'],
                group: 'Specifications',
              },
              {
                id: 'caseMaterial',
                label: 'Case Material',
                type: 'select',
                options: ['316L Stainless Steel', 'Alloy', 'Titanium', 'Brass'],
                group: 'Specifications',
              },
              {
                id: 'caseSize',
                label: 'Case Size',
                type: 'select',
                options: ['38mm', '40mm', '42mm', '44mm+'],
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'men_sunglasses',
            name: 'Sunglasses',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'frameShape',
                label: 'Frame Shape',
                type: 'select',
                options: ['Aviator', 'Wayfarer', 'Clubmaster / Browline', 'Round', 'Hexagonal', 'Rectangular'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'frameMaterial',
                label: 'Frame Material',
                type: 'select',
                options: ['Metal / Stainless Steel', 'Acetate', 'Polycarbonate', 'TR90 Ultra Light'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'lensColor',
                label: 'Lens Color',
                type: 'select',
                options: ['Black / Smoke', 'Brown / Amber', 'Green (G-15)', 'Blue Mirror', 'Silver Mirror'],
                group: 'Styling & Fit',
              },
              {
                id: 'lensType',
                label: 'Lens Type',
                type: 'select',
                options: ['Polarized Anti-Glare', 'UV400 Protective', 'Gradient Tinted', 'Mirrored'],
                group: 'Specifications',
              },
              {
                id: 'uvProtection',
                label: 'UV Protection',
                type: 'select',
                options: ['100% UV400 Protection', 'UV380'],
                group: 'Specifications',
              },
              {
                id: 'polarized',
                label: 'Polarized',
                type: 'select',
                options: ['Yes (Polarized)', 'No (Non-Polarized)'],
                group: 'Specifications',
              },
              {
                id: 'frameColor',
                label: 'Frame Color',
                type: 'select',
                options: ['Matte Black', 'Gold', 'Gunmetal', 'Tortoiseshell', 'Silver'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 1G. MEN ESSENTIALS
      // ----------------------------------------------------------------------
      {
        id: 'men_essentials',
        name: 'Essentials',
        slug: 'men-essentials',
        productTypes: [
          {
            id: 'men_briefs_boxers',
            name: 'Briefs / Boxers',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'type',
                label: 'Type',
                type: 'select',
                options: ['Boxer Briefs / Trunks', 'Classic Briefs', 'Boxers (Woven Lounge)', 'Low Rise Trunks'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Combed Cotton', 'Modal Fabric', 'Bamboo Cotton', 'MicroModal with Elastane'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Anti-Chafing Snug Fit', 'Relaxed Fit', 'Contour Pouch'],
                group: 'Styling & Fit',
              },
              {
                id: 'waistband',
                label: 'Waistband',
                type: 'select',
                options: ['Ultra-Soft Microfiber Waistband', 'Outer Encased Elastic', 'Logo Jacquard Elastic'],
                group: 'Styling & Fit',
              },
              {
                id: 'packSize',
                label: 'Pack Size',
                type: 'select',
                options: ['Single Piece', 'Pack of 2', 'Pack of 3', 'Pack of 5 Value Pack'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Printed', 'Striped'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_vests',
            name: 'Vests',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['Scoop Neck', 'Deep U-Neck', 'Square Neck', 'V-Neck'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Ribbed Body Hugging', 'Regular Fit', 'Gym Muscle Vest'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Combed Ribbed Cotton', 'Modal Cotton Blend', 'Dry-Fit Mesh'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'packSize',
                label: 'Pack Size',
                type: 'select',
                options: ['Single Piece', 'Pack of 2', 'Pack of 3', 'Pack of 5'],
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'men_socks',
            name: 'Socks',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['No-Show / Loafer Socks', 'Ankle Length', 'Crew Length', 'Mid-Calf Formal'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'material',
                label: 'Material',
                type: 'select',
                options: ['Combed Cotton with Lycra', 'Bamboo Fibre', 'Wool Blend Cushion'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'packSize',
                label: 'Pack Size',
                type: 'select',
                options: ['Pack of 3', 'Pack of 4', 'Pack of 5'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid Formal', 'Argyle Diamond', 'Striped', 'Quirky Graphic'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_thermals',
            name: 'Thermals',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'type',
                label: 'Type',
                type: 'select',
                options: ['Thermal Top (Full Sleeve)', 'Thermal Bottom / Long John', 'Complete Set (Top + Bottom)'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Poly-Cotton Rib with Fleece Inside', 'Merino Wool Blend', 'Heattech Thermal Knit'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Snug Second Skin Fit', 'Regular Thermal Fit'],
                group: 'Styling & Fit',
              },
              {
                id: 'thermalRating',
                label: 'Thermal Rating',
                type: 'select',
                options: ['Mild Winter', 'Moderate Winter', 'Extreme Sub-Zero Winter'],
                group: 'Specifications',
              },
              {
                id: 'packSize',
                label: 'Pack Size',
                type: 'select',
                options: ['1 Piece', '1 Set (Top + Bottom)'],
                group: 'Specifications',
              },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // 2. WOMEN DEPARTMENT
  // ==========================================================================
  {
    id: 'dept_women',
    name: 'Women',
    slug: 'women',
    department: 'WOMEN',
    subCategories: [
      // ----------------------------------------------------------------------
      // 2A. WOMEN ETHNIC & WESTERN CLOTHING
      // ----------------------------------------------------------------------
      {
        id: 'women_clothing',
        name: 'Clothing',
        slug: 'women-clothing',
        productTypes: [
          {
            id: 'women_kurtas',
            name: 'Kurtas',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'kurtaType',
                label: 'Kurta Type',
                type: 'select',
                options: ['Straight Kurta', 'Anarkali Kurta', 'A-Line Kurta', 'Angrakha', 'Flared Hem', 'Kaftan Kurta'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Flared Fit', 'Relaxed Fit', 'Tailored Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Pure Cotton', 'Chanderi Silk', 'Georgette', 'Viscose Rayon', 'Silk Blend', 'Muslin'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['Round Neck with Slit', 'V-Neck', 'Sweetheart Neck', 'Mandarin Collar', 'Boat Neck', 'Keyhole Neck'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['3/4th Sleeve', 'Full Sleeve', 'Sleeveless', 'Elbow Sleeve', 'Bell Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Floral Print', 'Solid', 'Gold Foil Print', 'Kalamkari', 'Bandhani', 'Chikankari', 'Ikat'],
                group: 'Styling & Fit',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Lucknowi Thread Work', 'Gota Patti', 'Mirror Work', 'Zardozi', 'Resham Thread', 'None (Plain)'],
                group: 'Details & Work',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Calf Length', 'Knee Length', 'Ankle / Floor Length', 'Short Kurti'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: COMMON_OCCASIONS,
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'women_kurta_sets',
            name: 'Kurta Sets',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'setIncludes',
                label: 'Set Includes',
                type: 'select',
                options: [
                  'Kurta + Pant / Palazzo + Dupatta (3 Pcs)',
                  'Kurta + Bottom (2 Pcs)',
                  'Kurta + Skirt + Dupatta',
                  'Sharara / Gharara Set (3 Pcs)',
                ],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Chanderi Silk', 'Pure Cotton', 'Georgette with Crepe Lining', 'Viscose Rayon', 'Organza'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Straight Fit', 'Flared Anarkali', 'Peplum with Sharara'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Floral Printed', 'Jaal Embroidery', 'Bandhej', 'Block Print', 'Jacquard'],
                group: 'Styling & Fit',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Gota Patti Border', 'Zari Work', 'Heavy Yoke Handwork', 'Mirror Embroidery'],
                group: 'Details & Work',
              },
              {
                id: 'dupattaIncluded',
                label: 'Dupatta Included',
                type: 'select',
                options: ['Yes (Chiffon / Organza / Silk Dupatta)', 'No'],
                group: 'Specifications',
              },
              {
                id: 'bottomType',
                label: 'Bottom Type',
                type: 'select',
                options: ['Straight Pants', 'Flared Palazzo', 'Gathered Sharara', 'Salwar', 'Dhoti Pants'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'women_sarees',
            name: 'Sarees',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'sareeType',
                label: 'Saree Type',
                type: 'select',
                options: [
                  'Banarasi Silk Saree',
                  'Kanjeevaram Saree',
                  'Chanderi Saree',
                  'Georgette Saree',
                  'Organza Saree',
                  'Cotton Handloom Saree',
                  'Ready-to-Wear / Pre-Draped Saree',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Pure Banarasi Katan Silk', 'Art Silk', 'Chiffon', 'Georgette', 'Pure Linen', 'Organza', 'Tussar Silk'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'sareeLength',
                label: 'Saree Length',
                type: 'select',
                options: ['5.5 Metres (Standard)', '6.0 Metres', '6.3 Metres (with Blouse Piece)'],
                group: 'Specifications',
              },
              {
                id: 'blouseIncluded',
                label: 'Blouse Included',
                type: 'select',
                options: ['Unstitched Blouse Piece Included', 'Stitched Blouse Included', 'Blouse Not Included'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'blouseFabric',
                label: 'Blouse Fabric',
                type: 'select',
                options: ['Brocade Silk', 'Raw Silk', 'Georgette', 'Matching Saree Fabric'],
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Woven Zari Motif', 'Floral Jaal', 'Solid with Heavy Border', 'Digital Floral Print', 'Bandhani'],
                group: 'Styling & Fit',
              },
              {
                id: 'border',
                label: 'Border',
                type: 'select',
                options: ['Zari Woven Border', 'Embroidered Cutwork Border', 'Temple Border', 'Scalloped Border'],
                group: 'Details & Work',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Real Zari Woven', 'Hand Embroidered Resham', 'Stone / Moti Work', 'None (Woven Brocade)'],
                group: 'Details & Work',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Wedding & Bridal', 'Festive Puja', 'Traditional Ethnic', 'Evening Party'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'women_lehengas',
            name: 'Lehenga Choli',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'lehengaType',
                label: 'Lehenga Type',
                type: 'select',
                options: ['Circular / Flared Lehenga', 'A-Line Lehenga', 'Mermaid / Fishtail', 'Jacket Lehenga'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Velvet', 'Heavy Georgette', 'Raw Silk', 'Organza', 'Net with Satin Lining', 'Banarasi Brocade'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'blouseFabric',
                label: 'Blouse Fabric',
                type: 'select',
                options: ['Raw Silk', 'Velvet', 'Heavy Embroidered Georgette', 'Matching Lehenga Fabric'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'dupattaIncluded',
                label: 'Dupatta Included',
                type: 'select',
                options: ['Yes (Matching Embellished Net / Organza Dupatta)', 'Double Dupatta Set'],
                group: 'Specifications',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Zardozi', 'Dori & Sequin Work', 'Mirror Work', 'Thread Embroidery', 'Hand Karigari'],
                group: 'Details & Work',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Traditional Kalidar Flare', 'Floral Embroidery', 'Royal Jaal'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Bridal Wedding', 'Sangeet & Reception', 'Festive Celebration'],
                group: 'Care & Details',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Drawstring with Latkan & Side Zipper', 'Side Zipper with Hooks'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'women_tops_tees',
            name: 'Tops & Tees',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Slim Fit', 'Oversized Fit', 'Peplum', 'Crop Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['Round Neck', 'V-Neck', 'Square Neck', 'Off-Shoulder', 'Sweetheart', 'Halter Neck'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Short Sleeve', 'Puff Sleeve', 'Full Sleeve', 'Sleeveless', 'Ruffle Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Regular Length', 'Crop Top', 'Longline Tunics'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Floral Print', 'Striped', 'Polka Dot', 'Abstract', 'Graphic Print'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Cotton', 'Viscose Rayon', 'Satin', 'Chiffon', 'Ribbed Knit'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'stretch',
                label: 'Stretch',
                type: 'select',
                options: ['Stretchable', 'Non-Stretch'],
                group: 'Fabric & Material',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Casual Daily', 'Office Wear', 'Party & Night Out'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'women_dresses',
            name: 'Dresses',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'dressType',
                label: 'Dress Type',
                type: 'select',
                options: ['Maxi Dress', 'Midi Dress', 'Mini / Short Dress', 'Bodycon Dress', 'A-Line Dress', 'Wrap Dress', 'Fit & Flare', 'Shirt Dress'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit / Bodycon', 'Fit & Flare', 'Relaxed A-Line', 'Tiered'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Maxi (Ankle Length)', 'Midi (Calf Length)', 'Mini (Above Knee)', 'Knee Length'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['V-Neck', 'Square Neck', 'Round Neck', 'Sweetheart', 'Cowl Neck', 'Off-Shoulder'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Sleeveless', 'Puff Sleeve', 'Short Sleeve', 'Full Bishop Sleeve', 'Strappy / Spaghetti'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Georgette with Lining', 'Cotton Poplin', 'Viscose Rayon', 'Satin', 'Linen Blend', 'Velvet'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Floral Print', 'Solid', 'Polka Dot', 'Marble / Abstract', 'Animal Print'],
                group: 'Styling & Fit',
              },
              {
                id: 'waistType',
                label: 'Waist Type',
                type: 'select',
                options: ['Elasticated Smocked Waist', 'Tie-Up Belt Waist', 'High Empire Waist', 'Fitted Band'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Casual Outing', 'Date Night', 'Beach & Vacation', 'Formal Cocktail Party'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'women_jumpsuits',
            name: 'Jumpsuits',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Wide Leg Jumpsuit', 'Slim Tapered', 'Relaxed Boiler Suit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Full Length', 'Cropped Culotte Length'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['V-Neck', 'Wrap Neck', 'Square Neck', 'Halter'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Sleeveless', 'Short Sleeve', 'Cape Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Crepe', 'Cotton Twill', 'Satin', 'Viscose Rayon'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Floral', 'Striped'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Back Concealed Zip', 'Front Button Placket', 'Tie-Up Belt'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Party & Evening', 'Casual Day', 'Work Wear'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'women_skirts',
            name: 'Skirts',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'skirtType',
                label: 'Skirt Type',
                type: 'select',
                options: ['Pleated Midi Skirt', 'A-Line Skirt', 'Pencil Skirt', 'Tiered Maxi Skirt', 'Wrap Skirt'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['A-Line Flare', 'Fitted / Bodycon', 'Relaxed Flowy'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Maxi Length', 'Midi Length', 'Mini Length', 'Knee Length'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'waistType',
                label: 'Waist Type',
                type: 'select',
                options: ['High Rise Elastic Waist', 'Belted Waistband', 'Side Zip'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Satin', 'Cotton Poplin', 'Georgette', 'Denim', 'Corduroy'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Floral Print', 'Polka Dot', 'Checked'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Elasticated', 'Side Zipper', 'Front Buttons', 'Wrap Tie'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'women_coords',
            name: 'Co-ord Sets',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'setType',
                label: 'Set Type',
                type: 'select',
                options: [
                  'Blazer + Trouser Set',
                  'Top + Wide Leg Pant Set',
                  'Crop Top + Skirt Set',
                  'Kurti + Pant Set',
                  'Shirt + Shorts Set',
                ],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'piecesIncluded',
                label: 'Pieces Included',
                type: 'select',
                options: ['2 Pieces', '3 Pieces (with Inner / Shrug)'],
                group: 'Specifications',
              },
              {
                id: 'topType',
                label: 'Top Type',
                type: 'select',
                options: ['Crop Top', 'Button-Down Shirt', 'Tailored Blazer', 'Peplum Top'],
                group: 'Styling & Fit',
              },
              {
                id: 'bottomType',
                label: 'Bottom Type',
                type: 'select',
                options: ['Wide Leg Trousers', 'Straight Pants', 'Flared Skirt', 'Shorts'],
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Tailored Slim', 'Relaxed Oversized', 'Fit & Flare'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Linen Blend', 'Viscose Rayon', 'Cotton Satin', 'Poly-Crepe'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid', 'Floral Printed', 'Geometric', 'Houndstooth'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 2B. WOMEN ACTIVEWEAR
      // ----------------------------------------------------------------------
      {
        id: 'women_activewear',
        name: 'Activewear',
        slug: 'women-activewear',
        productTypes: [
          {
            id: 'women_activewear',
            name: 'Activewear',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'activity',
                label: 'Activity',
                type: 'select',
                options: ['Yoga & Pilates', 'Gym & Strength', 'Running', 'Zumba & Aerobics'],
                required: true,
                group: 'Care & Details',
              },
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: ['Sports Bra', 'High-Waist Leggings', 'Gym Crop Top', 'Active T-Shirt', '2-Piece Workout Set'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Compression Fit', 'Snug Athletic', 'Relaxed'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Nylon-Spandex (Butter Soft)', 'Poly-Spandex Interlock', 'Dry-Fit Microfibre'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'stretch',
                label: 'Stretch',
                type: 'select',
                options: ['4-Way Ultra Stretch (Squat Proof)', '2-Way Stretch'],
                group: 'Fabric & Material',
              },
              {
                id: 'moistureWicking',
                label: 'Moisture Wicking',
                type: 'select',
                options: ['High Moisture Absorption', 'Standard Breathable'],
                group: 'Specifications',
              },
              {
                id: 'breathability',
                label: 'Breathability',
                type: 'select',
                options: ['High Airflow Mesh Panels', 'Breathable Fabric'],
                group: 'Specifications',
              },
              {
                id: 'quickDry',
                label: 'Quick Dry',
                type: 'select',
                options: ['Rapid Dry Technology', 'Standard'],
                group: 'Specifications',
              },
              {
                id: 'supportLevel',
                label: 'Support Level',
                type: 'select',
                options: ['Low Support (Yoga)', 'Medium Support (Gym)', 'High Impact (Running)'],
                group: 'Specifications',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid Plain', 'Tie-Dye', 'Heathered', 'Camo'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 2C. WOMEN SLEEPWEAR
      // ----------------------------------------------------------------------
      {
        id: 'women_sleepwear',
        name: 'Sleepwear',
        slug: 'women-sleepwear',
        productTypes: [
          {
            id: 'women_sleepwear',
            name: 'Sleepwear',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: ['Pyjama Set (Top + Bottom)', 'Nighty / Nightdress', 'Satin Robe & Slip Set', 'Shorts Set'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'setIncludes',
                label: 'Set Includes',
                type: 'select',
                options: ['2 Pieces (Shirt + Pyjama)', '1 Piece (Nightdress)', '3 Pieces (with Robe)'],
                group: 'Specifications',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Breathable Cotton', 'Soft Satin Silk', 'Modal Knit', 'Hosiery Cotton'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Relaxed Comfy Fit', 'Loose Fit'],
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Half Sleeve', 'Short Sleeve', 'Sleeveless / Strappy', 'Full Sleeve'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Cute Cartoon Print', 'Classic Piping Solid', 'Floral', 'Polka Dot'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Button Front Placket', 'Slip-On', 'Wrap Tie'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Night Sleepwear', 'Loungewear', 'Bridal Honeymoon'],
                group: 'Care & Details',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 2D. WOMEN MATERNITY WEAR
      // ----------------------------------------------------------------------
      {
        id: 'women_maternity',
        name: 'Maternity Wear',
        slug: 'women-maternity',
        productTypes: [
          {
            id: 'women_maternity',
            name: 'Maternity Wear',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: ['Feeding Kurta', 'Maternity Maxi Dress', 'Nursing Top', 'Maternity Leggings / Overbelly Pants'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'maternityStage',
                label: 'Maternity Stage',
                type: 'select',
                options: ['All Trimesters & Postpartum Nursing', 'Pre-Natal Pregnancy', 'Post-Natal Nursing'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Relaxed Empire Waist with Flare', 'Gathered Stretchy Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Soft Breathable Cotton', 'Muslin', 'Rayon', 'Bamboo Knit'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'stretch',
                label: 'Stretch',
                type: 'select',
                options: ['High Stretchable Belly Panel', 'Gentle Stretch'],
                group: 'Fabric & Material',
              },
              {
                id: 'feedingFriendly',
                label: 'Feeding Friendly',
                type: 'select',
                options: ['Yes - Concealed Dual Zippers', 'Yes - Front Button Placket', 'Yes - Wrap Nursing Flap', 'Non-Feeding Maternity'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Floral Print', 'Solid Pastel', 'Striped'],
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['3/4th Sleeve', 'Half Sleeve', 'Sleeveless'],
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Calf Length', 'Maxi Ankle Length', 'Hip Length'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 2E. WOMEN ACCESSORIES
      // ----------------------------------------------------------------------
      {
        id: 'women_accessories',
        name: 'Accessories',
        slug: 'women-accessories',
        productTypes: [
          {
            id: 'women_handbags',
            name: 'Handbags',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'bagType',
                label: 'Bag Type',
                type: 'select',
                options: ['Shoulder Tote Bag', 'Satchel', 'Structured Handbag', 'Hobo Bag', 'Laptop Handbag'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'material',
                label: 'Material',
                type: 'select',
                options: ['Genuine Leather', 'Premium Vegan Leather / PU', 'Canvas', 'Jute Handcrafted'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'size',
                label: 'Size',
                type: 'select',
                options: ['Large (Fits 14" Laptop)', 'Medium Everyday', 'Compact'],
                group: 'Specifications',
              },
              {
                id: 'numberOfCompartments',
                label: 'Number of Compartments',
                type: 'select',
                options: ['2 Main Compartments', '3 Compartments with Center Zip', '1 Spacious Compartment'],
                group: 'Specifications',
              },
              {
                id: 'numberOfPockets',
                label: 'Number of Pockets',
                type: 'select',
                options: ['2 Inner Slip Pockets + 1 Zipper Pocket', 'Exterior Back Pocket Detail'],
                group: 'Specifications',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Top Zipper Closure', 'Magnetic Snap', 'Flap Twist Lock'],
                group: 'Styling & Fit',
              },
              {
                id: 'strapType',
                label: 'Strap Type',
                type: 'select',
                options: ['Double Handbag Straps + Detachable Crossbody Strap', 'Wide Shoulder Strap'],
                group: 'Specifications',
              },
              {
                id: 'adjustableStrap',
                label: 'Adjustable Strap',
                type: 'select',
                options: ['Yes (Detachable & Adjustable)', 'Fixed Length'],
                group: 'Specifications',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Work & Office', 'Casual Everyday', 'Shopping', 'Travel'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'women_sling_bags',
            name: 'Sling Bags',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'material',
                label: 'Material',
                type: 'select',
                options: ['Vegan Leather / PU', 'Quilted Faux Leather', 'Jacquard Canvas', 'Velvet'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'size',
                label: 'Size',
                type: 'select',
                options: ['Small Compact', 'Medium Crossbody'],
                group: 'Specifications',
              },
              {
                id: 'strapType',
                label: 'Strap Type',
                type: 'select',
                options: ['Gold Chain Strap', 'Adjustable Leather Crossbody Strap', 'Wide Webbing Guitar Strap'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'adjustableStrap',
                label: 'Adjustable Strap',
                type: 'select',
                options: ['Yes', 'No'],
                group: 'Specifications',
              },
              {
                id: 'compartments',
                label: 'Compartments',
                type: 'select',
                options: ['1 Main Compartment', '2 Gusseted Compartments'],
                group: 'Specifications',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Flap Magnetic Snap', 'Metallic Turnlock', 'Zipper Closure'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Party & Night Out', 'Casual Outing', 'Brunch & Travel'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'women_watches',
            name: 'Watches',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'movement',
                label: 'Movement',
                type: 'select',
                options: ['Japanese Quartz Movement', 'Smart Hybrid'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'dialShape',
                label: 'Dial Shape',
                type: 'select',
                options: ['Round', 'Oval', 'Rectangular / Tank', 'Petite Square'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'strapMaterial',
                label: 'Strap Material',
                type: 'select',
                options: ['Stainless Steel Link Bracelet', 'Mesh Milanese', 'Genuine Leather', 'Ceramic'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'strapColor',
                label: 'Strap Color',
                type: 'select',
                options: ['Rose Gold', 'Classic Gold', 'Silver', 'Blush Pink', 'Black'],
                group: 'Styling & Fit',
              },
              {
                id: 'waterResistance',
                label: 'Water Resistance',
                type: 'select',
                options: ['30m Water Resistant', '50m', 'Non-Waterproof'],
                group: 'Specifications',
              },
              {
                id: 'caseMaterial',
                label: 'Case Material',
                type: 'select',
                options: ['Rose Gold Tone Stainless Steel', 'Alloy', 'Brass'],
                group: 'Specifications',
              },
              {
                id: 'caseSize',
                label: 'Case Size',
                type: 'select',
                options: ['Petite 28mm', 'Standard 32mm', 'Bold 36mm'],
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'women_jewellery',
            name: 'Jewellery',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'jewelleryType',
                label: 'Jewellery Type',
                type: 'select',
                options: [
                  'Kundan Necklace Set',
                  'Jhumkas & Earrings',
                  'Temple Jewellery',
                  'Polki Choker',
                  'Bangles & Kadas',
                  'Mangalsutra',
                  'Maang Tikka',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'material',
                label: 'Material',
                type: 'select',
                options: ['Brass / Copper Base', 'Silver 925 Alloy', 'Oxidised Metal'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'plating',
                label: 'Plating',
                type: 'select',
                options: ['18K Gold Plated', '24K Micro Gold Plated', 'Antique Matte Gold', 'Silver Plated', 'Oxidised German Silver'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'stoneType',
                label: 'Stone Type',
                type: 'select',
                options: ['Kundan & Meenakari', 'CZ American Diamonds', 'Polki Glass Stones', 'Pearls & Beads', 'Semi-Precious Gemstones'],
                group: 'Specifications',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Bridal Wedding', 'Festive Celebrations', 'Party Wear', 'Daily Ethnic'],
                group: 'Care & Details',
              },
              {
                id: 'adjustable',
                label: 'Adjustable',
                type: 'select',
                options: ['Yes (Dori / Adjustable Chain Loop)', 'No'],
                group: 'Specifications',
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // 2F. WOMEN ESSENTIALS
      // ----------------------------------------------------------------------
      {
        id: 'women_essentials',
        name: 'Essentials',
        slug: 'women-essentials',
        productTypes: [
          {
            id: 'women_bras',
            name: 'Bras',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'braType',
                label: 'Bra Type',
                type: 'select',
                options: ['T-Shirt Bra', 'Push-Up Bra', 'Bralette', 'Sports Bra', 'Strapless / Multiway Bra', 'Minimizer Bra', 'Nursing Bra'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'coverage',
                label: 'Coverage',
                type: 'select',
                options: ['Full Coverage', 'Demi Coverage (3/4th)', 'Plunge / Low Cut'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'padding',
                label: 'Padding',
                type: 'select',
                options: ['Padded (Non-Moulded)', 'Lightly Padded', 'Non-Padded (Double Layer)', 'Push-Up Level 1-2'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'underwire',
                label: 'Underwire',
                type: 'select',
                options: ['Wire-Free (Comfort)', 'Underwired (Structured Lift)'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'strapType',
                label: 'Strap Type',
                type: 'select',
                options: ['Regular Adjustable Straps', 'Detachable Convertible Straps', 'Crossback / Racerback'],
                group: 'Specifications',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Back Hook & Eye (2 Hooks / 3 Hooks)', 'Front Clasp', 'Slip-On'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Cotton Spandex', 'Polyamide Elastane (Smooth Microfibre)', 'Lace Mesh'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'packSize',
                label: 'Pack Size',
                type: 'select',
                options: ['Single Piece', 'Pack of 2', 'Pack of 3 Value Pack'],
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'women_panties',
            name: 'Panties',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'pantyType',
                label: 'Panty Type',
                type: 'select',
                options: ['Hipster', 'Bikini', 'High Waist Brief', 'Boyshorts', 'Seamless Laser-Cut', 'Thong'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'coverage',
                label: 'Coverage',
                type: 'select',
                options: ['Full Rear Coverage', 'Medium Hipster Coverage', 'Cheeky'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'waistType',
                label: 'Waist Type',
                type: 'select',
                options: ['Mid Rise', 'High Rise (Tummy Hugging)', 'Low Rise'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Breathable Cotton Gusset', 'Modal Elastane', 'Seamless Microfibre', 'Lace'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'packSize',
                label: 'Pack Size',
                type: 'select',
                options: ['Pack of 3', 'Pack of 5', 'Pack of 6 Assorted'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid Pastel', 'Floral Printed', 'Striped'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'women_camisoles',
            name: 'Camisoles',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Body Hugging', 'Straight Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['Scoop Neck', 'V-Neck with Lace', 'Square Neck'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'strapType',
                label: 'Strap Type',
                type: 'select',
                options: ['Adjustable Spaghetti Straps', 'Wide Tank Shoulder Straps'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Combed Cotton', 'Cotton Modal Blend'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'packSize',
                label: 'Pack Size',
                type: 'select',
                options: ['Single Piece', 'Pack of 2', 'Pack of 3'],
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'women_shapewear',
            name: 'Shapewear',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'shapewearType',
                label: 'Shapewear Type',
                type: 'select',
                options: ['High-Waist Tummy Tucker', 'Saree Shaper / Silhouette Petticoat', 'Thigh Shaper', 'Full Body Suit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'controlLevel',
                label: 'Control Level',
                type: 'select',
                options: ['Medium Tummy Control', 'Firm Shaping', 'Everyday Light Compression'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'coverage',
                label: 'Coverage',
                type: 'select',
                options: ['High Waist to Mid-Thigh', 'High Waist Brief', 'Ankle Length Saree Shaper (with Slit)'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Microfibre Polyamide with Spandex', 'Seamless Cotton Elastane'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'seamless',
                label: 'Seamless',
                type: 'select',
                options: ['Yes (100% Seamless Invisible)', 'No'],
                group: 'Specifications',
              },
              {
                id: 'compression',
                label: 'Compression',
                type: 'select',
                options: ['Targeted Zoned Compression (Tummy, Waist & Thighs)', 'Uniform Medium Compression'],
                group: 'Specifications',
              },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // 3. KIDS DEPARTMENT
  // ==========================================================================
  {
    id: 'dept_kids',
    name: 'Kids',
    slug: 'kids',
    department: 'KIDS',
    subCategories: [
      {
        id: 'kids_fashion',
        name: 'Fashion',
        slug: 'kids-fashion',
        productTypes: [
          {
            id: 'kids_baby_clothing',
            name: 'Baby Clothing',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'ageGroup',
                label: 'Age Group',
                type: 'select',
                options: ['0–3 Months', '3–6 Months', '6–12 Months', '1–2 Years'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'gender',
                label: 'Gender',
                type: 'select',
                options: ['Unisex / Gender Neutral', 'Baby Boy', 'Baby Girl'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: ['Romper / Onesie', 'Sleepsuit / Footie', 'Baby Frock', 'Baba Suit (Top + Bottom)', 'Jhabla & Nappy Set'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'setIncludes',
                label: 'Set Includes',
                type: 'select',
                options: ['Single Romper', '2-Piece Set', '3-Piece Gift Set'],
                group: 'Specifications',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Organic Cotton', 'Soft Muslin Cotton', 'Hosiery Cotton', 'Fleece (Winter)'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Relaxed Diaper-Friendly Fit', 'Regular Fit'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Cute Animals', 'Cartoon Print', 'Solid Pastel', 'Stripes'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Nickel-Free Snap Buttons at Crotch', 'Envelope Neckline', 'Front Zip with Safety Chin Guard'],
                group: 'Specifications',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Half Sleeve', 'Full Sleeve', 'Sleeveless'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'kids_boys_clothing',
            name: 'Boys Clothing',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: ['Graphic T-Shirt', 'Casual Shirt', 'Denim Jeans', 'Cargo Shorts', 'Track Pants', 'Kurta Set', 'Hoodie'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Slim Fit', 'Relaxed Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Cotton', 'Denim', 'Cotton Twill', 'Cotton Blend'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Graphic Superhero / Cars', 'Solid', 'Striped', 'Checked', 'Colourblock'],
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Half Sleeve', 'Full Sleeve', 'Sleeveless'],
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['Round Neck', 'Polo Collar', 'Shirt Collar', 'Hooded'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Daily Playwear', 'Party & Birthday', 'Festive Celebration', 'School Outing'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'kids_girls_clothing',
            name: 'Girls Clothing',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: ['Frock / Party Dress', 'Top & T-Shirt', 'Skirt Set', 'Jeans & Jeggings', 'Lehenga Set', 'Dungaree'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Fit & Flare', 'Regular Fit', 'Flared Princess'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Pure Cotton', 'Georgette with Cotton Lining', 'Net with Satin', 'Rayon'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Floral Print', 'Polka Dot', 'Sequin Embellished', 'Solid Pastel'],
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Puff Sleeve', 'Short Sleeve', 'Sleeveless', 'Ruffle Sleeve'],
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: ['Round Neck', 'Sweetheart', 'Square Neck', 'Peter Pan Collar'],
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Knee Length', 'Midi Length', 'Floor Length Ankle'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Birthday Party', 'Festive & Puja', 'Casual Daily', 'Wedding Function'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'kids_teens',
            name: 'Teens',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'gender',
                label: 'Gender',
                type: 'select',
                options: ['Teen Boys', 'Teen Girls', 'Unisex'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: ['Oversized Graphic Tee', 'Baggy Cargo Jeans', 'Cropped Hoodie', 'Varsity Jacket', 'Mini Skirt', 'Flared Pants'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Oversized Streetwear Fit', 'Slim Fit', 'Relaxed Baggy'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Heavyweight Cotton (220+ GSM)', 'Denim', 'French Terry Fleece'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Y2K Graphic', 'Typography', 'Vintage Washed', 'Solid Minimal'],
                group: 'Styling & Fit',
              },
              {
                id: 'style',
                label: 'Style',
                type: 'select',
                options: ['Streetwear', 'Korean Aesthetic', 'Casual Core', 'Trendy Chic'],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['College & Coaching', 'Casual Hangout', 'Party', 'Weekend Wear'],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'kids_innerwear',
            name: 'Kids Innerwear',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'type',
                label: 'Type',
                type: 'select',
                options: ['Boys Briefs / Trunks', 'Girls Bloomers / Panties', 'Camisoles / Slips', 'Cotton Vests', 'Kids Thermals'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['100% Pure Combed Cotton (Antiallergic)'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'packSize',
                label: 'Pack Size',
                type: 'select',
                options: ['Pack of 3', 'Pack of 5 Assorted'],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Soft Elastic Gentle Fit', 'Tagless Comfort Fit'],
                group: 'Styling & Fit',
              },
              {
                id: 'ageGroup',
                label: 'Age Group',
                type: 'select',
                options: ['2–4 Years', '4–6 Years', '6–8 Years', '8–10 Years', '10–12 Years', '12–14 Years'],
                required: true,
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'kids_ethnic_wear',
            name: 'Kids Ethnic Wear',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: [
                  'Boys Kurta Pyjama',
                  'Boys Kurta Dhoti Set',
                  'Boys Sherwani / Indo-Western',
                  'Girls Lehenga Choli',
                  'Girls Sharara Set',
                  'Girls Anarkali Gown',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'setIncludes',
                label: 'Set Includes',
                type: 'select',
                options: ['Kurta + Pajama', 'Kurta + Pajama + Jacket (3 Pcs)', 'Lehenga + Choli + Dupatta'],
                group: 'Specifications',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Cotton Silk', 'Soft Brocade', 'Georgette with Pure Cotton Lining', 'Chanderi'],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Woven Jacquard', 'Traditional Foil Print', 'Bandhani', 'Floral'],
                group: 'Styling & Fit',
              },
              {
                id: 'embroidery',
                label: 'Embroidery',
                type: 'select',
                options: ['Soft Zari Border', 'Gota Patti', 'Resham Neck Work (Gentle on Skin)'],
                group: 'Details & Work',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: ['Diwali / Festive', 'Wedding Family Function', 'Puja & Cultural Day'],
                group: 'Care & Details',
              },
              {
                id: 'gender',
                label: 'Gender',
                type: 'select',
                options: ['Boys', 'Girls'],
                required: true,
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================================
// 4. HELPER RESOLVER FUNCTIONS
// ============================================================================

/**
 * Given a categoryId, slug or productTypeId, locate the best matching ProductTypeDefinition.
 */
export function resolveAttributeTemplate(
  categoryId?: string,
  productTypeId?: string,
): ProductTypeDefinition {
  // 1. Direct productTypeId lookup
  if (productTypeId) {
    for (const main of CATEGORY_ENGINE_TAXONOMY) {
      for (const sub of main.subCategories) {
        for (const pt of sub.productTypes) {
          if (pt.id === productTypeId) return pt;
        }
      }
    }
  }

  const normalized = (categoryId || '').toLowerCase();

  // 2. Direct slug or ID match in hierarchy
  for (const main of CATEGORY_ENGINE_TAXONOMY) {
    for (const sub of main.subCategories) {
      for (const pt of sub.productTypes) {
        if (normalized === pt.id || normalized === pt.name.toLowerCase()) {
          return pt;
        }
      }
    }
  }

  // 3. Exact Category Mappings
  if (normalized.includes('jean') || normalized.includes('denim')) {
    return resolveAttributeTemplate(undefined, 'men_jeans');
  }
  if (normalized.includes('chino')) {
    return resolveAttributeTemplate(undefined, 'men_chinos');
  }
  if (normalized.includes('cargo')) {
    return resolveAttributeTemplate(undefined, 'men_cargo_pants');
  }
  if (normalized.includes('short')) {
    return resolveAttributeTemplate(undefined, 'men_shorts');
  }
  if (normalized.includes('trackpant') || normalized.includes('track_pant') || normalized.includes('track-pant')) {
    return resolveAttributeTemplate(undefined, 'men_track_pants');
  }
  if (normalized.includes('trouser')) {
    if (normalized.includes('formal')) return resolveAttributeTemplate(undefined, 'men_formal_trousers');
    return resolveAttributeTemplate(undefined, 'men_trousers');
  }
  if (normalized.includes('tshirt') || normalized.includes('t-shirt') || normalized.includes('tee')) {
    if (normalized.includes('women')) return resolveAttributeTemplate(undefined, 'women_tops_tees');
    return resolveAttributeTemplate(undefined, 'men_tshirts');
  }
  if (normalized.includes('shirt')) {
    if (normalized.includes('formal')) return resolveAttributeTemplate(undefined, 'men_formal_shirts');
    return resolveAttributeTemplate(undefined, 'men_shirts');
  }
  if (normalized.includes('polo')) {
    return resolveAttributeTemplate(undefined, 'men_polos');
  }
  if (normalized.includes('hoodie') || normalized.includes('sweatshirt')) {
    return resolveAttributeTemplate(undefined, 'men_hoodies');
  }
  if (normalized.includes('jacket') || normalized.includes('coat')) {
    if (normalized.includes('nehru')) return resolveAttributeTemplate(undefined, 'men_nehru_jackets');
    return resolveAttributeTemplate(undefined, 'men_jackets');
  }
  if (normalized.includes('blazer')) {
    return resolveAttributeTemplate(undefined, 'men_blazers');
  }
  if (normalized.includes('suit') && normalized.includes('formal')) {
    return resolveAttributeTemplate(undefined, 'men_suits');
  }
  if (normalized.includes('sherwani')) {
    return resolveAttributeTemplate(undefined, 'men_sherwanis');
  }
  if (normalized.includes('saree')) {
    return resolveAttributeTemplate(undefined, 'women_sarees');
  }
  if (normalized.includes('lehenga')) {
    if (normalized.includes('kid')) return resolveAttributeTemplate(undefined, 'kids_ethnic_wear');
    return resolveAttributeTemplate(undefined, 'women_lehengas');
  }
  if (normalized.includes('kurta_set') || normalized.includes('kurta-set')) {
    if (normalized.includes('men')) return resolveAttributeTemplate(undefined, 'men_kurta_sets');
    return resolveAttributeTemplate(undefined, 'women_kurta_sets');
  }
  if (normalized.includes('kurta')) {
    if (normalized.includes('men')) return resolveAttributeTemplate(undefined, 'men_kurtas');
    return resolveAttributeTemplate(undefined, 'women_kurtas');
  }
  if (normalized.includes('dress') || normalized.includes('gown')) {
    return resolveAttributeTemplate(undefined, 'women_dresses');
  }
  if (normalized.includes('jumpsuit')) {
    return resolveAttributeTemplate(undefined, 'women_jumpsuits');
  }
  if (normalized.includes('skirt')) {
    return resolveAttributeTemplate(undefined, 'women_skirts');
  }
  if (normalized.includes('coord') || normalized.includes('co-ord')) {
    return resolveAttributeTemplate(undefined, 'women_coords');
  }
  if (normalized.includes('bra')) {
    return resolveAttributeTemplate(undefined, 'women_bras');
  }
  if (normalized.includes('panties') || normalized.includes('panty')) {
    return resolveAttributeTemplate(undefined, 'women_panties');
  }
  if (normalized.includes('shapewear')) {
    return resolveAttributeTemplate(undefined, 'women_shapewear');
  }
  if (normalized.includes('camisole')) {
    return resolveAttributeTemplate(undefined, 'women_camisoles');
  }
  if (normalized.includes('maternity') || normalized.includes('feeding')) {
    return resolveAttributeTemplate(undefined, 'women_maternity');
  }
  if (normalized.includes('sleepwear') || normalized.includes('nighty') || normalized.includes('pyjama')) {
    return resolveAttributeTemplate(undefined, 'women_sleepwear');
  }
  if (normalized.includes('handbag') || normalized.includes('tote')) {
    return resolveAttributeTemplate(undefined, 'women_handbags');
  }
  if (normalized.includes('sling')) {
    return resolveAttributeTemplate(undefined, 'women_sling_bags');
  }
  if (normalized.includes('wallet')) {
    return resolveAttributeTemplate(undefined, 'men_wallets');
  }
  if (normalized.includes('belt')) {
    return resolveAttributeTemplate(undefined, 'men_belts');
  }
  if (normalized.includes('watch')) {
    if (normalized.includes('women')) return resolveAttributeTemplate(undefined, 'women_watches');
    return resolveAttributeTemplate(undefined, 'men_watches');
  }
  if (normalized.includes('sunglass') || normalized.includes('eyewear')) {
    return resolveAttributeTemplate(undefined, 'men_sunglasses');
  }
  if (normalized.includes('jewel')) {
    return resolveAttributeTemplate(undefined, 'women_jewellery');
  }
  if (normalized.includes('baby') || normalized.includes('infant') || normalized.includes('romper')) {
    return resolveAttributeTemplate(undefined, 'kids_baby_clothing');
  }
  if (normalized.includes('boy')) {
    return resolveAttributeTemplate(undefined, 'kids_boys_clothing');
  }
  if (normalized.includes('girl')) {
    return resolveAttributeTemplate(undefined, 'kids_girls_clothing');
  }
  if (normalized.includes('teen')) {
    return resolveAttributeTemplate(undefined, 'kids_teens');
  }
  if (normalized.includes('activewear') || normalized.includes('sports')) {
    if (normalized.includes('women')) return resolveAttributeTemplate(undefined, 'women_activewear');
    return resolveAttributeTemplate(undefined, 'men_activewear');
  }

  // 4. Default Fallback
  return CATEGORY_ENGINE_TAXONOMY[0].subCategories[0].productTypes[0];
}

/**
 * Resolves available sizes list based on category & product type.
 */
export function resolveSizeSystem(categoryId?: string, productTypeId?: string): string[] {
  const template = resolveAttributeTemplate(categoryId, productTypeId);
  const sizeSystem = SIZE_SYSTEMS[template.sizeSystemId] || SIZE_SYSTEMS.MEN_CLOTHING;
  return sizeSystem.sizes;
}
