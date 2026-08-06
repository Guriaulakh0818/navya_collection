export function MarketplaceSkeletonLoader() {
  return (
    <div className="space-y-12 animate-pulse max-w-7xl mx-auto px-4 py-8">
      {/* Hero Skeleton */}
      <div className="h-72 bg-slate-200/80 border border-slate-200 rounded-3xl w-full" />

      {/* Shops Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200/60 border border-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-slate-200/60 border border-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
