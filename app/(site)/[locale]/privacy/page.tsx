import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { siteConfig, contact } from '@/lib/site';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/legal';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.privacy.metaTitle,
    description: t.privacy.metaDescription,
    alternates: { canonical: '/privacy' },
  };
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const t = getDict(getLocale());
  const tp = t.privacy;
  const lastUpdated = t.lastUpdatedDate;

  return (
    <>
      <PageHero
        eyebrow={t.eyebrow}
        title={tp.title}
        lead={tp.lead}
        crumbs={[{ label: tp.crumb }]}
      />

      <Section className="bg-sand-soft">
        <Container size="narrow">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-10">
            <p className="text-sm text-ink-muted">
              {t.lastUpdatedLabel} {lastUpdated}
            </p>

            <div className="prose-igt mt-6">
              <p>
                <strong>{siteConfig.legalName}</strong>
                {tp.intro.after}
              </p>

              <h2>{tp.s1.h}</h2>
              <p>{tp.s1.p}</p>
              <ul>
                <li>
                  <strong>{tp.s1.li1Strong}</strong>
                  {tp.s1.li1}
                </li>
                <li>
                  <strong>{tp.s1.li2Strong}</strong>
                  {tp.s1.li2}
                </li>
                <li>
                  <strong>{tp.s1.li3Strong}</strong>
                  {tp.s1.li3}
                </li>
                <li>
                  <strong>{tp.s1.li4Strong}</strong>
                  {tp.s1.li4}
                </li>
                <li>
                  <strong>{tp.s1.li5Strong}</strong>
                  {tp.s1.li5}
                </li>
                <li>
                  <strong>{tp.s1.li6Strong}</strong>
                  {tp.s1.li6}
                </li>
              </ul>

              <h2>{tp.s2.h}</h2>
              <ul>
                <li>{tp.s2.li1}</li>
                <li>{tp.s2.li2}</li>
                <li>{tp.s2.li3}</li>
                <li>{tp.s2.li4}</li>
                <li>{tp.s2.li5}</li>
                <li>{tp.s2.li6}</li>
              </ul>

              <h2>{tp.s3.h}</h2>
              <p>{tp.s3.p1}</p>
              <ul>
                <li>
                  <strong>{tp.s3.li1Strong}</strong>
                  {tp.s3.li1}
                </li>
                <li>
                  <strong>{tp.s3.li2Strong}</strong>
                  {tp.s3.li2}
                </li>
                <li>
                  <strong>{tp.s3.li3Strong}</strong>
                  {tp.s3.li3}
                </li>
                <li>
                  <strong>{tp.s3.li4Strong}</strong>
                  {tp.s3.li4}
                </li>
                <li>
                  <strong>{tp.s3.li5Strong}</strong>
                  {tp.s3.li5}
                </li>
              </ul>
              <p>
                {tp.s3.p2Before}
                <strong>{tp.s3.p2Not}</strong>
                {tp.s3.p2After}
              </p>

              <h2>{tp.s4.h}</h2>
              <p>{tp.s4.p}</p>

              <h2>{tp.s5.h}</h2>
              <p>{tp.s5.p}</p>

              <h2>{tp.s6.h}</h2>
              <p>{tp.s6.p}</p>

              <h2>{tp.s7.h}</h2>
              <p>{tp.s7.p}</p>

              <h2>{tp.s8.h}</h2>
              <p>{tp.s8.p1}</p>
              <ul>
                <li>{tp.s8.li1}</li>
                <li>{tp.s8.li2}</li>
                <li>{tp.s8.li3}</li>
                <li>{tp.s8.li4}</li>
              </ul>
              <p>{tp.s8.p2}</p>

              <h2>{tp.s9.h}</h2>
              <p>{tp.s9.p}</p>

              <h2>{tp.s10.h}</h2>
              <p>{tp.s10.p}</p>

              <h2>{tp.s11.h}</h2>
              <p>
                {tp.s11.before}
                <a href={`mailto:${contact.emails[0]}`}>{contact.emails[0]}</a>
                {tp.s11.call}
                <a href={`tel:${contact.phones[0].replace(/\s/g, '')}`}>{contact.phones[0]}</a>
                {tp.s11.write}
                {contact.address.full}
                {tp.s11.end}
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
