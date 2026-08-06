'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyCouponButtonProps {
  code: string;
}

export function CopyCouponButton({ code }: CopyCouponButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
    >
      <Copy className="w-3.5 h-3.5" />
      {isCopied ? 'Copied ✓' : 'Copy Code'}
    </button>
  );
}
