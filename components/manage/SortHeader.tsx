import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

/**
 * Column header that toggles a sort: a link (works in a server component)
 * with an icon showing the current direction. `direction` is null while the
 * list is ordered by something else; the first click sorts ascending, the
 * next one descending.
 */
export function SortHeader({
  label,
  href,
  direction,
  title,
}: {
  label: string;
  /** Where a click goes — the caller builds it with the next sort value. */
  href: string;
  direction: 'asc' | 'desc' | null;
  title?: string;
}) {
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <Link
      href={href}
      scroll={false}
      title={title}
      aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}
      className={`inline-flex items-center gap-1.5 rounded-md transition hover:text-brand-700 ${
        direction ? 'text-brand-700' : ''
      }`}
    >
      {label}
      <Icon className={`h-3.5 w-3.5 ${direction ? '' : 'opacity-60'}`} />
    </Link>
  );
}
