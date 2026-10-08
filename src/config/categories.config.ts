export interface LeafCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface SubCategoryOption {
  id: string;
  name: string;
  slug: string;
  items?: LeafCategoryOption[];
}

export interface MainCategoryOption {
  id: string;
  name: string;
  slug: string;
  badge?: string;
  sections: {
    id: string;
    title: string;
    subCategories: SubCategoryOption[];
  }[];
  // Backward compatibility convenience getter
  subCategories?: SubCategoryOption[];
}

/**
 * Clean Authentic Master Taxonomy for Navya Collection
 * Pure Indian Boutique & Designer Ethnic Couture
 */
export const CATEGORY_TAXONOMY: MainCategoryOption[] = [
  // 1. SAREES
  {
    id: 'sarees',
    name: 'Sarees',
    slug: 'sarees',
    badge: 'Popular',
    sections: [
      {
        id: 'sec_sarees',
        title: 'Heritage & Designer Sarees',
        subCategories: [
          { id: 'banarasi-sarees', name: 'Banarasi Sarees', slug: 'banarasi-sarees' },
          {
            id: 'kanjeevaram-silk-sarees',
            name: 'Kanjeevaram Silk Sarees',
            slug: 'kanjeevaram-silk-sarees',
          },
          { id: 'chanderi-sarees', name: 'Chanderi Sarees', slug: 'chanderi-sarees' },
        ],
      },
    ],
  },

  // 2. LEHENGAS
  {
    id: 'lehengas',
    name: 'Lehengas',
    slug: 'lehengas',
    badge: 'Bridal',
    sections: [
      {
        id: 'sec_lehengas',
        title: 'Bridal & Partywear Lehengas',
        subCategories: [
          { id: 'bridal-lehengas', name: 'Bridal Lehengas', slug: 'bridal-lehengas' },
          { id: 'partywear-lehengas', name: 'Partywear Lehengas', slug: 'partywear-lehengas' },
        ],
      },
    ],
  },

  // 3. ANARKALIS & SUITS
  {
    id: 'anarkalis-suits',
    name: 'Anarkalis & Suits',
    slug: 'anarkalis-suits',
    badge: 'Festive',
    sections: [
      {
        id: 'sec_anarkalis',
        title: 'Suits & Anarkalis',
        subCategories: [
          { id: 'silk-anarkali-sets', name: 'Silk Anarkali Sets', slug: 'silk-anarkali-sets' },
        ],
      },
    ],
  },

  // 4. KURTIS & TUNICS
  {
    id: 'kurtis-tunics',
    name: 'Kurtis & Tunics',
    slug: 'kurtis-tunics',
    sections: [
      {
        id: 'sec_kurtis',
        title: 'Daily & Festive Kurtis',
        subCategories: [
          { id: 'kurtis-tunics', name: 'All Kurtis & Tunics', slug: 'kurtis-tunics' },
        ],
      },
    ],
  },

  // 5. INDO-WESTERN & FUSION
  {
    id: 'indo-western-fusion',
    name: 'Indo-Western & Fusion',
    slug: 'indo-western-fusion',
    sections: [
      {
        id: 'sec_fusion',
        title: 'Modern Silhouettes & Dresses',
        subCategories: [
          {
            id: 'indo-western-fusion',
            name: 'All Indo-Western & Fusion',
            slug: 'indo-western-fusion',
          },
        ],
      },
    ],
  },

  // 6. GENTS & MENS COUTURE
  {
    id: 'gents-mens-couture',
    name: 'Gents & Mens Couture',
    slug: 'gents-mens-couture',
    badge: 'Gents',
    sections: [
      {
        id: 'sec_gents',
        title: 'Men Ethnic & Designer Couture',
        subCategories: [
          {
            id: 'designer-kurta-pajamas',
            name: 'Designer Kurta Pajamas',
            slug: 'designer-kurta-pajamas',
          },
          { id: 'gents-mens-couture', name: 'All Gents Couture', slug: 'gents-mens-couture' },
        ],
      },
    ],
  },

  // 7. DUPATTAS & STOLES
  {
    id: 'dupattas-stoles',
    name: 'Dupattas & Stoles',
    slug: 'dupattas-stoles',
    sections: [
      {
        id: 'sec_dupattas',
        title: 'Embroidered & Phulkari Dupattas',
        subCategories: [
          { id: 'phulkari-dupattas', name: 'Phulkari Dupattas', slug: 'phulkari-dupattas' },
          { id: 'dupattas-stoles', name: 'All Dupattas & Stoles', slug: 'dupattas-stoles' },
        ],
      },
    ],
  },
];

// Helper: Populate legacy subCategories for backwards compatibility
CATEGORY_TAXONOMY.forEach((group) => {
  if (!group.subCategories) {
    group.subCategories = group.sections.flatMap((s) => s.subCategories);
  }
});

export interface FlatCategoryOption {
  id: string;
  name: string;
  slug: string;
  mainGroupId: string;
  mainGroupName: string;
  sectionTitle: string;
  breadcrumb: string;
  isLeaf?: boolean;
}

/**
 * Returns a flattened list of all categories and sub-items with full breadcrumbs
 * for effortless searching, selection in dropdowns, and admin recategorization.
 */
export function getFlattenedCategoryOptions(): FlatCategoryOption[] {
  const list: FlatCategoryOption[] = [];

  for (const main of CATEGORY_TAXONOMY) {
    for (const sec of main.sections) {
      for (const sub of sec.subCategories) {
        if (sub.items && sub.items.length > 0) {
          list.push({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            mainGroupId: main.id,
            mainGroupName: main.name,
            sectionTitle: sec.title,
            breadcrumb: `${main.name} > ${sub.name}`,
            isLeaf: false,
          });

          for (const leaf of sub.items) {
            list.push({
              id: leaf.id,
              name: leaf.name,
              slug: leaf.slug,
              mainGroupId: main.id,
              mainGroupName: main.name,
              sectionTitle: sec.title,
              breadcrumb: `${main.name} > ${sub.name} > ${leaf.name}`,
              isLeaf: true,
            });
          }
        } else {
          list.push({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            mainGroupId: main.id,
            mainGroupName: main.name,
            sectionTitle: sec.title,
            breadcrumb: `${main.name} > ${sub.name}`,
            isLeaf: true,
          });
        }
      }
    }
  }

  return list;
}
