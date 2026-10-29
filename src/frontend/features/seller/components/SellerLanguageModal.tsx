'use client';

import { Check, Sparkles, X } from 'lucide-react';
import React from 'react';

import { useSellerLanguage } from '../context/SellerLanguageContext';
import { SELLER_LANGUAGES, SellerLanguage } from '../i18n/seller-dictionary';

export function SellerLanguageModal() {
  const { isInitialPromptNeeded, language, setLanguage, dismissInitialPrompt } =
    useSellerLanguage();

  if (!isInitialPromptNeeded) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange via-amber-500 to-navy" />

        <button
          onClick={dismissInitialPrompt}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-2xl bg-orange/10 flex items-center justify-center text-orange shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Namaste! JiivaaKart Seller Portal
            </h3>
            <p className="text-xs text-slate-500">Apni suvidha ke anusar bhasha chunein</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          💡 Product upload aur stock manage karne me aasaani ke liye aap Hinglish ya Hindi chun
          sakte hain:
        </p>

        <div className="space-y-2 mb-5">
          {SELLER_LANGUAGES.map((opt) => {
            const isSelected = opt.id === language;
            const isRecommended = opt.id === 'hinglish';

            return (
              <button
                key={opt.id}
                onClick={() => setLanguage(opt.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? 'border-orange bg-orange/5 ring-2 ring-orange/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                }`}
              >
                <span className="text-2xl leading-none mt-0.5">{opt.flag}</span>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                    {isRecommended && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block mt-1 leading-snug">
                    {opt.subLabel}
                  </span>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-orange text-white flex items-center justify-center shrink-0 absolute top-4 right-3.5 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={dismissInitialPrompt}
          className="w-full py-3 bg-navy hover:bg-navy/90 text-white font-extrabold text-sm rounded-xl shadow-md shadow-navy/20 transition-all text-center cursor-pointer"
        >
          Shuru Karein (Save Preference) →
        </button>

        <p className="text-[10px] text-slate-400 text-center mt-2.5">
          Aap ise upar header bar se kisi bhi waqt badal sakte hain.
        </p>
      </div>
    </div>
  );
}
