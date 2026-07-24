type FooterBottomProps = {
  logo?: React.ReactNode;
  legal?: React.ReactNode;
  social?: React.ReactNode;
};

export function FooterBottom({ logo, social }: FooterBottomProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
      {logo || (
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-navy font-heading text-base font-bold text-white">
            N
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-navy">Navya Collection</div>
            <div className="text-xs text-slate-500">© {new Date().getFullYear()}</div>
          </div>
        </div>
      )}
      {social}
    </div>
  );
}
