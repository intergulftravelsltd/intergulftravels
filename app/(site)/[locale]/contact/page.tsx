import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, MessageCircle, ArrowUpRight } from 'lucide-react';
import { contact, social, siteConfig } from '@/lib/site';
import { whatsappLink } from '@/lib/utils';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { ContactForm } from '@/components/forms/ContactForm';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/contact';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Inter Gulf Travels Ltd — 31, Purana Paltan, KR Plaza, 5th Floor, Dhaka-1000. Call, email, WhatsApp or send us a message for Hajj, Umrah, visa, air tickets and tours.',
  alternates: { canonical: '/contact' },
};

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(contact.address.mapQuery)}&output=embed`;

export default function ContactPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);

  const infoCards = [
    {
      icon: MapPin,
      title: t.cards.visit,
      lines: [contact.address.line1, contact.address.line2, contact.address.country],
    },
    {
      icon: Phone,
      title: t.cards.call,
      lines: contact.phones,
      hrefs: contact.phones.map((p) => `tel:${p.replace(/\s/g, '')}`),
    },
    {
      icon: Mail,
      title: t.cards.email,
      lines: contact.emails,
      hrefs: contact.emails.map((e) => `mailto:${e}`),
    },
    {
      icon: Clock,
      title: t.cards.hours,
      lines: [contact.hours, t.cards.fridayClosed],
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={
          <>
            {t.hero.titleA}
            <span className="text-gradient-gold">{t.hero.titleHighlight}</span>
          </>
        }
        lead={t.hero.lead}
        crumbs={[{ label: t.hero.crumb }]}
      />

      {/* Info cards */}
      <Section className="bg-sand-soft">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {infoCards.map((c, i) => (
              <Reveal
                key={c.title}
                delay={i * 0.05}
                className="rounded-3xl border border-border bg-card p-7 shadow-soft"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald">
                  <c.icon className="h-6 w-6" />
                </span>
                <h2 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{c.title}</h2>
                <div className="mt-2 space-y-1">
                  {c.lines.map((line, li) => {
                    const href = c.hrefs?.[li];
                    return href ? (
                      <a
                        key={line}
                        href={href}
                        className="block text-sm font-medium text-brand-700 transition-colors hover:text-brand-900 dark:text-brand-300"
                      >
                        {line}
                      </a>
                    ) : (
                      <p key={line} className="text-sm leading-relaxed text-ink-muted">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Form + map */}
      <Section className="pt-0">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            {/* Form */}
            <Reveal className="rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-9">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/15 bg-brand-50 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-400/20 dark:bg-brand-900/30 dark:text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> {t.form.badge}
              </span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
                {t.form.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t.form.intro}
              </p>
              <div className="mt-7">
                <ContactForm />
              </div>
            </Reveal>

            {/* Map + socials */}
            <Reveal delay={0.1} className="flex flex-col gap-6">
              <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
                <iframe
                  src={mapSrc}
                  title={`${siteConfig.name} office location on Google Maps`}
                  className="h-[340px] w-full lg:h-[420px]"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

              <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
                <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{t.chat.heading}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {t.chat.body}
                </p>
                <a
                  href={whatsappLink(contact.whatsapp, t.chat.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-emerald transition hover:bg-brand-700"
                >
                  <MessageCircle className="h-4 w-4" /> {t.chat.whatsappCta} ({contact.whatsappDisplay})
                </a>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {social.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700 dark:hover:text-brand-200"
                    >
                      {s.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
