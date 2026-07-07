import { cn } from '@/lib/utils';

/** Small uppercase kicker label used above section headings. */
export function Eyebrow({
  children,
  className,
  light = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        'ig-eyebrow inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em]',
        light
          ? 'border-white/20 bg-white/10 text-gold-200'
          : 'border-brand-600/15 bg-brand-50 text-brand-700 dark:border-brand-400/20 dark:bg-brand-900/30 dark:text-brand-300',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
      {children}
    </span>
  );
}
