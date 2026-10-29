import { Mail, MapPin, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';

import { generateBreadcrumbSchema, JsonLd, SEO_CONSTANTS } from '@/frontend/features/seo';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with JiivaaKart customer support for order assistance, shipping inquiries, and boutique partner onboarding.',
  alternates: {
    canonical: `${SEO_CONSTANTS.SITE_URL}/contact`,
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  openGraph: {
    title: `Contact Us | ${SEO_CONSTANTS.SITE_NAME}`,
    description:
      'Get in touch with JiivaaKart customer support for order assistance, shipping inquiries, and boutique partner onboarding.',
    url: `${SEO_CONSTANTS.SITE_URL}/contact`,
    siteName: SEO_CONSTANTS.SITE_NAME,
    locale: SEO_CONSTANTS.DEFAULT_LOCALE,
    type: 'website',
    images: [
      {
        url: SEO_CONSTANTS.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `Contact Us - ${SEO_CONSTANTS.SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Contact Us | ${SEO_CONSTANTS.SITE_NAME}`,
    description:
      'Get in touch with JiivaaKart customer support for order assistance, shipping inquiries, and boutique partner onboarding.',
    images: [SEO_CONSTANTS.DEFAULT_OG_IMAGE],
  },
};

export default function ContactPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SEO_CONSTANTS.SITE_URL },
    { name: 'Contact Us', url: `${SEO_CONSTANTS.SITE_URL}/contact` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      {/* Breadcrumb Structured Data */}
      <JsonLd data={breadcrumbSchema} />
      <div className="mb-10 bg-gradient-to-br from-white via-orange/5 to-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
          <div className="md:col-span-8 text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 border border-orange/20 text-orange text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-orange animate-pulse" />
              <span>Jiivaa Support Desk</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-navy tracking-tight">
              We&apos;d love to hear from you.
            </h1>
            <p className="text-slate-600 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
              Have a question about your boutique order, delivery tracking, or seller onboarding?
              Reach out directly to our team — Jiivaa is here to help!
            </p>
          </div>

          <div className="md:col-span-4 flex items-center justify-center">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
              <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border border-orange-200 shadow-sm p-1.5 flex items-center justify-center overflow-hidden">
                <Image
                  src="/brand/jiivaa/crops/journey/07-customer-support.png"
                  alt="Jiivaa - Customer Support"
                  width={160}
                  height={165}
                  className="w-full h-full object-contain select-none"
                  priority
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-navy text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-white">
                24/7 Help
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* Interactive Contact Information Cards */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-card space-y-6">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-navy">Contact Information</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Tap any item below for instant direct action
            </p>
          </div>

          <div className="space-y-4">
            {/* Email Card */}
            <a
              href="mailto:helpdesk@jiivaakart.com"
              className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/70 hover:bg-orange/5 hover:border-orange/40 transition-all group shadow-xs"
            >
              <div className="h-11 w-11 rounded-2xl bg-orange/10 text-orange flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Email
                  </span>
                  <span className="text-[11px] font-extrabold text-orange opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Mail ✉️
                  </span>
                </div>
                <p className="text-base font-extrabold text-navy mt-0.5 group-hover:text-orange transition-colors">
                  helpdesk@jiivaakart.com
                </p>
              </div>
            </a>

            {/* Phone / WhatsApp Card */}
            <a
              href="https://wa.me/919053883125"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-300 transition-all group shadow-xs"
            >
              <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5 fill-emerald-600 text-emerald-100" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Phone / WhatsApp
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open WhatsApp
                  </span>
                </div>
                <p className="text-base font-extrabold text-navy mt-0.5 group-hover:text-emerald-600 transition-colors">
                  +91 9053883125
                </p>
              </div>
            </a>

            {/* Address / Google Maps Card */}
            <a
              href="https://maps.google.com/?q=Fatehabad,+Haryana,+India"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/70 hover:bg-navy/5 hover:border-navy/30 transition-all group shadow-xs"
            >
              <div className="h-11 w-11 rounded-2xl bg-navy/10 text-navy flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Business Location
                  </span>
                  <span className="text-[11px] font-extrabold text-navy opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Google Maps
                  </span>
                </div>
                <p className="text-base font-extrabold text-navy mt-0.5 group-hover:text-navy transition-colors">
                  Fatehabad, Haryana, India — 125050
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Send Message Form */}
        <form className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-card space-y-5">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-navy mb-4">
              Send Us a Message
            </h2>
          </div>
          <div>
            <label className="block text-sm font-extrabold text-navy mb-1.5">Name</label>
            <input
              type="text"
              className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all outline-none shadow-xs"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-extrabold text-navy mb-1.5">Email</label>
            <input
              type="email"
              className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all outline-none shadow-xs"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-extrabold text-navy mb-1.5">Message</label>
            <textarea
              rows={4}
              className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all outline-none shadow-xs"
              placeholder="How can we help?"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-orange hover:bg-orange-600 px-6 py-4 text-base font-extrabold uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
