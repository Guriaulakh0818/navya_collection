import { HelpCircle, Package, RefreshCw, ShieldCheck, Store, Truck } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AEO_FACTS, generateFaqSchema, JsonLd, SEO_CONSTANTS } from '@/frontend/features/seo';

export const metadata: Metadata = {
  title: `Frequently Asked Questions (FAQ) | ${SEO_CONSTANTS.SITE_NAME}`,
  description:
    'Find clear, factual answers about shopping, local boutiques, orders, payments, shipping, returns, and seller registration on Navya Collection.',
  alternates: {
    canonical: `${SEO_CONSTANTS.SITE_URL}/faq`,
  },
  openGraph: {
    title: `Frequently Asked Questions (FAQ) | ${SEO_CONSTANTS.SITE_NAME}`,
    description:
      'Find clear, factual answers about shopping, local boutiques, orders, payments, shipping, returns, and seller registration on Navya Collection.',
    url: `${SEO_CONSTANTS.SITE_URL}/faq`,
    siteName: SEO_CONSTANTS.SITE_NAME,
    locale: SEO_CONSTANTS.DEFAULT_LOCALE,
    type: 'website',
  },
};

const FAQ_SECTIONS = [
  {
    title: 'About Navya Collection & Marketplace Model',
    icon: Store,
    accent: 'text-orange bg-amber-50 border-amber-200',
    items: [
      {
        question: 'What is Navya Collection?',
        answer:
          'Navya Collection is a fashion marketplace connecting customers with local clothing stores, boutiques, and fashion sellers across India.',
        link: { label: 'Explore Marketplace Catalog', href: '/shop' },
      },
      {
        question: 'Is Navya Collection a single store or a multi-vendor platform?',
        answer:
          'Navya Collection is a multi-vendor platform. Products are offered directly by verified independent boutiques, tailoring houses, and garment creators located across different Indian cities.',
        link: { label: 'Browse Boutique Partners', href: '/shop' },
      },
      {
        question: 'What types of fashion are available on Navya Collection?',
        answer:
          'Customers can discover authentic Indian ethnic wear (sarees, lehengas, kurtis, sherwanis, ethnic sets), contemporary western wear, daily casuals, festive outfits, and curated kids fashion.',
        link: { label: 'View All Categories', href: '/category' },
      },
    ],
  },
  {
    title: 'Ordering, Payments & Security',
    icon: ShieldCheck,
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    items: [
      {
        question: 'How do I place an order on Navya Collection?',
        answer:
          'Browse products by category or boutique, choose your preferred size, and add items to your cart. Proceed to checkout, enter your shipping details, and select your payment method.',
        link: { label: 'Start Shopping', href: '/shop' },
      },
      {
        question: 'What payment options are supported?',
        answer:
          'We accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), and Net Banking via secure Razorpay checkout.',
      },
      {
        question: 'Is Cash on Delivery (COD) available?',
        answer:
          'Yes. Cash on Delivery is available across serviceable Indian pin codes without hidden handling charges.',
      },
    ],
  },
  {
    title: 'Shipping, Fulfillment & Tracking',
    icon: Truck,
    accent: 'text-blue-600 bg-blue-50 border-blue-200',
    items: [
      {
        question: 'How does shipping and order fulfillment work?',
        answer:
          'Each boutique merchant packs and dispatches orders directly from their verified store. Deliveries are fulfilled via Shiprocket logistics across 19,000+ pin codes in India.',
        link: { label: 'Read Shipping Policy', href: '/shipping-policy' },
      },
      {
        question: 'What are the shipping charges?',
        answer:
          'Free standard shipping applies when a seller shipment subtotal is ₹999 or more. For seller shipments below ₹999, an applicable standard shipping charge of ₹49 applies per seller shipment. In multi-seller orders, the threshold is calculated separately for each seller because items dispatch from separate boutique locations.',
        link: { label: 'View Shipping Rates', href: '/shipping-policy' },
      },
      {
        question: 'How can I track my order?',
        answer:
          'Once your order is dispatched, you will receive an SMS and WhatsApp notification with your Shiprocket AWB tracking link. You can also track your shipment in your account dashboard.',
        link: { label: 'Track Order in Account', href: '/account' },
      },
    ],
  },
  {
    title: 'Returns, Replacements & Refunds',
    icon: RefreshCw,
    accent: 'text-purple-600 bg-purple-50 border-purple-200',
    items: [
      {
        question: 'What is the return and exchange window?',
        answer:
          'Navya Collection offers a 3-day customer return policy and a 7-day size replacement policy from the date of package delivery for unused garments with original tags intact.',
        link: { label: 'Read Return Policy', href: '/return-policy' },
      },
      {
        question: 'How do I request a return or exchange?',
        answer:
          'Go to your account order history, select the delivered item, and click "Request Return / Exchange". Our logistics partner will arrange a doorstep reverse pickup within 24 to 48 hours.',
        link: { label: 'Go to Order History', href: '/account' },
      },
      {
        question: 'How are refunds processed?',
        answer:
          'Prepaid refunds are initiated to the original payment source within 24 hours of inspection. For COD orders, refund is transferred directly to your provided bank account or UPI ID.',
      },
    ],
  },
  {
    title: 'Selling on Navya Collection',
    icon: Store,
    accent: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    items: [
      {
        question: 'Who can sell on Navya Collection?',
        answer:
          'Any verified clothing retailer, boutique owner, ethnic wear designer, or garment manufacturer based in India can join Navya Collection as a seller.',
        link: { label: 'Become a Seller', href: '/become-seller' },
      },
      {
        question: 'How do local stores register as sellers?',
        answer:
          'Visit our Become a Seller page (/become-seller), fill in your shop name and business credentials, complete seller verification, and begin listing your fashion catalog.',
        link: { label: 'Register Your Boutique', href: '/become-seller' },
      },
    ],
  },
  {
    title: 'Support & Assistance',
    icon: HelpCircle,
    accent: 'text-rose-600 bg-rose-50 border-rose-200',
    items: [
      {
        question: 'How do I contact customer support?',
        answer:
          'You can email our customer support team at helpdesk@navyacollection.store or call/WhatsApp us at +91 9053883125.',
        link: { label: 'Contact Support Page', href: '/contact' },
      },
    ],
  },
];

