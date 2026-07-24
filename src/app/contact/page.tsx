import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Navya Collection',
  description: 'Get in touch with Navya Collection for orders, support, or partnerships.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Get in Touch</p>
        <h1 className="mt-3 font-heading text-4xl text-navy">We&apos;d love to hear from you.</h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">
          Whether you have a question about products, orders, or partnerships, our team is ready to answer.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <h2 className="font-heading text-2xl text-navy">Contact Information</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p><strong className="text-navy">Email:</strong> hello@navyacollection.in</p>
            <p><strong className="text-navy">Phone:</strong> +91 98765 43210</p>
            <p><strong className="text-navy">Address:</strong> Mumbai, India</p>
            <p><strong className="text-navy">Support Hours:</strong> Mon – Sat, 10:00 AM – 7:00 PM</p>
          </div>
        </div>

        <form className="rounded-2xl border border-border bg-white p-6 shadow-premium space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy">Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Message</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
              placeholder="How can we help?"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
