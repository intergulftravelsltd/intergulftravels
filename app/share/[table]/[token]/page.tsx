import { notFound } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { mgmtDb } from '@/lib/management/server';
import { verifyShareToken } from '@/lib/management/share-token';
import { naturalBalance, type AccountHead } from '@/lib/management/types';
import { money } from '@/lib/management/format';
import { DOC_STATUS_KEYS, docStatusLabel, normalizeDocStatus } from '@/lib/management/doc-status';
import { branchCompany } from '@/lib/site';
import { getLocale } from '@/lib/i18n-server';
import { ShareActions } from '@/components/manage/ShareActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pilgrim Form', robots: { index: false, follow: false } };

const TABLES: Record<string, string> = { hajj: 'hajj_pilgrims', umrah: 'umrah_passengers' };

const L = {
  en: {
    hajjTitle: 'Hajj Pilgrim Information Form',
    umrahTitle: 'Umrah Passenger Information Form',
    tracking: 'Tracking No',
    year: 'Hajj year',
    regType: 'Registration type',
    preReg: 'Pre-registration',
    registered: 'Registered',
    preRegNo: 'Pre-registration No',
    govtSerial: 'Govt. serial No',
    nameBn: 'Name (Bangla)',
    father: "Father's name",
    mother: "Mother's name",
    dob: 'Date of birth',
    gender: 'Gender',
    nid: 'NID',
    passport: 'Passport No',
    passportIssue: 'Passport issue',
    passportExpiry: 'Passport expiry',
    phone: 'Phone',
    district: 'District',
    address: 'Address',
    careOf: 'Care of',
    package: 'Package',
    docsHeading: 'Document checklist',
    done: 'Done',
    pending: 'Pending',
    accountHeading: 'Account summary',
    charged: 'Total package',
    paid: 'Total paid',
    due: 'Balance due',
    generated: 'This form was issued by',
  },
  bn: {
    hajjTitle: 'হজযাত্রীর তথ্য ফরম',
    umrahTitle: 'উমরাহ যাত্রীর তথ্য ফরম',
    tracking: 'ট্র্যাকিং নং',
    year: 'হজ সাল',
    regType: 'নিবন্ধনের ধরন',
    preReg: 'প্রাক-নিবন্ধন',
    registered: 'নিবন্ধিত',
    preRegNo: 'প্রাক-নিবন্ধন নং',
    govtSerial: 'সরকারি সিরিয়াল নং',
    nameBn: 'নাম (বাংলা)',
    father: 'পিতার নাম',
    mother: 'মাতার নাম',
    dob: 'জন্ম তারিখ',
    gender: 'লিঙ্গ',
    nid: 'এনআইডি',
    passport: 'পাসপোর্ট নং',
    passportIssue: 'পাসপোর্ট ইস্যু',
    passportExpiry: 'পাসপোর্ট মেয়াদ',
    phone: 'ফোন',
    district: 'জেলা',
    address: 'ঠিকানা',
    careOf: 'কেয়ার অফ',
    package: 'প্যাকেজ',
    docsHeading: 'ডকুমেন্ট চেকলিস্ট',
    done: 'সম্পন্ন',
    pending: 'বাকি',
    accountHeading: 'হিসাব সারাংশ',
    charged: 'মোট প্যাকেজ',
    paid: 'মোট পরিশোধিত',
    due: 'বাকি',
    generated: 'এই ফরমটি ইস্যু করেছে',
  },
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

type Row = { id: string; [k: string]: unknown };

export default async function SharedPilgrimFormPage({ params }: { params: { table: string; token: string } }) {
  const locale = getLocale();
  const t = L[locale];
  const table = TABLES[params.table];
  if (!table) notFound();

  const id = verifyShareToken(params.table as 'hajj' | 'umrah', decodeURIComponent(params.token));
  if (!id) notFound();

  const db = mgmtDb();
  const { data } = await db.from(table).select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const p = data as Row;

  const [pkgRes, affRes, headRes] = await Promise.all([
    p.package_id
      ? db.from('mgmt_packages').select('name, price').eq('id', p.package_id as string).maybeSingle()
      : Promise.resolve({ data: null }),
    p.affiliate_id
      ? db.from('affiliates').select('name').eq('id', p.affiliate_id as string).maybeSingle()
      : Promise.resolve({ data: null }),
    p.account_head_id
      ? db.from('account_heads').select('*').eq('id', p.account_head_id as string).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const pkg = pkgRes.data as { name?: string; price?: number } | null;
  const aff = affRes.data as { name?: string } | null;
  const head = (headRes.data as AccountHead | null) ?? null;

  const isHajj = params.table === 'hajj';
  const company = branchCompany(p.branch as string);
  const docsDone = normalizeDocStatus(p.doc_status);

  const charged = head ? Number(head.debit_total) : 0;
  const paid = head ? Number(head.credit_total) : 0;
  const due = head ? Math.max(0, naturalBalance(head)) : 0;

  const str = (v: unknown) => (v == null || v === '' ? '' : String(v));
  const rows: [string, string][] = isHajj
    ? [
        [t.tracking, str(p.tracking_no)],
        [t.year, str(p.year)],
        [t.regType, p.reg_type === 'registered' ? t.registered : t.preReg],
        [t.preRegNo, str(p.pre_reg_no)],
        [t.govtSerial, str(p.govt_serial)],
        [t.nameBn, str(p.name_bn)],
        [t.father, str(p.father_name)],
        [t.mother, str(p.mother_name)],
        [t.dob, fmtDate(p.dob as string | null)],
        [t.gender, str(p.gender)],
        [t.nid, str(p.nid)],
        [t.passport, str(p.passport_no)],
        [t.phone, str(p.phone)],
        [t.district, str(p.district)],
        [t.address, str(p.address)],
        [t.careOf, str(aff?.name)],
        [t.package, pkg?.name ? `${pkg.name} · ${money(pkg.price ?? 0)}` : ''],
      ]
    : [
        [t.nameBn, str(p.name_bn)],
        [t.passport, str(p.passport_no)],
        [t.passportIssue, fmtDate(p.passport_issue as string | null)],
        [t.passportExpiry, fmtDate(p.passport_expiry as string | null)],
        [t.dob, fmtDate(p.dob as string | null)],
        [t.phone, str(p.phone)],
        [t.address, str(p.address)],
        [t.careOf, str(aff?.name)],
        [t.package, pkg?.name ? `${pkg.name} · ${money(pkg.price ?? 0)}` : ''],
      ];

  return (
    <div className="min-h-screen bg-neutral-100 p-4 text-black sm:p-8">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #share-form, #share-form * { visibility: visible !important; }
          #share-form { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; overflow: visible !important; }
          .no-print { display: none !important; }
          /* Pin the watermark to the centre of the printed page so it can never
             be clipped by the form box or a fragment boundary. */
          #share-watermark {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 62% !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { margin: 12mm; }
        }
      `}</style>

      <ShareActions />

      <div id="share-form" className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Watermark */}
        <img
          id="share-watermark"
          src={company.logo}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2 select-none"
          // Uniform grey stamp: without the grayscale+brightness filter the
          // light-coloured parts of the logos fade into the white paper and the
          // watermark looks "half printed".
          style={{ opacity: 0.16, filter: 'grayscale(1) brightness(0.45)' }}
        />

        <div className="relative">
          {/* Company header */}
          <div className="flex items-center gap-4 border-b-2 border-emerald-700 pb-4">
            <img src={company.logo} alt={company.name} className="h-16 w-16 shrink-0 object-contain" />
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-emerald-800">{company.name}</h1>
              <p className="mt-1 text-sm text-gray-600">{company.address}</p>
              <p className="text-sm text-gray-600">
                {company.phone} · {company.email}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-gray-500">{company.license}</p>
            </div>
            <div className="h-16 w-16 shrink-0" />
          </div>

          {/* Title */}
          <div className="my-5 text-center">
            <span className="inline-block rounded-full border border-emerald-700 px-5 py-1 text-lg font-bold tracking-wide text-emerald-800">
              {isHajj ? t.hajjTitle : t.umrahTitle}
            </span>
          </div>

          {/* Photo + name */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-bold text-gray-900">{str(p.name)}</p>
              {str(p.passport_no) && (
                <p className="text-sm text-gray-600">
                  {t.passport}: <span className="font-semibold text-gray-800">{str(p.passport_no)}</span>
                </p>
              )}
            </div>
            {str(p.photo_url) && (
              <img
                src={str(p.photo_url)}
                alt={str(p.name)}
                className="h-28 w-24 shrink-0 rounded-lg border border-gray-300 object-cover"
              />
            )}
          </div>

          {/* Info grid */}
          <div className="grid gap-x-8 sm:grid-cols-2">
            {rows
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-gray-100 py-1.5 text-[0.92rem]">
                  <span className="shrink-0 text-gray-500">{label}</span>
                  <span className="text-right font-medium text-gray-900">{value}</span>
                </div>
              ))}
          </div>

          {/* Document checklist */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-gray-700">{t.docsHeading}</p>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {DOC_STATUS_KEYS.map((k, i) => {
                const ok = docsDone.includes(k);
                return (
                  <div key={k} className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5 text-sm">
                    <span className="text-gray-800">
                      <span className="mr-1.5 text-xs text-gray-400">{i + 1}.</span>
                      {docStatusLabel(k, locale)}
                    </span>
                    {ok ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <Check className="h-4 w-4" /> {t.done}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                        <X className="h-4 w-4" /> {t.pending}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account summary */}
          {head && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.accountHeading}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="text-xs text-gray-500">{t.charged}</p>
                  <p className="font-bold text-gray-900">{money(charged)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
                  <p className="text-xs text-emerald-700">{t.paid}</p>
                  <p className="font-bold text-emerald-800">{money(paid)}</p>
                </div>
                <div className="rounded-xl bg-red-50 px-3 py-2.5">
                  <p className="text-xs text-red-600">{t.due}</p>
                  <p className="font-bold text-red-700">{money(due)}</p>
                </div>
              </div>
            </div>
          )}

          <p className="mt-8 border-t border-gray-200 pt-3 text-center text-xs text-gray-400">
            {t.generated} {company.name}
          </p>
        </div>
      </div>
    </div>
  );
}
