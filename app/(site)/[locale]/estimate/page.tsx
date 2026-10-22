import type { Metadata } from 'next';
import { ShieldCheck, Wallet, Clock4, HeartHandshake, Phone, MessageCircle } from 'lucide-react';
import { contact } from '@/lib/site';
import { whatsappLink } from '@/lib/utils';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { EstimateForm } from '@/components/forms/EstimateForm';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/estimate';

const valuePropIcons = [Wallet, Clock4, ShieldCheck, HeartHandshake];

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: { canonical: '/estimate' },
  };
}

export default function EstimatePage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const valueProps = t.valueProps.map((v, i) => ({ ...v, icon: valuePropIcons[i] }));
  const includedNotes = t.includedNotes;

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={
          <>
            {t.hero.titlePrefix}
            <span className="text-gradient-gold">{t.hero.titleHighlight}</span>
          </>
        }
        lead={t.hero.lead}
        crumbs={[{ label: t.hero.crumb }]}
      />

      {/* Value props */}
      <Section className="bg-sand-soft">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((v, i) => (
              <Reveal
                key={v.title}
                delay={i * 0.05}
                className="rounded-3xl border border-border bg-card p-7 shadow-soft"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <v.icon className="h-6 w-6" />
                </span>
                <h2 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{v.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Form + side panel */}
      <Section className="pt-0">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
            {/* Form */}
            <Reveal className="rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-9">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/15 bg-brand-50 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-400/20 dark:bg-brand-900/30 dark:text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> {t.formPanel.badge}
              </span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
                {t.formPanel.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t.formPanel.sub}
              </p>
              <div className="mt-7">
                <EstimateForm />
              </div>
            </Reveal>

            {/* Side panel */}
            <Reveal delay={0.1} className="flex flex-col gap-6">
              <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white shadow-emerald">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      'linear-gradient(30deg,#fff 1px,transparent 1px),linear-gradient(-30deg,#fff 1px,transparent 1px)',
                    backgroundSize: '36px 36px',
                  }}
                />
                <h3 className="relative font-display text-xl font-semibold">{t.receive.heading}</h3>
                <ul className="relative mt-5 space-y-3">
                  {includedNotes.map((n) => (
                    <li key={n} className="flex items-start gap-3 text-sm text-white/90">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-300" /> {n}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
                <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{t.talk.heading}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {t.talk.body}
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <a
                    href={`tel:${contact.phones[0].replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-600/30 px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 dark:text-brand-200"
                  >
                    <Phone className="h-4 w-4" /> {contact.phones[0]}
                  </a>
                  <a
                    href={whatsappLink(contact.whatsapp, t.talk.whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-emerald transition hover:bg-brand-700"
                  >
                    <MessageCircle className="h-4 w-4" /> {t.talk.whatsappCta}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
