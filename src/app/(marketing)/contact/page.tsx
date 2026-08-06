import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Navya Collection',
  description: 'Get in touch with Navya Collection for orders, support, or store inquiries.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-10 text-center md:text-left">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange">Get in Touch</p>
        <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold text-navy">
          We&apos;d love to hear from you.
        </h1>
        <p className="mt-3 text-slate-600 font-medium text-base max-w-xl">
          Have a question about your order, custom fitting, or new collections? Reach out directly
          via email, WhatsApp, or visit our store.
        </p>
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
              href="mailto:navyacollection45@gmail.com"
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
                  navyacollection45@gmail.com
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
                    Open WhatsApp 💬
                  </span>
                </div>
                <p className="text-base font-extrabold text-navy mt-0.5 group-hover:text-emerald-600 transition-colors">
                  +91 9053883125
                </p>
              </div>
            </a>

            {/* Address / Google Maps Card */}
            <a
              href="https://maps.google.com/?q=Mohali,+Punjab,+India"
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
                    Store Location
                  </span>
                  <span className="text-[11px] font-extrabold text-navy opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Google Maps 🗺️
                  </span>
                </div>
                <p className="text-base font-extrabold text-navy mt-0.5 group-hover:text-navy transition-colors">
                  Mohali, Punjab, India
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
