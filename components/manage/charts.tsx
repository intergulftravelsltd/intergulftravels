'use client';

import { useEffect, useRef, useState } from 'react';
import { money } from '@/lib/management/format';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 *  Lightweight dashboard visuals — hand-rolled SVG/CSS, zero chart
 *  libraries, so the admin first-load stays lean. Everything respects
 *  prefers-reduced-motion.
 * ------------------------------------------------------------------ */

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMounted(true);
      return;
    }
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

/** Compact BDT figure for axes/chips: 1.2k · 3.4 L · 2.15 Cr. */
export function shortMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1e7) return `${sign}${(abs / 1e7).toFixed(abs >= 1e8 ? 0 : 2)} Cr`;
  if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1)} L`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}k`;
  return `${sign}${Math.round(abs)}`;
}

/* ------------------------------- CountUp ------------------------------- */

export function CountUp({
  value,
  money: asMoney = false,
  duration = 900,
  className,
}: {
  value: number;
  /** Format as ৳ money (lakh/crore grouping); otherwise plain grouped number. */
  money?: boolean;
  duration?: number;
  className?: string;
}) {
  const [progress, setProgress] = useState(0);
  const target = useRef(value);
  target.current = value;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setProgress(1 - Math.pow(1 - p, 3)); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const shown = Math.round(target.current * progress);
  return (
    <span className={cn('tabular-nums', className)}>
      {asMoney ? money(shown) : new Intl.NumberFormat('en-IN').format(shown)}
    </span>
  );
}

/* ------------------------------- Donut --------------------------------- */

export type DonutSegment = { label: string; value: number; color: string };

/**
 * Circular composition chart with an animated sweep-in, a big centre figure
 * and a legend with per-segment share. Pass 2–5 segments.
 */
export function DonutChart({
  segments,
  centerLabel,
  emptyLabel,
  size = 196,
  thickness = 24,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  emptyLabel: string;
  size?: number;
  thickness?: number;
}) {
  const mounted = useMounted();
  const clean = segments.map((s) => ({ ...s, value: Math.max(0, s.value) }));
  const total = clean.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  // A hairline gap between segments (only when more than one is visible).
  const visible = clean.filter((s) => s.value > 0).length;
  const gap = visible > 1 ? C * 0.012 : 0;

  let acc = 0;
  const arcs = clean.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const len = Math.max(0, frac * C - gap);
    const arc = { ...s, frac, len, offset: acc };
    acc += frac * C;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={thickness}
            className="stroke-muted"
          />
          {total > 0 &&
            arcs.map(
              (a, i) =>
                a.len > 0 && (
                  <circle
                    key={a.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={thickness}
                    strokeLinecap={visible > 1 ? 'butt' : 'round'}
                    strokeDasharray={`${mounted ? a.len : 0} ${C}`}
                    strokeDashoffset={-(a.offset + gap / 2)}
                    className="transition-[stroke-dasharray] duration-1000 ease-out"
                    style={{ transitionDelay: `${120 + i * 140}ms` }}
                  >
                    <title>{`${a.label}: ${money(a.value)} (${Math.round(a.frac * 100)}%)`}</title>
                  </circle>
                ),
            )}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            {total > 0 ? (
              <>
                <p className="font-display text-xl font-bold text-ink">
                  <CountUp value={total} money />
                </p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  {centerLabel}
                </p>
              </>
            ) : (
              <p className="max-w-[120px] text-xs text-ink-muted">{emptyLabel}</p>
            )}
          </div>
        </div>
      </div>

      {total > 0 && (
        <ul className="w-full space-y-2">
          {arcs.map((a) => (
            <li key={a.label} className="flex items-center gap-2.5 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: a.color }} />
              <span className="min-w-0 flex-1 truncate text-ink-muted">{a.label}</span>
              <span className="font-semibold tabular-nums text-ink">{shortMoney(a.value)}</span>
              <span className="w-10 text-right text-xs tabular-nums text-ink-muted">
                {Math.round(a.frac * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------- Towers -------------------------------- */

export type MonthPoint = { label: string; income: number; expense: number };

/**
 * Grouped "tower" chart: income vs expense per month, staggered grow-in,
 * hover value bubbles, soft gridlines. Pure flexbox — fully responsive.
 */
export function TowersChart({
  data,
  inLabel,
  outLabel,
  emptyLabel,
}: {
  data: MonthPoint[];
  inLabel: string;
  outLabel: string;
  emptyLabel: string;
}) {
  const mounted = useMounted();
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const hasAny = data.some((d) => d.income > 0 || d.expense > 0);
  const ticks = [1, 0.5, 0]; // top, middle, base gridlines

  if (!hasAny) {
    return (
      <div className="grid h-56 place-items-center text-sm text-ink-muted">{emptyLabel}</div>
    );
  }

  return (
    <div>
      <div className="relative">
        {/* gridlines + axis figures */}
        {ticks.map((t) => (
          <div
            key={t}
            className="pointer-events-none absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${t * 100}%` }}
          >
            <span className="w-10 -translate-y-1/2 text-right text-[10px] tabular-nums text-ink-muted/70">
              {shortMoney(max * t)}
            </span>
            <div className={cn('h-px flex-1', t === 0 ? 'bg-border' : 'bg-border/50')} />
          </div>
        ))}

        <div className="ml-12 flex h-56 items-end gap-1.5 sm:gap-2.5">
          {data.map((d, i) => (
            <div key={d.label + i} className="group flex h-full flex-1 items-end justify-center gap-[3px]">
              {(
                [
                  { v: d.income, cls: 'from-brand-600 to-brand-400', title: `${inLabel} · ${d.label}: ${money(d.income)}` },
                  { v: d.expense, cls: 'from-red-500 to-rose-300', title: `${outLabel} · ${d.label}: ${money(d.expense)}` },
                ] as const
              ).map((bar, j) => {
                const pct = Math.max(bar.v > 0 ? 2.5 : 1, (bar.v / max) * 100);
                return (
                  <div key={j} className="relative flex h-full w-full max-w-[18px] items-end">
                    <span
                      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow-soft transition-opacity duration-200 group-hover:opacity-100"
                      style={{ bottom: `calc(${pct}% + 6px)` }}
                    >
                      {shortMoney(bar.v)}
                    </span>
                    <div
                      title={bar.title}
                      className={cn(
                        'w-full origin-bottom rounded-t-[5px] bg-gradient-to-t transition-transform duration-700 ease-out group-hover:brightness-110',
                        bar.cls,
                        bar.v <= 0 && 'opacity-30',
                      )}
                      style={{
                        height: `${pct}%`,
                        transform: mounted ? 'scaleY(1)' : 'scaleY(0)',
                        transitionDelay: `${i * 45 + j * 25}ms`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="ml-12 mt-2 flex gap-1.5 sm:gap-2.5">
        {data.map((d, i) => (
          <p key={d.label + i} className="flex-1 truncate text-center text-[10px] font-medium text-ink-muted">
            {d.label}
          </p>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- In/Out/Net chips --------------------------- */

export function FlowChips({
  income,
  expense,
  inLabel,
  outLabel,
  netLabel,
}: {
  income: number;
  expense: number;
  inLabel: string;
  outLabel: string;
  netLabel: string;
}) {
  const net = income - expense;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> {inLabel} {shortMoney(income)}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {outLabel} {shortMoney(expense)}
      </span>
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-1',
          net >= 0 ? 'bg-brand-600 text-white' : 'bg-red-600 text-white',
        )}
      >
        {netLabel} {shortMoney(net)}
      </span>
    </div>
  );
}
