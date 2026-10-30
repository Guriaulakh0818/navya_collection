import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-lg text-center space-y-6">
        {/* Jiivaa Thinking Mascot */}
        <div className="relative mx-auto w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          {/* Subtle Character Ambient Glow */}
          <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-2xl pointer-events-none scale-90" />
          <Image
            src="/brand/jiivaa/crops/expressions/expr-1-6-thinking.png"
            alt="Jiivaa - Thinking 404"
            width={180}
            height={200}
            className="relative z-10 w-auto h-full max-h-[160px] sm:max-h-[190px] object-contain drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
            priority
          />
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
