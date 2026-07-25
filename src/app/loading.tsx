import { HeaderLogo } from '@/components/layout/header/HeaderLogo';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <HeaderLogo />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    </div>
  );
}
