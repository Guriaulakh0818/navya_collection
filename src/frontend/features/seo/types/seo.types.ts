export interface OrganizationSchemaInput {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
    areaServed?: string;
    availableLanguage?: string[];
  };
}

export interface WebSiteSchemaInput {
  name?: string;
  url?: string;
  searchUrl?: string;
}

export interface ProductSchemaInput {
  id: string;
  name: string;
  description: string;
  sku?: string;
  brand?: string;
  category?: string;
  images?: string[];
  price: number;
  currency?: string;
  inStock?: boolean;
  ratingValue?: number;
  reviewCount?: number;
  url?: string;
}

export interface BreadcrumbItemInput {
  name: string;
  url: string;
}

export interface AnalyticsProps {
  gaMeasurementId?: string;
  gtmId?: string;
  clarityId?: string;
}
