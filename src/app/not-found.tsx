import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-lg text-center space-y-6">
        {/* Jiivaa Thinking Mascot */}
        <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white border border-orange-200 shadow-md p-2 flex items-center justify-center overflow-hidden">
            <Image
              src="/brand/jiivaa/crops/expressions/expr-1-6-thinking.png"
              alt="Jiivaa - Thinking 404"
              width={160}
              height={155}
              className="w-full h-full object-contain select-none"
              priority
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-orange text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs border border-white">
            404 Error
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Oops! Yeh Page Nahi Mila
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            Jiivaa couldn&apos;t find this style. It might have moved or been sold out, but verified
            Indian boutique fashion is just 1 click away!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/shop"
            className="w-full sm:w-auto rounded-full bg-orange px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange/25 hover:bg-orange-600 transition-all text-center"
          >
            Explore Trending Styles &rarr;
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto rounded-full border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-navy hover:bg-slate-100 transition-all text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
