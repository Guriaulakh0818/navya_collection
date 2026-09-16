'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export const HOMEPAGE_FAQS = [
  {
    question: 'What is Navya Collection?',
    answer:
      'Navya Collection is a fashion marketplace connecting customers with local clothing stores, boutiques, and fashion sellers across India.',
  },
  {
    question: 'How does Navya Collection work?',
    answer:
      'Browse curated collections from local boutiques, choose your preferred styles and sizes, and place an order using online payment or Cash on Delivery. Partner stores package your order and dispatch it directly with doorstep tracking.',
  },
  {
    question: 'Are sellers verified on Navya Collection?',
    answer:
      'Yes. All boutique partners and clothing sellers must submit business documents (including GST/PAN and bank details) and undergo verification before listing products on our marketplace.',
  },
  {
    question: 'Does Navya Collection offer Cash on Delivery (COD)?',
    answer:
      'Yes. Navya Collection supports Cash on Delivery for eligible orders across serviceable pin codes with zero hidden charges.',
  },
  {
    question: 'Does Navya Collection deliver across India?',
    answer:
      'Yes. We deliver across India via Shiprocket logistics to serviceable pin codes, with free express delivery on orders above ₹999.',
  },
  {
    question: 'What is the return policy on Navya Collection?',
    answer:
      'Navya Collection offers a 7-day hassle-free return or exchange window from the date of package delivery for unused items with original tags intact.',
  },
  {
    question: 'How can a local store become a seller?',
    answer:
      'Local store owners and boutique designers can register on our Become a Seller page (/become-seller), submit business details, and start listing catalog products upon verification.',
  },
  {
    question: 'What can I buy on Navya Collection?',
    answer:
      'You can shop a wide variety of authentic fashion items including sarees, lehengas, kurtis, salwar suits, men’s shirts, kurtas, kids’ festive wear, and everyday fashion essentials from verified partner boutiques.',
  },
  {
    question: 'How can I contact customer support?',
    answer:
      'You can reach our customer support team by emailing helpdesk@navyacollection.store or visiting our Contact page (/contact) for help with orders, deliveries, or seller inquiries.',
  },
];

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
                    isOpen ? 'bg-amber-100 text-[#F28C28] rotate-180' : 'bg-slate-100 text-slate-500'
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
