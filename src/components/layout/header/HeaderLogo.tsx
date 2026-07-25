import Link from 'next/link';

export function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy font-heading text-lg font-bold text-white shadow-sm group-hover:scale-105 transition-transform">
        N
      </div>
      <div className="leading-tight">
        <div className="text-base font-extrabold tracking-tight text-navy font-heading">Navya</div>
        <div className="text-[10px] font-bold tracking-widest text-orange uppercase">
          Collection
        </div>
      </div>
    </Link>
  );
}
