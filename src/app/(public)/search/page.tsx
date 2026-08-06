import { Suspense } from 'react';
import { Metadata } from 'next';

import { MarketplaceSearchResults } from '@/frontend/features/search/components/MarketplaceSearchResults';

export const metadata: Metadata = {
  title: 'Marketplace Search Engine | Navya Collection',
  description:
    'Search luxury ethnic couture, sarees, lehengas, gents garments, and verified boutique partner shops on Navya Collection.',
};

export default function PublicSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-slate-950 min-h-screen">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading Marketplace Search Engine...</span>
        </div>
      }
    >
      <MarketplaceSearchResults />
    </Suspense>
  );
}
