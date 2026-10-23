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

interface SpecificationItem {
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
}

export function ProductDescriptionShowcase({
  description,
  className = '',
}: ProductDescriptionShowcaseProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description || !description.trim()) {
    return null;
  }

  const parsed = parseProductDescription(description);

  // If unstructured, render clean formatted text with paragraph breaks
  if (!parsed.isStructured) {
    const paragraphs = parsed.raw.split(/\n\s*\n/).filter(Boolean);

    return (
      <div className={`space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed ${className}`}>
        {paragraphs.map((p, i) => {
          // If bullet list
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
            <p key={i} className="font-medium text-slate-700 whitespace-pre-line">
              {p}
            </p>
          );
        })}
      </div>
    );
  }

  const hasAdditionalDetails = Boolean(parsed.craftsmanship || parsed.styling || parsed.care);

  return (
    <div className={`space-y-3.5 text-xs sm:text-sm ${className}`}>
      {/* 1. Lead / Story Hook */}
      {parsed.hook && (
        <div className="relative pl-3 border-l-2 border-orange/80 py-0.5">
          <p className="font-medium text-slate-800 leading-relaxed text-xs sm:text-[13px]">
            {parsed.hook}
          </p>
        </div>
      )}

      {/* 2. Structured Garment Specifications Grid */}
      {parsed.specifications && parsed.specifications.length > 0 && (
        <div className="space-y-2 bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-navy font-extrabold text-[11px] sm:text-xs uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-orange" />
            <span>Garment Specifications &amp; Highlights</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {parsed.specifications.map((spec, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/70 rounded-lg p-2 sm:p-2.5 flex flex-col justify-center shadow-3xs"
              >
                {spec.label ? (
                  <>
                    <span className="text-[9.5px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
                      {spec.label}
                    </span>
                    <span className="font-bold text-navy text-[11px] sm:text-xs leading-snug mt-0.5 break-words">
                      {spec.value}
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-navy text-[11px] sm:text-xs leading-snug">
                    {spec.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Additional Boutique Details (Craftsmanship, Styling, Care) */}
      {hasAdditionalDetails && (
        <div className="space-y-2.5 pt-1">
          {/* Craftsmanship Card */}
          {parsed.craftsmanship && (
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 sm:p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-[11px] sm:text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Artisanal Craftsmanship &amp; Fabric</span>
              </div>
              <p className="text-[11.5px] sm:text-xs font-medium text-amber-950/85 leading-relaxed">
                {parsed.craftsmanship}
              </p>
            </div>
          )}

          {/* Collapsible or Inline Styling & Care */}
          {!isExpanded && (parsed.styling || parsed.care) ? (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 hover:border-navy text-navy font-bold text-[11px] flex items-center justify-center gap-1.5 bg-slate-50/50 hover:bg-slate-100/70 transition-all cursor-pointer"
            >
              <span>View Styling Guide &amp; Wash Care</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              {/* Styling Guide Card */}
              {parsed.styling && (
                <div className="bg-indigo-50/60 border border-indigo-200/70 rounded-xl p-3 sm:p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-[11px] sm:text-xs">
                    <Compass className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Styling Guide &amp; Pairing Advice</span>
                  </div>
                  <p className="text-[11.5px] sm:text-xs font-medium text-indigo-950/85 leading-relaxed">
                    {parsed.styling}
                  </p>
                </div>
              )}

              {/* Care & Maintenance Card */}
              {parsed.care && (
                <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3 sm:p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[11px] sm:text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Care &amp; Maintenance</span>
                  </div>
                  <p className="text-[11.5px] sm:text-xs font-medium text-emerald-950/85 leading-relaxed">
                    {parsed.care}
                  </p>
                </div>
              )}

              {isExpanded && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-full py-1 text-slate-500 hover:text-navy font-bold text-[10.5px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Show Less</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
