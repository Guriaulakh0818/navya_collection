'use client';

import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

import { HOMEPAGE_FAQS } from '../constants/homepage-faqs';

export function HomepageFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="space-y-6 sm:space-y-8 my-8 sm:my-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Questions & Answers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A2342] tracking-tight font-sans">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Essential facts about shopping and selling on Navya Collection fashion marketplace.
          </p>
        </div>

        <Link
          href="/contact"
          className="text-xs sm:text-sm font-extrabold text-[#F28C28] hover:text-[#d97718] transition-colors shrink-0"
        >
          Need more help? Contact Support →
        </Link>
      </div>

      {/* FAQ Accordion List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HOMEPAGE_FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.question}
              className={`border rounded-2xl transition-all duration-200 bg-white overflow-hidden ${
                isOpen ? 'border-amber-300 shadow-xs' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer select-none"
                aria-expanded={isOpen}
              >
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0A2342] leading-snug">
                  {faq.question}
                </h3>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen
                      ? 'bg-amber-100 text-[#F28C28] rotate-180'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 mt-1 pt-3">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
