'use client';

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Info,
  Layers,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import React, { useState } from 'react';

export interface SpecificationItem {
  label: string;
  value: string;
}

interface ParsedDescription {
  isStructured: boolean;
  hook: string;
  craftsmanship: string | null;
  specifications: SpecificationItem[] | null;
  rawSpecsContent: string | null;
  styling: string | null;
  care: string | null;
  raw: string;
}

/**
 * Robust parser that extracts structured sections from AI-generated or formatted descriptions.
 * Handles multiline descriptions as well as single-line/collapsed text.
 */
export function parseProductDescription(text?: string | null): ParsedDescription {
  if (!text || typeof text !== 'string') {
    return {
      isStructured: false,
      hook: '',
      craftsmanship: null,
      specifications: null,
      rawSpecsContent: null,
      styling: null,
      care: null,
      raw: '',
    };
  }

  const rawText = text.trim();

  // Section keyword regexes matching both standalone line and inline occurrences
  const sectionKeywords = [
    {
      key: 'craftsmanship',
      patterns: [
        /(?:^|\n|\.\s+|\s+)(Artisanal Craftsmanship & Design|Fabric & Craftsmanship|Craftsmanship & Fabric|Craftsmanship|Design & Fabric|About The Fabric)\s*:\s*/i,
      ],
    },
    {
      key: 'specifications',
      patterns: [
        /(?:^|\n|\.\s+|\s+)(Garment Specifications|Product Specifications|Key Highlights & Features|Key Highlights|Product Details|Garment Details|Specifications|Features)\s*:\s*/i,
      ],
    },
    {
      key: 'styling',
      patterns: [
        /(?:^|\n|\.\s+|\s+)(Styling Guide|Styling Tips|How to Style|Style Advice|Pairing Suggestions)\s*:\s*/i,
      ],
    },
    {
      key: 'care',
      patterns: [
        /(?:^|\n|\.\s+|\s+)(Care & Maintenance|Wash Care|Care Instructions|Fabric Care)\s*:\s*/i,
      ],
    },
  ];

  const matches: Array<{
    key: string;
    index: number;
    headerLength: number;
  }> = [];

  sectionKeywords.forEach((sec) => {
    sec.patterns.forEach((pat) => {
      const match = rawText.match(pat);
      if (match && match.index !== undefined) {
        const fullMatch = match[0];
        const leadingSep = fullMatch.match(/^(\n|\.\s+|\s+)/);
        const offset = leadingSep ? leadingSep[0].length : 0;
        matches.push({
          key: sec.key,
          index: match.index + offset,
          headerLength: fullMatch.length - offset,
        });
      }
    });
  });

  matches.sort((a, b) => a.index - b.index);

  if (matches.length === 0) {
    return {
      isStructured: false,
      hook: rawText,
      craftsmanship: null,
      specifications: null,
      rawSpecsContent: null,
      styling: null,
      care: null,
      raw: rawText,
    };
  }

  const hook = rawText.substring(0, matches[0].index).trim();
  const sections: Record<string, string> = {};

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index + current.headerLength;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
    let sectionBody = rawText.substring(startIndex, endIndex).trim();
    sectionBody = sectionBody.replace(/^:\s*/, '').trim();
    sections[current.key] = sectionBody;
  }

  // Parse specifications into key-value pairs
  let parsedSpecs: SpecificationItem[] = [];
  if (sections.specifications) {
    const rawSpecs = sections.specifications;
    const rawItems = rawSpecs
      .split(/(?:•|\n-|\n\*|\n(?=[A-Za-z\s]+:))/g)
      .map((s) => s.trim())
      .filter(Boolean);

    parsedSpecs = rawItems
      .map((item) => {
        const clean = item.replace(/^[•\-\*]\s*/, '').trim();
        const colonIdx = clean.indexOf(':');
        if (colonIdx !== -1) {
          return {
            label: clean.substring(0, colonIdx).trim(),
            value: clean.substring(colonIdx + 1).trim(),
          };
        }
        return { label: '', value: clean };
      })
      .filter((s) => s.label || s.value);
  }

  return {
    isStructured: true,
    hook,
    craftsmanship: sections.craftsmanship || null,
    specifications: parsedSpecs.length > 0 ? parsedSpecs : null,
    rawSpecsContent: sections.specifications || null,
    styling: sections.styling || null,
    care: sections.care || null,
    raw: rawText,
  };
}

