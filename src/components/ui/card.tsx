type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border border-border bg-white p-5 shadow-premium ${className}`}>
      {children}
    </div>
  );
}
