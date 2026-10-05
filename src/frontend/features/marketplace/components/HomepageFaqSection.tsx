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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-orange" />
            <span>Questions & Answers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight font-sans">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 font-normal leading-relaxed">
            Essential facts about shopping and selling on Navya Collection fashion marketplace.
          </p>
        </div>

        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-orange hover:text-orange-600 transition-colors shrink-0"
        >
          <span>Need more help? Contact Support</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* FAQ Accordion List (Single Column for Predictable Reading Rhythm) */}
      <div className="max-w-3xl mx-auto space-y-3">
        {HOMEPAGE_FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.question}
              className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-slate-300 bg-slate-50/70 border-l-4 border-l-orange shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer select-none"
                aria-expanded={isOpen}
              >
                <h3 className="text-sm sm:text-base font-bold text-navy-900 leading-snug">
                  {faq.question}
                </h3>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'bg-slate-200 text-navy-900 rotate-180' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-200/60 pt-3">
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
