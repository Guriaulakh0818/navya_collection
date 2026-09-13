/**
 * NAVYA COLLECTION — DYNAMIC PRODUCT ATTRIBUTE ENGINE & TEMPLATE REGISTRY
 *
 * Architecture:
 * Department -> Category -> Subcategory -> Product Type -> Attribute Template -> Seller Product Form -> Product -> Variants
 *
 * Future-proof: Any new department (e.g. Shoes, Home & Living, Beauty) can be registered
 * with an attribute template without changing database models or core logic.
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
    'Styling & Fit' | 'Fabric & Material' | 'Details & Work' | 'Specifications' | 'Care & Details';
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
    'MEN_CLOTHING' | 'MEN_BOTTOMWEAR' | 'WOMEN_CLOTHING' | 'KIDS_AGE' | 'ACCESSORIES_ONE_SIZE';
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
    description: 'Standard alpha sizes for men topwear, ethnic wear & jackets',
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
    description: 'Standard alpha sizes for Kurtas, Dresses, Tops, Lehengas & Co-ords',
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
// 2. COMMON FABRICS, PATTERNS & OCCASIONS CONSTANTS
// ============================================================================
export const COMMON_PATTERNS = [
  'Solid / Plain',
  'Floral Print',
  'Striped',
  'Checked',
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
  'Chanderi',
  'Georgette',
  'Chiffon',
  'Rayon / Viscose',
  'Linen',
  'Velvet',
  'Organza',
  'Denim',
  'Satin',
  'Crepe',
  'Khadi',
  'Modal',
  'Fleece',
  'Polyester / Elastane',
  'Net / Mesh',
];

// ============================================================================
// 3. CATEGORY TAXONOMY & ATTRIBUTE TEMPLATE DEFINITIONS
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
                options: ['Regular Fit', 'Slim Fit', 'Oversized Fit', 'Relaxed Fit', 'Boxy Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck / Collar',
                type: 'select',
                options: [
                  'Round Neck / Crew Neck',
                  'V-Neck',
                  'Polo Neck',
                  'Henley Neck',
                  'Mandarin / Turtle Neck',
                  'Hooded',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve Length',
                type: 'select',
                options: ['Half Sleeve', 'Full Sleeve', 'Sleeveless', 'Short Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: COMMON_PATTERNS,
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
                label: 'GSM (Fabric Weight)',
                type: 'select',
                options: [
                  '160 GSM (Lightweight)',
                  '180 GSM (Standard)',
                  '220 GSM (Heavyweight)',
                  '240+ GSM (Super Heavy)',
                ],
                group: 'Fabric & Material',
              },
              {
                id: 'stretch',
                label: 'Stretchability',
                type: 'select',
                options: ['Non-Stretch', 'Low Stretch', 'Medium Stretch', 'High Stretch / 4-Way'],
                group: 'Fabric & Material',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: ['Regular Length', 'Longline', 'Crop'],
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
            name: 'Shirts (Casual & Formal)',
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
                options: [
                  'Spread Collar',
                  'Button-Down Collar',
                  'Mandarin / Band Collar',
                  'Cuban / Camp Collar',
                  'Cutaway Collar',
                  'Wingtip Collar',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve Length',
                type: 'select',
                options: ['Full Sleeve', 'Half Sleeve', 'Roll-Up Sleeve'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: [
                  'Solid / Plain',
                  'Striped',
                  'Checked / Plaid',
                  'Printed',
                  'Textured / Self Design',
                ],
                group: 'Styling & Fit',
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
                options: ['Button Placket', 'Concealed Buttons', 'Zip Front'],
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
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: [
                  'Formal / Office',
                  'Casual Everyday',
                  'Party & Evening',
                  'Clubwear',
                  'Resort / Vacation',
                ],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'men_polos',
            name: 'Polo T-Shirts',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Slim Fit', 'Classic Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'collar',
                label: 'Collar',
                type: 'select',
                options: [
                  'Ribbed Polo Collar',
                  'Contrast Tipped Collar',
                  'Button-Down Polo Collar',
                  'Zipper Polo',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: ['Half Sleeve (Ribbed Cuff)', 'Full Sleeve', 'Short Sleeve'],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Solid / Pique', 'Striped', 'Colourblocked', 'Tipped Details'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  '100% Cotton Pique',
                  'Matty Cotton',
                  'Mercerized Cotton',
                  'Dri-Fit Polyester',
                ],
                group: 'Fabric & Material',
              },
            ],
          },
          {
            id: 'men_hoodies',
            name: 'Hoodies & Sweatshirts',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Oversized Fit', 'Relaxed Fit'],
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck / Hood',
                type: 'select',
                options: [
                  'Drawstring Hood',
                  'Crew Neck (Sweatshirt)',
                  'Zip High Neck',
                  'Mock Neck',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Pullover', 'Full Front Zipper', 'Half Zip'],
                group: 'Styling & Fit',
              },
              {
                id: 'fleece',
                label: 'Fleece / Lining',
                type: 'select',
                options: [
                  'Fleece Lined (Warm)',
                  'French Terry (Medium Weight)',
                  'Unlined (Lightweight)',
                ],
                group: 'Fabric & Material',
              },
              {
                id: 'pocket',
                label: 'Pocket',
                type: 'select',
                options: ['Kangaroo Pocket', 'Side Slash Pockets', 'No Pocket'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_jackets',
            name: 'Jackets & Coats',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'jacketType',
                label: 'Jacket Type',
                type: 'select',
                options: [
                  'Bomber Jacket',
                  'Denim Jacket',
                  'Biker / Leather Jacket',
                  'Puffer / Quilted Jacket',
                  'Windbreaker',
                  'Varsity Jacket',
                  'Overcoat',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Regular Fit', 'Slim Fit', 'Tailored Fit', 'Boxy Fit'],
                group: 'Styling & Fit',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Full Zip', 'Snap Buttons', 'Button Front', 'Zip with Flap'],
                group: 'Styling & Fit',
              },
              {
                id: 'waterResistance',
                label: 'Water Resistance',
                type: 'select',
                options: ['Waterproof', 'Water Resistant', 'Not Water Resistant'],
                group: 'Specifications',
              },
              {
                id: 'hood',
                label: 'Hood',
                type: 'select',
                options: ['Detachable Hood', 'Attached Hood', 'Without Hood'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },
      {
        id: 'men_bottomwear',
        name: 'Bottomwear',
        slug: 'men-bottomwear',
        productTypes: [
          {
            id: 'men_jeans',
            name: 'Jeans & Denims',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: [
                  'Skinny Fit',
                  'Slim Fit',
                  'Straight Fit',
                  'Relaxed Fit',
                  'Baggy Fit',
                  'Wide Leg',
                  'Bootcut',
                  'Flared Fit',
                  'Tapered Fit',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'rise',
                label: 'Rise',
                type: 'select',
                options: ['Mid Rise', 'Low Rise', 'High Rise'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'stretch',
                label: 'Stretch',
                type: 'select',
                options: [
                  'Stretchable (Comfort)',
                  'High Stretch',
                  'Rigid (100% Cotton Non-Stretch)',
                ],
                group: 'Fabric & Material',
              },
              {
                id: 'wash',
                label: 'Denim Wash',
                type: 'select',
                options: [
                  'Dark Wash / Raw Indigo',
                  'Medium Blue Wash',
                  'Light Ice Wash',
                  'Acid Wash',
                  'Stone Wash',
                  'Black / Charcoal Wash',
                  'White Denim',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'pattern',
                label: 'Distress / Styling',
                type: 'select',
                options: [
                  'Clean / Non-Distressed',
                  'Mild Whisker & Faded',
                  'Knee Slit / Ripped',
                  'Heavy Distressed / Patchwork',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'denimWeight',
                label: 'Denim Weight',
                type: 'select',
                options: [
                  'Lightweight (9-11 oz)',
                  'Medium Weight (11-13 oz)',
                  'Heavyweight (13+ oz)',
                ],
                group: 'Specifications',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: ['Button & Zip Fly', 'Button Fly'],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'men_trousers',
            name: 'Trousers & Chinos',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Fit', 'Tapered Fit', 'Relaxed Fit'],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'rise',
                label: 'Rise',
                type: 'select',
                options: ['Mid Rise', 'High Rise', 'Low Rise'],
                group: 'Styling & Fit',
              },
              {
                id: 'pleats',
                label: 'Pleats',
                type: 'select',
                options: ['Flat Front (No Pleats)', 'Single Pleat', 'Double Pleat'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: ['Cotton Twill', 'Poly-Viscose Formal Blend', 'Linen Blend', 'Wool Blend'],
                group: 'Fabric & Material',
              },
            ],
          },
          {
            id: 'men_cargos',
            name: 'Cargo Pants & Track Pants',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Relaxed Cargo', 'Jogger / Tapered Fit', 'Straight Fit', 'Baggy Cargo'],
                group: 'Styling & Fit',
              },
              {
                id: 'numberPockets',
                label: 'Number of Pockets',
                type: 'select',
                options: ['4 Pockets', '6 Pockets (Utility)', '8+ Tactical Pockets'],
                group: 'Styling & Fit',
              },
              {
                id: 'waistType',
                label: 'Waist Type',
                type: 'select',
                options: [
                  'Elastic Waist with Drawstring',
                  'Button Waist with Belt Loops',
                  'Hybrid Waist',
                ],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },
      {
        id: 'men_ethnic',
        name: 'Ethnic Wear',
        slug: 'men-ethnic',
        productTypes: [
          {
            id: 'men_kurtas',
            name: 'Kurtas & Kurta Sets',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'kurtaType',
                label: 'Kurta Type',
                type: 'select',
                options: [
                  'Straight Long Kurta',
                  'Short Kurta',
                  'Pathani Kurta',
                  'Asymmetric Hem Kurta',
                  'Anarkali Kurta',
                  'Angrakha Kurta',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'setIncludes',
                label: 'Set Includes',
                type: 'select',
                options: [
                  'Kurta Only',
                  'Kurta + Pyjama',
                  'Kurta + Churidar',
                  'Kurta + Dhoti',
                  'Kurta + Pyjama + Nehru Jacket Set',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  'Pure Cotton',
                  'Silk Blend / Raw Silk',
                  'Chanderi Silk',
                  'Linen',
                  'Jacquard',
                  'Khadi',
                ],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'collarNeck',
                label: 'Collar / Neck',
                type: 'select',
                options: [
                  'Mandarin Collar',
                  'Bandhgala Neck',
                  'Round Neck with Slit',
                  'Shirt Collar',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'embroidery',
                label: 'Embroidery & Work',
                type: 'select',
                options: [
                  'Chikankari Handwork',
                  'Thread Embroidery',
                  'Mirror Work',
                  'Zari & Resham Work',
                  'Sequin Highlights',
                  'Plain / Self Textured',
                ],
                group: 'Details & Work',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: [
                  'Wedding & Groom Wear',
                  'Diwali / Eid / Festive',
                  'Haldi / Mehendi',
                  'Puja & Traditional Rituals',
                  'Casual Ethnic',
                ],
                required: true,
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'men_sherwanis',
            name: 'Sherwanis & Indo-Western',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'sherwaniType',
                label: 'Sherwani Type',
                type: 'select',
                options: [
                  'Bridal / Groom Sherwani',
                  'Indo-Western Achkan',
                  'Jodhpuri Royal Bandhgala',
                  'Open Front Layered Sherwani',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  'Banarasi Brocade Silk',
                  'Velvet',
                  'Raw Silk',
                  'Georgette Embroidered',
                  'Jacquard',
                ],
                group: 'Fabric & Material',
              },
              {
                id: 'embroidery',
                label: 'Work / Craft',
                type: 'select',
                options: [
                  'Heavy Zardozi Work',
                  'Aari & Resham Work',
                  'Gotta Patti Work',
                  'Pearl & Stone Work',
                  'Self Brocade Weave',
                ],
                group: 'Details & Work',
              },
            ],
          },
          {
            id: 'men_nehru_jackets',
            name: 'Nehru Jackets & Waistcoats',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'fit',
                label: 'Fit',
                type: 'select',
                options: ['Slim Fit', 'Tailored Fit', 'Regular Fit'],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  'Silk Brocade',
                  'Jute / Khadi Blend',
                  'Tweed / Wool Blend',
                  'Cotton Linen',
                  'Velvet',
                ],
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: ['Self Brocade Weave', 'Floral Printed', 'Solid / Plain', 'Embroidered'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },
      {
        id: 'men_formal',
        name: 'Formal & Suits',
        slug: 'men-formal',
        productTypes: [
          {
            id: 'men_blazers_suits',
            name: 'Blazers, Tuxedos & Suits',
            sizeSystemId: 'MEN_CLOTHING',
            attributes: [
              {
                id: 'suitType',
                label: 'Type',
                type: 'select',
                options: [
                  'Single Blazer',
                  '2-Piece Suit (Blazer + Trouser)',
                  '3-Piece Suit (Blazer + Vest + Trouser)',
                  'Tuxedo / Dinner Suit',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fit',
                label: 'Blazer Fit',
                type: 'select',
                options: ['Slim Fit', 'Regular Fit', 'Super Slim Fit'],
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
                id: 'numberButtons',
                label: 'Number of Buttons',
                type: 'select',
                options: [
                  'Single Button',
                  '2 Buttons (Classic)',
                  'Double Breasted 4 Buttons',
                  'Double Breasted 6 Buttons',
                ],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },
      {
        id: 'men_accessories',
        name: 'Accessories',
        slug: 'men-accessories',
        productTypes: [
          {
            id: 'men_wallets',
            name: 'Wallets & Card Holders',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'walletType',
                label: 'Wallet Type',
                type: 'select',
                options: [
                  'Bi-Fold Wallet',
                  'Tri-Fold Wallet',
                  'Slim Card Holder',
                  'Money Clip Wallet',
                  'Zip-Around Travel Wallet',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'material',
                label: 'Material',
                type: 'select',
                options: [
                  'Genuine Top-Grain Leather',
                  'Genuine Napa Leather',
                  'Vegan / PU Leather',
                  'Canvas / Nylon',
                ],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'rfidProtection',
                label: 'RFID Protection',
                type: 'select',
                options: ['Yes (RFID Blocking)', 'No'],
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'men_belts',
            name: 'Belts',
            sizeSystemId: 'MEN_BOTTOMWEAR',
            attributes: [
              {
                id: 'beltType',
                label: 'Belt Type',
                type: 'select',
                options: [
                  'Formal Leather Belt',
                  'Casual Reversible Belt',
                  'Canvas / Webbing Belt',
                  'Braided / Woven Belt',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'buckleType',
                label: 'Buckle Type',
                type: 'select',
                options: [
                  'Classic Pin Buckle',
                  'Automatic Ratchet Buckle',
                  'Plate Buckle',
                  'Reversible Twist Buckle',
                ],
                group: 'Details & Work',
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
                options: [
                  'Analog Watch',
                  'Chronograph Watch',
                  'Automatic Mechanical',
                  'Digital Watch',
                  'Smart Hybrid',
                ],
                required: true,
                group: 'Specifications',
              },
              {
                id: 'strapMaterial',
                label: 'Strap Material',
                type: 'select',
                options: [
                  'Genuine Leather',
                  'Stainless Steel Mesh / Chain',
                  'Silicone / Rubber',
                  'Ceramic',
                ],
                group: 'Fabric & Material',
              },
              {
                id: 'waterResistance',
                label: 'Water Resistance',
                type: 'select',
                options: [
                  '3 ATM / 30m (Splash Resistant)',
                  '5 ATM / 50m (Swimming)',
                  '10 ATM / 100m+ (Diving)',
                ],
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
      {
        id: 'women_ethnic',
        name: 'Ethnic & Festive Wear',
        slug: 'women-ethnic',
        productTypes: [
          {
            id: 'women_sarees',
            name: 'Sarees',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'sareeType',
                label: 'Saree Type / Craft',
                type: 'select',
                options: [
                  'Banarasi Silk Saree',
                  'Kanjivaram Silk Saree',
                  'Chanderi Saree',
                  'Bandhani / Leheriya',
                  'Organza Saree',
                  'Georgette Saree',
                  'Chiffon Saree',
                  'Pure Cotton Saree',
                  'Ready to Wear / 1-Minute Saree',
                  'Ruffle Saree',
                  'Paithani Silk',
                  'Tussar Silk',
                ],
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
                id: 'sareeLength',
                label: 'Saree Length',
                type: 'select',
                options: ['5.5 Metres (Standard)', '6.0 Metres (With Blouse)', '6.3 Metres'],
                group: 'Specifications',
              },
              {
                id: 'blouseIncluded',
                label: 'Blouse Piece',
                type: 'select',
                options: [
                  'Unstitched Blouse Piece Included (0.8m)',
                  'Ready-Made Stitched Blouse Included',
                  'Without Blouse Piece',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'blouseFabric',
                label: 'Blouse Fabric',
                type: 'text',
                placeholder: 'e.g. Heavy Brocade Silk, Embroidered Net, Matching Raw Silk',
                group: 'Fabric & Material',
              },
              {
                id: 'border',
                label: 'Border Type',
                type: 'select',
                options: [
                  'Zari Woven Border',
                  'Embroidered Border',
                  'Scalloped Border',
                  'Contrast Temple Border',
                  'Gotta Patti Border',
                  'No Border / Minimal',
                ],
                group: 'Details & Work',
              },
              {
                id: 'embroidery',
                label: 'Embroidery & Embellishments',
                type: 'select',
                options: [
                  'Zari Work',
                  'Resham Thread Work',
                  'Mirror Work',
                  'Sequin & Cutdana',
                  'Gotta Patti',
                  'Hand-Painted Kalamkari',
                  'Plain Woven',
                ],
                group: 'Details & Work',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: COMMON_OCCASIONS,
                required: true,
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'women_kurtas_sets',
            name: 'Kurtas & Kurta Sets',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'kurtaType',
                label: 'Kurta Silhouette / Style',
                type: 'select',
                options: [
                  'Straight Fit Kurta',
                  'A-Line Kurta',
                  'Anarkali Flared',
                  'Angrakha Style',
                  'Kaftan Kurti',
                  'Short Peplum Kurti',
                  'Floor Length Gown Kurta',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'setIncludes',
                label: 'Set Includes',
                type: 'select',
                options: [
                  'Kurta Only',
                  'Kurta + Pant / Trouser Set',
                  'Kurta + Palazzos Set',
                  'Kurta + Sharara / Gharara Set',
                  'Kurta + Skirt Set',
                  '3-Piece Set with Dupatta',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'dupattaIncluded',
                label: 'Dupatta Included',
                type: 'select',
                options: ['Yes (With Matching / Contrast Dupatta)', 'No Dupatta'],
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck Style',
                type: 'select',
                options: [
                  'Round Neck',
                  'V-Neck',
                  'Sweetheart Neck',
                  'Mandarin / Keyhole Collar',
                  'Boat Neck',
                  'Square Neck',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve Length',
                type: 'select',
                options: [
                  '3/4th Sleeve',
                  'Full Sleeve',
                  'Half Sleeve',
                  'Sleeveless',
                  'Bell / Puff Sleeve',
                ],
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
                id: 'embroidery',
                label: 'Work / Craft',
                type: 'select',
                options: [
                  'Lucknowi Chikankari',
                  'Gotta Patti Work',
                  'Thread & Zari Embroidery',
                  'Mirror Work',
                  'Block Printed',
                  'Digital Printed',
                ],
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
            id: 'women_lehengas',
            name: 'Lehenga Cholis',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'lehengaType',
                label: 'Lehenga Type',
                type: 'select',
                options: [
                  'Bridal Lehenga',
                  'Festive / Party Lehenga',
                  'Semi-Stitched Lehenga',
                  'Ready-to-Wear Lehenga',
                  'Crop Top & Skirt Set',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Lehenga Fabric',
                type: 'select',
                options: [
                  'Velvet',
                  'Pure Silk / Raw Silk',
                  'Banarasi Brocade',
                  'Georgette',
                  'Net with Satin Lining',
                  'Organza',
                ],
                group: 'Fabric & Material',
              },
              {
                id: 'blouseFabric',
                label: 'Blouse Fabric',
                type: 'text',
                placeholder: 'e.g. Heavy Hand-Embroidered Velvet (Unstitched / Stitched)',
                group: 'Fabric & Material',
              },
              {
                id: 'embroidery',
                label: 'Craft & Embroidery',
                type: 'select',
                options: [
                  'Zardozi & Resham Work',
                  'Heavy Sequin & Dori Work',
                  'Mirror & Pearl Work',
                  'Gotta Patti & Zari',
                  'Digital Floral Print',
                ],
                group: 'Details & Work',
              },
              {
                id: 'closure',
                label: 'Waist Closure',
                type: 'select',
                options: ['Drawstring with Heavy Latkan Tassels', 'Concealed Side Zipper & Hook'],
                group: 'Styling & Fit',
              },
            ],
          },
        ],
      },
      {
        id: 'women_western',
        name: 'Western & Fusion Wear',
        slug: 'women-western',
        productTypes: [
          {
            id: 'women_dresses',
            name: 'Dresses & Gowns',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'dressType',
                label: 'Dress Type / Silhouette',
                type: 'select',
                options: [
                  'Maxi Dress',
                  'Midi Dress',
                  'Mini / Short Dress',
                  'A-Line Dress',
                  'Bodycon Dress',
                  'Fit & Flare Dress',
                  'Wrap Dress',
                  'Shift / Shirt Dress',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'length',
                label: 'Length',
                type: 'select',
                options: [
                  'Ankle / Floor Length',
                  'Midi / Calf Length',
                  'Knee Length',
                  'Above Knee',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neckline',
                type: 'select',
                options: [
                  'V-Neck',
                  'Square Neck',
                  'Sweetheart Neck',
                  'Cowl Neck',
                  'Round Neck',
                  'Off-Shoulder',
                  'Halter Neck',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: [
                  'Sleeveless / Strappy',
                  'Puff Sleeves',
                  'Bell Sleeves',
                  'Full Sleeves',
                  'Cap Sleeves',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  'Cotton',
                  'Georgette',
                  'Satin / Silk Blend',
                  'Rayon',
                  'Linen',
                  'Velvet',
                  'Denim',
                ],
                group: 'Fabric & Material',
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
                options: [
                  'Slim Fit',
                  'Regular Fit',
                  'Crop Top',
                  'Oversized / Boyfriend Fit',
                  'Peplum Fit',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'neck',
                label: 'Neck',
                type: 'select',
                options: [
                  'Round Neck',
                  'V-Neck',
                  'Square Neck',
                  'Boat Neck',
                  'Halter Neck',
                  'Collared',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'sleeve',
                label: 'Sleeve',
                type: 'select',
                options: [
                  'Half Sleeve',
                  'Sleeveless',
                  'Full Sleeve',
                  'Puff Sleeve',
                  'Ruffle Sleeve',
                ],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'women_coords',
            name: 'Co-ord Sets & Jumpsuits',
            sizeSystemId: 'WOMEN_CLOTHING',
            attributes: [
              {
                id: 'setType',
                label: 'Set Type',
                type: 'select',
                options: [
                  'Top + Trouser Set',
                  'Blazer + Pant Co-ord',
                  'Crop Top + Skirt Set',
                  'Shirt + Shorts Set',
                  '1-Piece Jumpsuit',
                  '1-Piece Dungaree',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  'Pure Cotton',
                  'Linen Blend',
                  'Satin',
                  'Crepe',
                  'Rayon',
                  'Knitted / Ribbed',
                ],
                group: 'Fabric & Material',
              },
            ],
          },
        ],
      },
      {
        id: 'women_accessories',
        name: 'Accessories & Jewellery',
        slug: 'women-accessories',
        productTypes: [
          {
            id: 'women_handbags',
            name: 'Handbags, Totes & Sling Bags',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'bagType',
                label: 'Bag Style',
                type: 'select',
                options: [
                  'Tote Bag',
                  'Shoulder Bag',
                  'Sling / Crossbody Bag',
                  'Satchel',
                  'Clutch / Potli Bag',
                  'Backpack',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'material',
                label: 'Material',
                type: 'select',
                options: [
                  'Premium Vegan Leather (PU)',
                  'Genuine Leather',
                  'Canvas / Jute',
                  'Jacquard / Brocade Silk',
                  'Velvet Embroidered',
                ],
                group: 'Fabric & Material',
              },
              {
                id: 'closure',
                label: 'Closure',
                type: 'select',
                options: [
                  'Main Zipper Closure',
                  'Magnetic Snap Button',
                  'Drawstring with Tassels',
                  'Flap Lock',
                ],
                group: 'Details & Work',
              },
              {
                id: 'compartments',
                label: 'Number of Compartments',
                type: 'select',
                options: [
                  '1 Main Compartment',
                  '2 Compartments + Inner Pockets',
                  '3 Compartments (Organized)',
                ],
                group: 'Specifications',
              },
            ],
          },
          {
            id: 'women_jewellery',
            name: 'Fashion & Bridal Jewellery',
            sizeSystemId: 'ACCESSORIES_ONE_SIZE',
            attributes: [
              {
                id: 'jewelleryType',
                label: 'Jewellery Type',
                type: 'select',
                options: [
                  'Necklace & Choker Set',
                  'Earrings & Jhumkas',
                  'Bangles & Kadas',
                  'Maang Tikka & Passa',
                  'Rings & Haathphool',
                  'Anklets / Payal',
                  'Complete Bridal Set',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'plating',
                label: 'Plating / Finish',
                type: 'select',
                options: [
                  '18K/24K Gold Plated',
                  'Antique Matte Gold',
                  'Silver Plated',
                  'Rose Gold Plated',
                  'Oxidised Silver',
                  'Rhodium Polish',
                ],
                group: 'Details & Work',
              },
              {
                id: 'stoneType',
                label: 'Stone & Work',
                type: 'select',
                options: [
                  'Kundan & Meenakari',
                  'Polki & Pearls',
                  'American Diamond / CZ',
                  'Temple Jewellery Work',
                  'Beaded / Thread Work',
                ],
                group: 'Details & Work',
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
        id: 'kids_clothing',
        name: 'Kids Fashion (Boys & Girls)',
        slug: 'kids-clothing',
        productTypes: [
          {
            id: 'kids_boys_wear',
            name: 'Boys Clothing',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: [
                  'T-Shirt / Polo',
                  'Shirt',
                  'Jeans / Denims',
                  'Kurta Pyjama / Dhoti Set',
                  'Sherwani / Indo-Western',
                  'Suit / Blazer Set',
                  'Shorts & Track Pants',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  '100% Cotton (Skin-Friendly)',
                  'Cotton Blend',
                  'Silk Blend (Ethnic)',
                  'Denim',
                  'Hosiery / French Terry',
                ],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: [
                  'Cartoon / Graphic Character',
                  'Solid / Plain',
                  'Stripes / Checks',
                  'Ethnic Embroidery',
                  'Printed',
                ],
                group: 'Styling & Fit',
              },
              {
                id: 'occasion',
                label: 'Occasion',
                type: 'select',
                options: [
                  'Casual / Playwear',
                  'Party & Birthday',
                  'Festive & Traditional',
                  'School / Sports',
                ],
                group: 'Care & Details',
              },
            ],
          },
          {
            id: 'kids_girls_wear',
            name: 'Girls Clothing',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: [
                  'Frock / Party Dress',
                  'Lehenga Choli Set',
                  'Kurti & Palazzos / Sharara',
                  'Top & Skirt Set',
                  'Jumpsuit / Dungaree',
                  'Jeans & Jeggings',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  '100% Soft Cotton',
                  'Net with Soft Cotton Lining',
                  'Silk Blend / Chanderi',
                  'Georgette',
                  'Satin',
                ],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'pattern',
                label: 'Pattern',
                type: 'select',
                options: [
                  'Floral Print',
                  'Sequin / Sparkle Details',
                  'Gotta & Zari Border',
                  'Solid with Bow / Belt',
                  'Embroidered',
                ],
                group: 'Styling & Fit',
              },
            ],
          },
          {
            id: 'kids_infant_baby',
            name: 'Baby & Infant Wear (0-2 Yrs)',
            sizeSystemId: 'KIDS_AGE',
            attributes: [
              {
                id: 'productType',
                label: 'Product Type',
                type: 'select',
                options: [
                  'Romper / Onesie',
                  'Sleepsuit with Footies',
                  'Baba Suit (Top + Bottom)',
                  'Baby Frock',
                  'Baby Kurta Pyjama',
                ],
                required: true,
                group: 'Styling & Fit',
              },
              {
                id: 'fabric',
                label: 'Fabric',
                type: 'select',
                options: [
                  '100% Organic Cotton',
                  'Soft Hosiery Cotton',
                  'Muslin Cotton',
                  'Fleece (Winter)',
                ],
                required: true,
                group: 'Fabric & Material',
              },
              {
                id: 'closure',
                label: 'Diaper Friendly Closure',
                type: 'select',
                options: [
                  'Snap Buttons at Crotch',
                  'Front Zipper with Safety Tab',
                  'Envelope Neckline',
                  'Button Front',
                ],
                group: 'Specifications',
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
 * Given a categoryId, slug or keyword, locate the best matching ProductTypeDefinition and its AttributeTemplate.
 */
