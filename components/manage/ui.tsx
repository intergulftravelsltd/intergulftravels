import { cn } from '@/lib/utils';
import { money } from '@/lib/management/format';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: React.ReactNode;
  /** Adds a smooth lift + shadow on hover (for interactive/stat cards). */
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300',
        hover && 'hover:-translate-y-1 hover:border-brand-600/30 hover:shadow-emerald',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * KPI tile — soft-tinted gradient card with an icon chip, a big figure and a
 * corner arrow that appears on hover (pages usually wrap it in a <Link>).
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = 'emerald',
  sm = false,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  accent?: 'emerald' | 'gold' | 'red' | 'slate' | 'blue' | 'purple';
  /** Compact variant for secondary metric rows. */
  sm?: boolean;
}) {
  const t = {
    emerald: {
      card: 'from-brand-50/90 to-emerald-50/40 border-brand-600/15',
      chip: 'text-brand-700',
      blob: 'bg-brand-400/25',
    },
    gold: {
      card: 'from-gold-50/95 to-amber-50/40 border-gold-500/25',
      chip: 'text-gold-700',
      blob: 'bg-gold-400/30',
    },
    red: {
      card: 'from-red-50/90 to-rose-50/40 border-red-500/15',
      chip: 'text-red-600',
      blob: 'bg-red-400/20',
    },
    blue: {
      card: 'from-sky-50/90 to-blue-50/40 border-sky-500/20',
      chip: 'text-sky-700',
      blob: 'bg-sky-400/25',
    },
    purple: {
      card: 'from-violet-50/90 to-purple-50/40 border-violet-500/20',
      chip: 'text-violet-700',
      blob: 'bg-violet-400/25',
    },
    slate: {
      card: 'from-muted/80 to-muted/30 border-border',
      chip: 'text-ink-muted',
      blob: 'bg-ink-muted/10',
    },
  }[accent];

  return (
    <div
      className={cn(
        'group relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald',
        t.card,
        sm ? 'p-4' : 'p-5',
      )}
    >
      {/* decorative glow that swells on hover */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-150',
          t.blob,
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        {Icon ? (
          <span
            className={cn(
              'grid shrink-0 place-items-center rounded-xl bg-white/90 shadow-soft ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110',
              sm ? 'h-9 w-9' : 'h-11 w-11',
              t.chip,
            )}
          >
            <Icon className={sm ? 'h-4 w-4' : 'h-5 w-5'} />
          </span>
        ) : (
          <span />
        )}
        <ArrowUpRight
          className="h-4 w-4 -translate-x-1 translate-y-1 text-ink-muted/0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-ink-muted/70"
        />
      </div>
      <p className={cn('relative mt-3 font-display font-bold tracking-tight text-ink', sm ? 'text-lg' : 'text-[26px] leading-9')}>
        {value}
      </p>
      <p className={cn('relative mt-0.5 font-semibold text-ink', sm ? 'text-xs' : 'text-[13px]')}>{label}</p>
      {hint && <p className="relative mt-0.5 truncate text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Money({ value, className }: { value: number | string | null | undefined; className?: string }) {
  const v = Number(value ?? 0);
  return <span className={cn('tabular-nums', v < 0 && 'text-red-600', className)}>{money(v)}</span>;
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'gold' | 'red' | 'blue';
}) {
  const tones = {
    slate: 'bg-muted text-ink-muted',
    emerald: 'bg-brand-50 text-brand-700',
    gold: 'bg-gold-50 text-gold-700',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-sky-50 text-sky-700',
  }[tone];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones)}>
      {children}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-md text-sm text-ink-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Responsive table shell. Pass <thead>/<tbody> as children. */
export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-border bg-card shadow-soft', className)}>
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

export const thClass =
  'border-b border-border bg-muted/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted';
export const tdClass = 'border-b border-border/70 px-4 py-3 text-ink';

export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-sm font-medium text-ink">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20';
