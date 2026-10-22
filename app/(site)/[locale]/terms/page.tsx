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
    title: t.terms.metaTitle,
    description: t.terms.metaDescription,
    alternates: { canonical: '/terms' },
  };
}

export default function TermsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const t = getDict(getLocale());
  const tt = t.terms;
  const lastUpdated = t.lastUpdatedDate;

  return (
    <>
      <PageHero
        eyebrow={t.eyebrow}
        title={tt.title}
        lead={tt.lead}
        crumbs={[{ label: tt.crumb }]}
      />

      <Section className="bg-sand-soft">
        <Container size="narrow">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-10">
            <p className="text-sm text-ink-muted">
              {t.lastUpdatedLabel} {lastUpdated}
            </p>

            <div className="prose-igt mt-6">
              <p>
                {tt.intro.before}
                <strong>{siteConfig.legalName}</strong>
                {tt.intro.after}
                {siteConfig.license}
                {tt.intro.afterLicense}
              </p>

              <h2>{tt.s1.h}</h2>
              <p>{tt.s1.p}</p>

              <h2>{tt.s2.h}</h2>
              <ul>
                <li>{tt.s2.li1}</li>
                <li>{tt.s2.li2}</li>
                <li>{tt.s2.li3}</li>
                <li>{tt.s2.li4}</li>
              </ul>

              <h2>{tt.s3.h}</h2>
              <ul>
                <li>{tt.s3.li1}</li>
                <li>{tt.s3.li2}</li>
                <li>{tt.s3.li3}</li>
                <li>{tt.s3.li4}</li>
              </ul>

              <h2>{tt.s4.h}</h2>
              <p>{tt.s4.p1}</p>
              <ul>
                <li>
                  <strong>{tt.s4.li1Strong}</strong>
                  {tt.s4.li1}
                </li>
                <li>
                  <strong>{tt.s4.li2Strong}</strong>
                  {tt.s4.li2}
                </li>
                <li>
                  <strong>{tt.s4.li3Strong}</strong>
                  {tt.s4.li3}
                </li>
                <li>
                  <strong>{tt.s4.li4Strong}</strong>
                  {tt.s4.li4}
                </li>
                <li>{tt.s4.li5}</li>
              </ul>
              <p>{tt.s4.p2}</p>

              <h2>{tt.s5.h}</h2>
              <ul>
                <li>{tt.s5.li1}</li>
                <li>{tt.s5.li2}</li>
              </ul>

              <h2>{tt.s6.h}</h2>
              <ul>
                <li>{tt.s6.li1}</li>
                <li>{tt.s6.li2}</li>
                <li>{tt.s6.li3}</li>
                <li>{tt.s6.li4}</li>
              </ul>

              <h2>{tt.s7.h}</h2>
              <p>{tt.s7.p}</p>

              <h2>{tt.s8.h}</h2>
              <p>{tt.s8.p}</p>

              <h2>{tt.s9.h}</h2>
              <ul>
                <li>{tt.s9.li1}</li>
                <li>{tt.s9.li2}</li>
                <li>{tt.s9.li3}</li>
                <li>{tt.s9.li4}</li>
              </ul>

              <h2>{tt.s10.h}</h2>
              <p>{tt.s10.p}</p>

              <h2>{tt.s11.h}</h2>
              <p>{tt.s11.p}</p>

              <h2>{tt.s12.h}</h2>
              <p>{tt.s12.p}</p>

              <h2>{tt.s13.h}</h2>
              <p>{tt.s13.p}</p>

              <h2>{tt.s14.h}</h2>
              <p>
                {tt.s14.before}
                <a href={`mailto:${contact.emails[0]}`}>{contact.emails[0]}</a>
                {tt.s14.call}
                <a href={`tel:${contact.phones[0].replace(/\s/g, '')}`}>{contact.phones[0]}</a>
                {tt.s14.visit}
                {contact.address.full}
                {tt.s14.end}
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
