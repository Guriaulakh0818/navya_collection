type EmptyStateProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl">📦</div>
      <h3 className="mt-4 font-heading text-2xl text-navy">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
      {action && (
        <a href={action.href} className="mt-4 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]">
          {action.label}
        </a>
      )}
    </div>
  );
}
