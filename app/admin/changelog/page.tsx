import { Rocket, Sparkles } from 'lucide-react';
import { PageHeader, Badge } from '@/components/manage/ui';
import { CHANGELOG, APP_VERSION } from '@/lib/changelog';
import { getLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/adminshell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Changelog' };

const fmtDate = (d: string, locale: string) =>
  new Date(d).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function ChangelogPage() {
  const locale = getLocale();
  const t = getDict(locale).changelog;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {t.title}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 font-mono text-xs font-bold text-white shadow-emerald">
              <Rocket className="h-3.5 w-3.5" /> v{APP_VERSION}
            </span>
          </span>
        }
        subtitle={`${t.subtitle} · ${CHANGELOG.length} ${t.releases}`}
      />

      <ol className="relative ml-3 border-l-2 border-border/80 pl-8">
        {CHANGELOG.map((entry, i) => {
          const isLatest = i === 0;
          const isFirst = i === CHANGELOG.length - 1;
          return (
            <li key={entry.version} className="relative pb-10 last:pb-2">
              {/* timeline dot */}
              <span
                className={
                  isLatest
                    ? 'absolute -left-[41px] top-1 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white shadow-emerald ring-4 ring-brand-50'
                    : 'absolute -left-[37px] top-2 h-[18px] w-[18px] rounded-full border-[3px] border-brand-600/30 bg-card'
                }
              >
                {isLatest && <Sparkles className="h-3 w-3" />}
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={
                    isLatest
                      ? 'rounded-lg bg-brand-600 px-2.5 py-1 font-mono text-sm font-bold text-white shadow-emerald'
                      : 'rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-sm font-bold text-brand-700'
                  }
                >
                  v{entry.version}
                </span>
                <span className="text-sm font-medium text-ink-muted">{fmtDate(entry.date, locale)}</span>
                {isLatest && <Badge tone="gold">{t.latest}</Badge>}
                {isFirst && <Badge tone="emerald">{t.firstRelease}</Badge>}
              </div>

              <ul className="mt-3 space-y-2">
                {entry.items.map((item, j) => (
                  <li
                    key={j}
                    className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm leading-relaxed text-ink shadow-soft transition-colors hover:border-brand-600/25"
                  >
                    {locale === 'bn' ? item.bn : item.en}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
