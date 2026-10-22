'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Loader2, MessageSquare, MoreHorizontal, Pencil, Printer, Share2, Trash2, type LucideIcon } from 'lucide-react';
import { confirmDialog } from '@/components/admin/confirm';
import { DocStatusDialog } from '@/components/manage/DocStatusViewer';
import type { DocProgram } from '@/lib/management/doc-status';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminshell';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 *  One "⋯" button per list row that opens a dropdown of actions — Print
 *  receipt, Share link, Document checklist, Send SMS, Edit, Remove —
 *  instead of five separate buttons crowding the Manage column.
 *
 *  Items are plain data (string icon keys, hrefs, endpoints) so server
 *  pages can describe them; the menu renders in a portal so the table's
 *  horizontal scroll container never clips it.
 * ------------------------------------------------------------------ */

export type RowMenuIcon = 'print' | 'share' | 'docs' | 'edit' | 'delete' | 'sms';

export type RowMenuItem =
  | { kind: 'link'; icon: RowMenuIcon; label: string; href: string; newTab?: boolean }
  | { kind: 'docs'; label: string; value: unknown; program: DocProgram; subtitle?: string }
  | { kind: 'delete'; label: string; endpoint: string; confirmMessage: string };

const ICONS: Record<RowMenuIcon, LucideIcon> = {
  print: Printer,
  share: Share2,
  docs: Eye,
  edit: Pencil,
  delete: Trash2,
  sms: MessageSquare,
};

const MENU_W = 220;

export function RowMenu({ name, items }: { name: string; items: RowMenuItem[] }) {
  const router = useRouter();
  const locale = useLocale();
  const t = getDict(locale).rowActions;
  const [open, setOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // null until measured, so the menu never paints at an unplaced position.
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const docsItem = items.find((i): i is Extract<RowMenuItem, { kind: 'docs' }> => i.kind === 'docs');

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    const estimatedH = 44 * items.length + 16;
    // Open upward when there is no room below the button.
    if (r.bottom + estimatedH > window.innerHeight - 8 && r.top > estimatedH) {
      setPos({ bottom: window.innerHeight - r.top + 6, left });
    } else {
      setPos({ top: r.bottom + 6, left });
    }
  }, [items.length]);

  useEffect(() => {
    if (open) place();
    else setPos(null);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onMove = () => place();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, place]);

  async function remove(item: Extract<RowMenuItem, { kind: 'delete' }>) {
    setOpen(false);
    if (!(await confirmDialog({ message: item.confirmMessage, confirmText: t.delete, danger: true }))) return;
    setBusy(true);
    try {
      const res = await fetch(item.endpoint, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.couldNotDelete);
        return;
      }
      toast.success(t.deleted(name));
      router.refresh();
    } catch {
      toast.error(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  const itemClass =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-muted/80';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.more} — ${name}`}
        title={t.more}
        className={cn(
          'inline-grid h-8 w-8 place-items-center rounded-lg border border-border text-ink-muted transition hover:border-brand-600/40 hover:bg-muted/60 hover:text-brand-700 disabled:opacity-50',
          open && 'border-brand-600/50 bg-brand-50 text-brand-700',
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
      </button>

      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: MENU_W }}
            className="z-[80] animate-fade-up rounded-xl border border-border bg-card p-1.5 shadow-emerald [animation-duration:150ms]"
          >
            {items.map((item, i) => {
              if (item.kind === 'link') {
                const Icon = ICONS[item.icon];
                const external = item.newTab;
                return external ? (
                  <a
                    key={i}
                    href={item.href}
                    target="_blank"
                    rel="noopener"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={itemClass}
                  >
                    <Icon className="h-4 w-4 text-ink-muted" /> {item.label}
                  </a>
                ) : (
                  <Link key={i} href={item.href} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                    <Icon className="h-4 w-4 text-ink-muted" /> {item.label}
                  </Link>
                );
              }
              if (item.kind === 'docs') {
                return (
                  <button
                    key={i}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      setDocsOpen(true);
                    }}
                    className={itemClass}
                  >
                    <Eye className="h-4 w-4 text-ink-muted" /> {item.label}
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  onClick={() => void remove(item)}
                  className={cn(itemClass, 'mt-1 border-t border-border/70 pt-2 text-red-600 hover:bg-red-50')}
                >
                  <Trash2 className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      {docsItem && (
        <DocStatusDialog
          open={docsOpen}
          onClose={() => setDocsOpen(false)}
          name={name}
          subtitle={docsItem.subtitle}
          value={docsItem.value}
          program={docsItem.program}
        />
      )}
    </>
  );
}
