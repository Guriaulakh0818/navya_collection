import { Card } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';

export function ProductSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className="aspect-[3/4] bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/3 rounded bg-slate-200" />
        <div className="h-9 w-full rounded-full bg-slate-200" />
      </div>
    </Card>
  );
}
