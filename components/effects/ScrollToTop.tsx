'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const RADIUS = 25;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Bottom-right scroll-to-top button wrapped in a circular reading-progress
 * ring (the "% scrolled" indicator). The ring is a plain SVG stroke driven by
 * a rAF-throttled scroll listener — no framer-motion in the critical path.
 */
export function ScrollToTop() {
  const id = useId().replace(/:/g, '');
  const [visible, setVisible] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setVisible(window.scrollY > 450);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - p));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Scroll back to top"
      className={cn(
        'fixed bottom-6 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-white/90 text-brand-700 shadow-[0_12px_30px_-10px_rgba(6,64,43,0.55)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-900 dark:bg-ink-soft/90 dark:text-brand-300',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90">
        <defs>
          <linearGradient id={`stt-${id}`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0e7c5a" />
            <stop offset="1" stopColor="#c9a24b" />
          </linearGradient>
        </defs>
        <circle cx="28" cy="28" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
        <circle
          ref={ringRef}
          cx="28"
          cy="28"
          r={RADIUS}
          fill="none"
          stroke={`url(#stt-${id})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          className="transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>
      <ArrowUp className="relative h-5 w-5" strokeWidth={2.4} />
    </button>
  );
}
