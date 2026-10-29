'use client';

import { Check, ChevronDown, Globe } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { useSellerLanguage } from '../context/SellerLanguageContext';
import { SELLER_LANGUAGES, SellerLanguage } from '../i18n/seller-dictionary';

export function SellerLanguagePill() {
  const { language, setLanguage } = useSellerLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = SELLER_LANGUAGES.find((l) => l.id === language) || SELLER_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300"
        title="Change Seller Portal Language"
        aria-label="Select Language"
      >
        <span className="text-sm leading-none">{currentOption.flag}</span>
        <span className="font-semibold text-slate-900">{currentOption.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Bhasha Chunein / Language
            </span>
          </div>

          <div className="p-1 space-y-1">
            {SELLER_LANGUAGES.map((opt) => {
              const isSelected = opt.id === language;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setLanguage(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-navy/5 text-navy font-bold border border-navy/15'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-lg leading-none mt-0.5">{opt.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-navy" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      {opt.subLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