// Flat list for Schema.org FAQPage structured data
const ALL_FAQS = FAQ_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    question: item.question,
    answer: item.answer,
  })),
);

export default function FaqPage() {
  const faqSchema = generateFaqSchema(ALL_FAQS);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* FAQPage Structured Data */}
      <JsonLd data={faqSchema} />

      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Frequently Asked Questions' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-10">
        {/* Header Hero */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Knowledge Base &amp; AEO Answers
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-black text-navy tracking-tight max-w-2xl mx-auto leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Essential facts, policies, and guidance for shopping and selling on the Navya Collection
            marketplace.
          </p>
        </div>

        {/* Grouped FAQ Sections */}
        <div className="space-y-8">
          {FAQ_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.title}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${section.accent}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div
                      key={item.question}
                      className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2"
                    >
                      <h3 className="font-extrabold text-navy text-sm sm:text-base">
                        {item.question}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {item.answer}
                      </p>
                      {item.link && (
                        <div className="pt-1">
                          <Link
                            href={item.link.href}
                            className="inline-flex items-center text-xs font-bold text-amber-700 hover:text-amber-800 underline"
                          >
                            {item.link.label} &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Contact Assistance Footer Card */}
        <div className="bg-gradient-to-br from-navy to-[#1e3a8a] text-white rounded-3xl p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-heading text-xl font-bold">Have an unanswered question?</h3>
            <p className="text-xs sm:text-sm text-slate-200">
              Our support team is available to assist you with orders, sizing, and partner
              onboarding.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Contact Customer Support &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
