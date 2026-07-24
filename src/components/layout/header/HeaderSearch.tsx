'use client';

import { useRouter } from 'next/navigation';

type HeaderSearchProps = {
  className?: string;
};

export function HeaderSearch({ className }: HeaderSearchProps) {
  const router = useRouter();

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get('q')?.toString().trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
    >
      <input
        name="q"
        placeholder="Search products..."
        className="w-full rounded-full border border-border px-4 py-2 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
      />
    </form>
  );
}
