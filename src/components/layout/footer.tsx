export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-navy font-heading text-base font-bold text-white">
              N
            </div>
            <div>
              <div className="text-sm font-bold text-navy">Navya</div>
              <div className="text-xs text-slate-500">Collection</div>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500">
            <p>Affordable Premium Fashion for Gents and Kids</p>
            <p className="mt-1">© {new Date().getFullYear()} Navya Collection. All rights reserved.</p>
          </div>

          <div className="flex gap-4 text-sm font-medium text-slate-600">
            <a href="/about" className="hover:text-navy">About</a>
            <a href="/contact" className="hover:text-navy">Contact</a>
            <a href="#phases" className="hover:text-navy">Phases</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