export function resolveAttributeTemplate(
  categoryId?: string,
  productTypeId?: string,
): ProductTypeDefinition {
  // If productTypeId directly provided
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

  // Search through all product types to find match
  for (const main of CATEGORY_ENGINE_TAXONOMY) {
    for (const sub of main.subCategories) {
      // Direct subcategory match
      if (normalized.includes(sub.slug) || normalized.includes(sub.id)) {
        return sub.productTypes[0];
      }
      for (const pt of sub.productTypes) {
        if (normalized.includes(pt.id) || normalized.includes(pt.name.toLowerCase())) {
          return pt;
        }
      }
    }
  }

  // Fallback heuristics based on keywords in category string
  if (normalized.includes('saree')) {
    return CATEGORY_ENGINE_TAXONOMY[1].subCategories[0].productTypes[0]; // Women Saree
  }
  if (normalized.includes('lehenga')) {
    return CATEGORY_ENGINE_TAXONOMY[1].subCategories[0].productTypes[2]; // Women Lehenga
  }
  if (normalized.includes('kurta') || normalized.includes('suit')) {
    if (normalized.includes('men')) {
      return CATEGORY_ENGINE_TAXONOMY[0].subCategories[2].productTypes[0]; // Men Kurta
    }
    return CATEGORY_ENGINE_TAXONOMY[1].subCategories[0].productTypes[1]; // Women Kurta Set
  }
  if (
    normalized.includes('jean') ||
    normalized.includes('denim') ||
    normalized.includes('trouser')
  ) {
    return CATEGORY_ENGINE_TAXONOMY[0].subCategories[1].productTypes[0]; // Men Jeans
  }
  if (normalized.includes('dress') || normalized.includes('gown')) {
    return CATEGORY_ENGINE_TAXONOMY[1].subCategories[1].productTypes[0]; // Women Dress
  }
  if (
    normalized.includes('kid') ||
    normalized.includes('baby') ||
    normalized.includes('boy') ||
    normalized.includes('girl')
  ) {
    return CATEGORY_ENGINE_TAXONOMY[2].subCategories[0].productTypes[0]; // Kids
  }
  if (
    normalized.includes('jewel') ||
    normalized.includes('bag') ||
    normalized.includes('watch') ||
    normalized.includes('wallet')
  ) {
    return CATEGORY_ENGINE_TAXONOMY[0].subCategories[4].productTypes[0]; // Accessories
  }

  // Default fallback: Men T-Shirts / Topwear
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