interface ProductDescriptionShowcaseProps {
  description?: string | null;
  className?: string;
  variant?: 'full' | 'compact';
  onViewMore?: () => void;
  additionalSpecs?: SpecificationItem[];
}

export function ProductDescriptionShowcase({
  description,
  className = '',
  variant = 'full',
  onViewMore,
  additionalSpecs,
}: ProductDescriptionShowcaseProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parsed = React.useMemo(() => parseProductDescription(description), [description]);

  // Combine and deduplicate specifications from metadata & parsed description
  const allSpecs = React.useMemo(() => {
    const list: SpecificationItem[] = [];
    const seen = new Set<string>();

    const add = (label: string, value: string) => {
      const cleanLabel = (label || '').trim();
      const cleanVal = (value || '').trim();
      if (!cleanVal) return;
      const key = cleanLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      list.push({ label: cleanLabel, value: cleanVal });
    };

    if (additionalSpecs && additionalSpecs.length > 0) {
      additionalSpecs.forEach((s) => add(s.label, s.value));
    }

    if (parsed.specifications && parsed.specifications.length > 0) {
      parsed.specifications.forEach((s) => add(s.label, s.value));
    }

    return list;
  }, [additionalSpecs, parsed.specifications]);

  // For compact view (Buy Box): pick top 4 key specs
  const compactSpecs = React.useMemo(() => {
    const priorityKeys = ['fabric', 'fit', 'occasion', 'care', 'pattern', 'category', 'brand'];
    const selected: SpecificationItem[] = [];

    priorityKeys.forEach((k) => {
      const found = allSpecs.find(
        (s) => s.label.toLowerCase().includes(k) && !selected.some((x) => x.label === s.label),
      );
      if (found) selected.push(found);
    });

    allSpecs.forEach((s) => {
      if (selected.length < 4 && !selected.some((x) => x.label === s.label)) {
        selected.push(s);
      }
    });

    return selected.slice(0, 4);
  }, [allSpecs]);

  if (!description || !description.trim()) {
    if (variant === 'compact' && compactSpecs.length > 0) {
      return (
        <div className={`space-y-2 pt-1 ${className}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {compactSpecs.map((spec, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100/90 border border-slate-200 text-[11px] font-bold text-navy"
              >
                <span className="text-slate-400 font-semibold">{spec.label}:</span>
                <span>{spec.value}</span>
              </span>
            ))}
          </div>
          {onViewMore && (
            <button
              type="button"
              onClick={onViewMore}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-orange hover:text-orange-600 transition-colors cursor-pointer"
            >
              <span>View All Specifications &amp; Details</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      );
    }
    return null;
  }

  // COMPACT VARIANT: For the Buy Box above Add to Cart (Clean, concise, balanced height)
  if (variant === 'compact') {
    return (
      <div className={`space-y-2 pt-1 border-t border-slate-100 ${className}`}>
        {/* Story Hook / Lead */}
        {parsed.hook && (
          <div className="relative pl-2.5 border-l-2 border-orange/80 py-0.5">
            <p className="font-medium text-slate-700 leading-relaxed text-xs line-clamp-2">
              {parsed.hook}
            </p>
          </div>
        )}

        {/* Top 3-4 Key Spec Badges */}
        {compactSpecs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {compactSpecs.map((spec, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/80 border border-slate-200/80 text-[10.5px] font-bold text-navy"
              >
                <span className="text-slate-400 font-semibold">{spec.label}:</span>
                <span>{spec.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Quick jump link to full tabs below */}
        {onViewMore && (
          <button
            type="button"
            onClick={onViewMore}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-orange hover:text-orange-600 transition-colors cursor-pointer pt-0.5"
          >
            <span>View All Specifications, Styling &amp; Wash Care</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // FULL VARIANT: For Full-Width Tabs Below the Main Product Fold
  // If unstructured raw text
  if (!parsed.isStructured) {
    const paragraphs = parsed.raw.split(/\n\s*\n/).filter(Boolean);

    return (
      <div className={`space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed ${className}`}>
        {allSpecs.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs sm:text-sm font-extrabold text-navy flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange" /> Product Specifications
              </h3>
              <span className="text-[11px] text-slate-400 font-bold">100% Authentic Details</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
              {allSpecs.map((spec, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 flex flex-col justify-center"
                >
                  <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
                    {spec.label}
                  </span>
                  <span className="font-bold text-navy mt-0.5 text-xs truncate" title={spec.value}>
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
          <h3 className="text-xs sm:text-sm font-extrabold text-navy">About This Garment</h3>
          {paragraphs.map((p, i) => {
            if (p.includes('•') || p.trim().startsWith('-')) {
              const items = p
                .split(/(?:•|\n-)/)
                .map((it) => it.trim())
                .filter(Boolean);
              return (
                <ul key={i} className="space-y-1.5 my-2">
                  {items.map((it, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-700">{it}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                {p}
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  const hasAdditionalDetails = Boolean(parsed.craftsmanship || parsed.styling || parsed.care);

  return (
    <div className={`space-y-4 sm:space-y-5 text-xs sm:text-sm ${className}`}>
      {/* 1. Lead / Story Hook in Full Width */}
      {parsed.hook && (
        <div className="bg-gradient-to-r from-orange/5 via-orange/2 to-transparent border-l-4 border-orange p-3.5 sm:p-4 rounded-r-2xl">
          <p className="font-medium text-slate-800 leading-relaxed text-xs sm:text-sm">
            {parsed.hook}
          </p>
        </div>
      )}

      {/* 2. Structured Garment Specifications Grid (Full Width 2-4 cols) */}
      {allSpecs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs sm:text-sm font-extrabold text-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange" /> Product Specifications &amp; Details
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">100% Authentic Details</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
            {allSpecs.map((spec, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 flex flex-col justify-center"
              >
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
                  {spec.label}
                </span>
                <span className="font-bold text-navy mt-0.5 text-xs truncate" title={spec.value}>
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Luxury Boutique Cards (Craftsmanship, Styling, Care) in 3-Column Desktop Grid */}
      {hasAdditionalDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Artisanal Craftsmanship & Fabric */}
          {parsed.craftsmanship && (
            <div className="bg-gradient-to-br from-amber-50/80 to-amber-50/30 border border-amber-200/80 rounded-2xl p-4 space-y-2 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs sm:text-sm">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Craftsmanship &amp; Fabric</span>
              </div>
              <p className="text-xs font-medium text-amber-950/85 leading-relaxed flex-1">
                {parsed.craftsmanship}
              </p>
            </div>
          )}

          {/* Card 2: Styling Guide & Pairing Advice */}
          {parsed.styling && (
            <div className="bg-gradient-to-br from-indigo-50/80 to-indigo-50/30 border border-indigo-200/80 rounded-2xl p-4 space-y-2 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs sm:text-sm">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Compass className="w-4 h-4" />
                </div>
                <span>Styling &amp; Pairing Advice</span>
              </div>
              <p className="text-xs font-medium text-indigo-950/85 leading-relaxed flex-1">
                {parsed.styling}
              </p>
            </div>
          )}

          {/* Card 3: Care & Maintenance */}
          {parsed.care && (
            <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-50/30 border border-emerald-200/80 rounded-2xl p-4 space-y-2 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs sm:text-sm">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Care &amp; Maintenance</span>
              </div>
              <p className="text-xs font-medium text-emerald-950/85 leading-relaxed flex-1">
                {parsed.care}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
