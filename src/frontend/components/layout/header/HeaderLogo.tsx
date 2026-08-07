import Image from 'next/image';
import Link from 'next/link';

export function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 group py-1">
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-slate-200 shadow-xs shrink-0 group-hover:scale-105 transition-transform bg-white">
        <Image
          src="/images/navya-logo.png"
          alt="Navya Collection Logo"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-heading text-base sm:text-lg md:text-xl font-bold tracking-wider text-navy uppercase group-hover:text-navy/90 transition-colors">
          NAVYA
        </span>
        <span className="font-heading text-[9px] sm:text-[10px] md:text-[11px] font-extrabold tracking-[0.2em] sm:tracking-[0.24em] text-orange uppercase mt-0.5">
          COLLECTION
        </span>
      </div>
    </Link>
  );
}
