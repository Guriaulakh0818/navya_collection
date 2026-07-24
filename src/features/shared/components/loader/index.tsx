export function Loader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      <p className="mt-3 text-sm text-slate-600">{text}</p>
    </div>
  );
}
