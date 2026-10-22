import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Check, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { branches, contact, affiliations } from '@/lib/site';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { whatsappLink } from '@/lib/utils';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/branches';

export function generateStaticParams() {
  return branches.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const branch = branches.find((b) => b.slug === params.slug);
  if (!branch) return { title: 'Branch not found' };
  return {
    title: branch.name,
    description: branch.summary,
    alternates: { canonical: `/branches/${branch.slug}` },
  };
}

export default function BranchPage({ params }: { params: { slug: string; locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const branch = branches.find((b) => b.slug === params.slug);
  if (!branch) notFound();

  const others = branches.filter((b) => b.slug !== branch.slug);

  const locale = getLocale();
  const t = getDict(locale);
  const tb = t.branches[branch.slug];

  return (
    <>
      <PageHero
        eyebrow={tb.role}
        title={branch.name}
        lead={tb.tagline}
        crumbs={[{ label: t.hero.crumb, href: localizedPath(locale, '/branches') }, { label: branch.name }]}
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            {/* main */}
            <div>
              <Reveal>
                <div className="flex flex-wrap items-center gap-5">
                  <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-white p-3 shadow-soft ring-1 ring-border">
                    <Image src={branch.logo} alt={`${branch.name} logo`} width={96} height={96} className="h-full w-full object-contain" />
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {affiliations.map((a) => (
                      <span key={a.short} className="rounded-full border border-border bg-card px-3 py-1.5 text-[0.7rem] font-semibold text-brand-700 shadow-soft dark:text-brand-200">
                        {a.short}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 space-y-4 text-[1.05rem] leading-relaxed text-ink-muted">
                  {tb.description.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </Reveal>

              <Reveal className="mt-10">
                <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">{t.detail.whatWeOffer}</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {tb.services.map((s) => (
                    <div key={s} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-soft">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-ink dark:text-white/90">{s}</span>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* offices */}
              <Reveal className="mt-10">
                <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">{branch.offices.length > 1 ? t.detail.officePlural : t.detail.officeSingular}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {branch.offices.map((o) => (
                    <div key={o.label} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                      <div className="font-display text-lg font-semibold text-ink dark:text-white">{t.officeLabels[o.label] ?? o.label}</div>
                      <p className="mt-2 flex items-start gap-2 text-sm text-ink-muted">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" /> {o.address}
                      </p>
                      <div className="mt-3 flex flex-col gap-1.5">
                        {o.phones.map((p) => (
                          <a key={p} href={`tel:${p.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900">
                            <Phone className="h-3.5 w-3.5" /> {p}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* quick facts sidebar */}
            <div className="lg:pl-2">
              <Reveal className="sticky top-28 rounded-3xl border border-border bg-card p-7 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{t.detail.quickFacts}</div>

                <dl className="mt-5 space-y-5">
                  <div>
                    <dt className="text-sm text-ink-muted">{t.detail.company}</dt>
                    <dd className="mt-0.5 font-semibold text-ink dark:text-white">{branch.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">{t.detail.status}</dt>
                    <dd className="mt-0.5 font-semibold text-ink dark:text-white">{tb.role}</dd>
                  </div>
                  {branch.established && (
                    <div>
                      <dt className="text-sm text-ink-muted">{t.detail.established}</dt>
                      <dd className="mt-0.5 font-semibold text-ink dark:text-white">{branch.established}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-ink-muted">{t.detail.email}</dt>
                    <dd className="mt-0.5">
                      <a href={`mailto:${branch.email}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-900">
                        <Mail className="h-3.5 w-3.5" /> {branch.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-muted">{t.detail.officeHours}</dt>
                    <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-ink dark:text-white">
                      <Clock className="h-3.5 w-3.5 text-gold-500" /> {t.hours}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-2.5 border-t border-border pt-6">
                  <Button href={localizedPath(locale, '/estimate')} variant="gold" size="md" className="w-full">{t.detail.estimateCta}</Button>
                  <Button
                    href={whatsappLink(contact.whatsapp, t.detail.whatsappMessage(branch.name))}
                    external
                    variant="outline"
                    size="md"
                    className="w-full"
                  >
                    {t.detail.whatsappCta}
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* other branches */}
      <Section className="bg-sand-soft">
        <Container>
          <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">{t.detail.otherCompanies}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {others.map((b) => (
              <Link
                key={b.slug}
                href={localizedPath(locale, `/branches/${b.slug}`)}
                className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-soft ring-1 ring-border">
                  <Image src={b.logo} alt={`${b.name} logo`} width={52} height={52} className="h-full w-full object-contain" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold text-ink dark:text-white">{b.name}</div>
                  <div className="truncate text-sm text-ink-muted">{t.branches[b.slug].role}</div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-ink-muted transition group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
