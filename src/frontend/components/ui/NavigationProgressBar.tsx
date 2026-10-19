'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setVisible(true);
    setProgress(15);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        // Smooth logarithmic deceleration as it nears 85%
        const diff = 85 - prev;
        const step = Math.max(1, Math.floor(diff * 0.15));
        return Math.min(85, prev + step);
      });
    }, 150);

    // Auto-fallback timeout after 10s in case navigation gets aborted
    timeoutRef.current = setTimeout(() => {
      completeProgress();
    }, 10000);
  };

  const completeProgress = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setProgress(100);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      timeoutRef.current = setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 200);
  };

  // Complete progress whenever URL pathname or search query completes transition
  useEffect(() => {
    if (visible) {
      completeProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Global click listener to intercept internal link navigations
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // Don't intercept if modifier keys were pressed (open in new tab)
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore mailto, tel, javascript, hash-only anchors, external targets
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href.startsWith('#') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      // Check if URL is internal
      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Cross-domain links
        if (targetUrl.origin !== currentUrl.origin) return;

        // Same URL with just hash change
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
          return;
        }

        // Start top progress indicator immediately
        startProgress();
      } catch {
        // Ignore invalid URLs
      }
    };

    const handlePopState = () => {
      startProgress();
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] bg-transparent"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 250ms ease-out',
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-orange via-[#ff7849] to-orange shadow-[0_0_12px_#F15A25]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 150ms ease-out' : 'width 200ms ease-out',
        }}
      >
        {/* Glowing tip indicator */}
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-white/50 blur-[0.5px]" />
      </div>
    </div>
  );
}
