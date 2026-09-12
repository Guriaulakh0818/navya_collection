'use client';

import { ArrowRight, ChevronDown, ChevronUp, Grid, Search, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  MAIN_CATEGORY_GROUPS,
  MainCategoryGroup,
  SubCategoryItem,
} from '../constants/category-explorer.constants';

interface CategoryExplorerProps {
  initialActiveId?: string;
  dbCategoryCounts?: Record<string, number>;
}

export function CategoryExplorer({
  initialActiveId = 'group_for_you',
  dbCategoryCounts = {},
}: CategoryExplorerProps) {
  const [activeGroupId, setActiveGroupId] = useState<string>(initialActiveId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const activeGroup = useMemo(() => {
    return MAIN_CATEGORY_GROUPS.find((g) => g.id === activeGroupId) || MAIN_CATEGORY_GROUPS[0];
  }, [activeGroupId]);

  // Global Search Filter across all subcategories & spotlights
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.trim().toLowerCase();
    const results: { group: MainCategoryGroup; item: SubCategoryItem }[] = [];

    for (const group of MAIN_CATEGORY_GROUPS) {
      for (const section of group.subSections) {
        for (const item of section.items) {
          if (
            item.name.toLowerCase().includes(query) ||
            item.slug.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query) ||
            group.name.toLowerCase().includes(query)
          ) {
            results.push({ group, item });
          }
        }
      }
    }
    return results;
  }, [searchQuery]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="w-full flex flex-col bg-slate-50 min-h-[calc(100vh-140px)]">
      {/* Top Search & Filter Header Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sarees, kurtas, lehengas, shirts, heels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm font-semibold rounded-2xl border border-transparent focus:border-[#183A73] focus:ring-2 focus:ring-[#183A73]/20 transition-all outline-none text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Category Explorer Container */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex overflow-hidden">
        {/* If Search is active -> Show Instant Search Results Grid */}
        {filteredResults !== null ? (
          <div className="flex-1 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-extrabold text-navy flex items-center gap-2">
                <Search className="h-4 w-4 text-[#F15A25]" />
                Search Results for &quot;{searchQuery}&quot;
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {filteredResults.length} varieties found
              </span>
            </div>

            {filteredResults.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <Grid className="h-12 w-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-600">No fashion category found</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try searching for general terms like &quot;Saree&quot;, &quot;Kurta&quot;,
                  &quot;Dress&quot;, &quot;Jewellery&quot;, or &quot;Shoes&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
                {filteredResults.map(({ group, item }) => (
                  <Link
                    key={`${group.id}_${item.id}`}
                    href={`/shop?${item.queryParam}`}
                    className="group flex flex-col items-center text-center p-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#183A73] hover:shadow-md transition-all active:scale-95"
                  >
                    <div className="relative w-full aspect-square rounded-xl bg-slate-100 overflow-hidden mb-2">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 33vw, 150px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.badge && (
                        <span className="absolute top-1 right-1 bg-[#F15A25] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#183A73]">
                      {item.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {group.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Dual-Pane Category Browser */
          <div className="flex-1 flex w-full">
            {/* LEFT SIDEBAR: Category Navigation Rail */}
            <aside className="w-[92px] sm:w-[120px] md:w-[160px] shrink-0 bg-slate-100/90 border-r border-slate-200 overflow-y-auto max-h-[calc(100vh-130px)] sticky top-[57px] py-2 scrollbar-none select-none">
              <div className="flex flex-col gap-1 px-1.5 sm:px-2">
                {MAIN_CATEGORY_GROUPS.map((group) => {
                  const isActive = group.id === activeGroupId;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveGroupId(group.id)}
                      className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#183A73] font-black shadow-sm ring-1 ring-slate-200/80'
                          : 'text-slate-600 hover:bg-white/60 hover:text-navy font-semibold'
                      }`}
                    >
                      {/* Active Left Indicator Pill */}
                      {isActive && (
                        <div className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-[#183A73]" />
                      )}

                      {/* Icon Avatar */}
                      <div
                        className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden mb-1.5 transition-all ${
                          isActive
                            ? 'ring-2 ring-[#183A73] shadow-xs scale-105'
                            : 'opacity-85 group-hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={group.iconImage}
                          alt={group.name}
                          fill
                          sizes="60px"
                          className="object-cover"
                        />
                      </div>

                      {/* Title */}
                      <span className="text-[10px] sm:text-xs leading-tight tracking-tight line-clamp-2 px-1">
                        {group.name}
                      </span>

                      {/* Optional Badge */}
                      {group.badge && (
                        <span className="mt-1 bg-[#F15A25] text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider scale-90">
                          {group.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* RIGHT CONTENT AREA: Sub-sections, Spotlights, and Product Variety Cards */}
            <main className="flex-1 bg-white p-3 sm:p-5 md:p-6 overflow-y-auto max-h-[calc(100vh-130px)] space-y-6">
              {/* Category Header Banner */}
              {activeGroup.banner && (
                <Link
                  href={activeGroup.banner.link}
                  className="group relative block rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#183A73] to-[#255299] p-4 sm:p-6 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <div className="relative z-10 max-w-sm sm:max-w-md space-y-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      <Sparkles className="h-3 w-3" /> Featured Collection
                    </span>
                    <h1 className="text-base sm:text-2xl font-black leading-tight drop-shadow-xs">
                      {activeGroup.banner.title}
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-2 font-medium">
                      {activeGroup.banner.subtitle}
                    </p>
                    <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 group-hover:translate-x-1 transition-transform">
                      <span>Explore Category</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 sm:w-1/2 opacity-25 group-hover:opacity-35 transition-opacity">
                    <Image
                      src={activeGroup.banner.image}
                      alt={activeGroup.banner.title}
                      fill
                      sizes="(max-width: 768px) 30vw, 400px"
                      className="object-cover"
                    />
                  </div>
                </Link>
              )}

              {/* In The Spotlight (if present) */}
              {activeGroup.spotlights && activeGroup.spotlights.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#183A73] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#F15A25]" /> In the Spotlight
                    </h2>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
                    {activeGroup.spotlights.map((spot) => (
                      <Link
                        key={spot.id}
                        href={
                          spot.slug.startsWith('shop') || spot.slug.startsWith('/')
                            ? spot.slug
                            : `/category/${spot.slug}`
                        }
                        className="group flex flex-col items-center text-center p-2 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-all active:scale-95 shadow-2xs"
                      >
                        <div
                          className={`relative w-full aspect-square rounded-xl overflow-hidden mb-1.5 bg-gradient-to-br ${
                            spot.gradient || 'from-[#183A73] to-[#255299]'
                          }`}
                        >
                          <Image
                            src={spot.image}
                            alt={spot.title}
                            fill
                            sizes="(max-width: 768px) 33vw, 150px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300 mix-blend-overlay opacity-85"
                          />
                          <div className="absolute inset-0 flex items-center justify-center p-1.5 text-center">
                            <span className="text-white text-[10px] sm:text-xs font-black drop-shadow-md leading-tight">
                              {spot.title}
                            </span>
                          </div>
                          {spot.badge && (
                            <span className="absolute top-1 right-1 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                              {spot.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 leading-tight">
                          {spot.subtitle || spot.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Category Sections (e.g. Men's Clothing, Men's Footwear, Women's Sarees, etc.) */}
              {activeGroup.subSections.map((section) => {
                const isExpanded = expandedSections[section.id] !== false; // Default expanded
                const displayItems = isExpanded ? section.items : section.items.slice(0, 6);
                const hasMore = section.items.length > 6;

                return (
                  <div
                    key={section.id}
                    className="space-y-3 pt-2 border-t border-slate-100 first:border-t-0"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#183A73]">
                        {section.title}
                      </h2>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {section.items.length} items
                      </span>
                    </div>

                    {/* 3-Column Variety Grid (Flipkart/Myntra/Meesho Style Pill Cards) */}
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                      {displayItems.map((item) => (
                        <Link
                          key={item.id}
                          href={`/shop?${item.queryParam}`}
                          className="group flex flex-col items-center text-center p-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-[#183A73] hover:shadow-md transition-all active:scale-95"
                        >
                          <div className="relative w-full aspect-square rounded-xl bg-slate-100/90 overflow-hidden mb-1.5">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="(max-width: 768px) 33vw, 150px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {item.badge && (
                              <span className="absolute top-1 right-1 bg-[#F15A25] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-xs">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10.5px] sm:text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#183A73]">
                            {item.name}
                          </span>
                        </Link>
                      ))}

                      {/* Expand / Collapse Button Card */}
                      {hasMore && (
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-[#183A73] transition-all cursor-pointer active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-2xs mb-1">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-[#183A73]" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-[#183A73]" />
                            )}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {isExpanded ? 'View Less' : `+${section.items.length - 6} More`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
