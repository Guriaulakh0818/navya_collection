export interface ShopSeoInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  banner?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  fullAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  verificationBadge?: string | null;
  status?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isClosed?: boolean;
  vacationMessage?: string | null;
  productCount?: number;
  categories?: Array<{
    id?: string;
    name: string;
    slug: string;
  }>;
}

export interface ShopAddressSeoInput {
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string;
}
