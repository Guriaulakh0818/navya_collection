'use client';

export function Newsletter() {
  return (
    <div>
      <h3 className="font-heading text-3xl text-navy">Stay updated with new arrivals and special offers.</h3>
      <p className="mt-3 text-sm text-slate-200">Customer email capture will help future repeat-purchase and marketing campaigns.</p>
      <form className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          className="w-full rounded-full border-0 px-4 py-3 text-slate-900"
          placeholder="Enter your email"
        />
        <button type="submit" className="rounded-full bg-orange px-5 py-3 font-semibold text-white">
          Subscribe
        </button>
      </form>
    </div>
  );
}
