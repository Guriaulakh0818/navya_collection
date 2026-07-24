type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  children: React.ReactNode;
  className?: string;
};

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-navy text-white hover:bg-[#234b8f]',
  secondary: 'bg-white text-navy border border-border hover:bg-slate-50',
  outline: 'border border-navy text-navy hover:bg-sky-50',
  ghost: 'text-navy hover:bg-slate-100',
  danger: 'bg-error text-white hover:bg-[#d93b3b]',
  success: 'bg-success text-white hover:bg-[#1fa64c]',
};

export function Button({ variant = 'primary', children, className = '' }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy/30 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
