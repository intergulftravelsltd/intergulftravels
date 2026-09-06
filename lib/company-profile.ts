/* ------------------------------------------------------------------ *
 *  Company profile — the letterhead every ledger, statement, receipt and
 *  export prints under. Multi-tenant: each branch/agency signed in to the
 *  console gets ITS OWN name, offices, phones, email and logo. Defaults come
 *  from the static branch list in lib/site.ts; an admin-editable override
 *  (stored in site_settings under `company_profile:<branch>`) wins when set.
 *
 *  Plain module (no server imports) so both server loaders and client
 *  components (ExportBar, receipts) can share the type + defaults.
 * ------------------------------------------------------------------ */

import { branches, siteConfig, contact } from '@/lib/site';

export type CompanyProfile = {
  /** Branch value this profile belongs to ('general' = head office / group). */
  slug: string;
  name: string;
  /** Second line under the name, e.g. "Govt. Approved Travel Agency". */
  license: string;
  headOffice: string;
  branchOffice: string;
  /** Comma-separated mobile numbers. */
  phone: string;
  email: string;
  /** Public URL / path of the logo used in headers + as the print watermark. */
  logo: string;
};

export const COMPANY_PROFILE_KEY_PREFIX = 'company_profile:';

export function companyProfileKey(branch: string): string {
  return `${COMPANY_PROFILE_KEY_PREFIX}${branch}`;
}

/** Static default letterhead for a branch (falls back to the group head office). */
export function defaultCompanyProfile(branch?: string | null): CompanyProfile {
  const b = branches.find((x) => x.slug === branch);
  if (b) {
    const head = b.offices.find((o) => /head/i.test(o.label)) ?? b.offices[0];
    const other = b.offices.find((o) => o !== head);
    const phones = Array.from(new Set(b.offices.flatMap((o) => o.phones)));
    return {
      slug: b.slug,
      name: b.name,
      license: b.role,
      headOffice: head?.address ?? contact.address.full,
      branchOffice: other ? other.address : '',
      phone: (phones.length ? phones : [...contact.phones]).join(', '),
      email: b.email,
      logo: b.logo,
    };
  }
  return {
    slug: 'general',
    name: siteConfig.name,
    license: siteConfig.license,
    headOffice: contact.address.full,
    branchOffice: '',
    phone: contact.phones.join(', '),
    email: contact.emails[0],
    logo: branches[0].logo,
  };
}

const STRING_FIELDS: (keyof CompanyProfile)[] = [
  'name',
  'license',
  'headOffice',
  'branchOffice',
  'phone',
  'email',
  'logo',
];

/** Overlay a saved override (untrusted JSON) on top of the defaults. */
export function mergeCompanyProfile(base: CompanyProfile, override: unknown): CompanyProfile {
  if (!override || typeof override !== 'object') return base;
  const o = override as Record<string, unknown>;
  const out: CompanyProfile = { ...base };
  for (const key of STRING_FIELDS) {
    const v = o[key];
    if (typeof v === 'string') (out as unknown as Record<string, string>)[key] = v.trim();
  }
  // Never let an override blank the name or logo — the print would lose its header.
  if (!out.name) out.name = base.name;
  if (!out.logo) out.logo = base.logo;
  return out;
}

/** Single-line address block used by plain-text exports (Excel / PDF). */
export function companyAddressLines(c: CompanyProfile, labels: { head: string; branch: string; mobile: string; email: string }): string[] {
  const lines: string[] = [];
  if (c.headOffice) lines.push(`${labels.head}: ${c.headOffice}`);
  if (c.branchOffice) lines.push(`${labels.branch}: ${c.branchOffice}`);
  const contactBits: string[] = [];
  if (c.phone) contactBits.push(`${labels.mobile}: ${c.phone}`);
  if (c.email) contactBits.push(`${labels.email}: ${c.email}`);
  if (contactBits.length) lines.push(contactBits.join('  ·  '));
  return lines;
}
