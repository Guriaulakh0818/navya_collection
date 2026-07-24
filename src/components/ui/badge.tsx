type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success';
};

const variantClasses = {
  default: 'bg-sky-50 text-navy',
  accent: 'bg-orange/10 text-orange',
  success: 'bg-green-50 text-success',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
