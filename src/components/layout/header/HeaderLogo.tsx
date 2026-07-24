import Link from 'next/link';

export function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-navy font-heading text-base font-bold text-white">
        N
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold text-navy">Navya</div>
        <div className="text-[11px] text-slate-500">Collection</div>
      </div>
    </Link>
  );
}
