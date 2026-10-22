'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw, UploadCloud, Printer, PenLine, Trash2 } from 'lucide-react';
import { Card, Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/components/providers/LocaleProvider';
import { printTable } from '@/lib/export';
import type { CompanyProfile } from '@/lib/company-profile';

const L = {
  en: {
    letterhead: 'Letterhead',
    letterheadHint:
      'Printed at the top of every ledger, statement, receipt and Excel/PDF/Print export for this agency. The logo also appears as the centred watermark.',
    name: 'Company name',
    license: 'Tagline / licence line',
    licensePlaceholder: 'e.g. Govt. Approved Travel Agency · Hajj License No. 071',
    headOffice: 'Head Office',
    branchOffice: 'Branch Office',
    branchOfficePlaceholder: 'Leave blank if there is no second office',
    phone: 'Mobile number(s)',
    phonePlaceholder: '01325699588, 01675431118',
    email: 'Email',
    logo: 'Logo',
    logoHint: 'PNG / JPG / WebP with a transparent or white background works best. Square logos print cleanest.',
    upload: 'Upload logo',
    uploading: 'Uploading…',
    logoUrl: 'Logo URL',
    save: 'Save profile',
    saving: 'Saving…',
    saved: 'Company profile saved. Every new print and export now uses it.',
    reset: 'Reset to defaults',
    resetConfirm: 'Reset this agency to its built-in letterhead? Your edits will be discarded.',
    resetDone: 'Company profile reset to defaults.',
    preview: 'Preview print',
    previewTitle: 'Sample statement',
    failed: 'Could not save the company profile.',
    uploadFailed: 'Could not upload the logo.',
    previewHint: 'Live preview of the printed header',
    signatures: 'Signatures',
    signaturesHint:
      'Printed at the bottom of every receipt, statement and export: "Prepared by" on the left, "Authorized Signature" on the right — the signature above the line, the name under it.',
    preparedByName: 'Prepared by — name',
    authorizedName: 'Authorized signatory — name / designation',
    preparedBySig: 'Prepared-by signature',
    authorizedSig: 'Authorized signature',
    signatureHint:
      'Sign in dark ink on white paper, photograph or scan it and upload. The paper background is removed automatically and only the signature is kept (transparent PNG).',
    uploadSignature: 'Upload signature',
    processing: 'Processing…',
    removeSignature: 'Remove',
    noSignature: 'No signature uploaded',
    signatureFailed: 'Could not process the signature image.',
  },
  bn: {
    letterhead: 'লেটারহেড',
    letterheadHint:
      'এই এজেন্সির প্রতিটি লেজার, বিবরণী, রসিদ ও Excel/PDF/Print এক্সপোর্টের উপরে প্রিন্ট হয়। লোগোটি মাঝখানের জলছাপ হিসেবেও দেখা যায়।',
    name: 'কোম্পানির নাম',
    license: 'ট্যাগলাইন / লাইসেন্স লাইন',
    licensePlaceholder: 'যেমন Govt. Approved Travel Agency · Hajj License No. 071',
    headOffice: 'প্রধান কার্যালয়',
    branchOffice: 'শাখা কার্যালয়',
    branchOfficePlaceholder: 'দ্বিতীয় অফিস না থাকলে খালি রাখুন',
    phone: 'মোবাইল নম্বর',
    phonePlaceholder: '01325699588, 01675431118',
    email: 'ইমেইল',
    logo: 'লোগো',
    logoHint: 'স্বচ্ছ বা সাদা ব্যাকগ্রাউন্ডের PNG / JPG / WebP সবচেয়ে ভালো। বর্গাকার লোগো পরিষ্কার প্রিন্ট হয়।',
    upload: 'লোগো আপলোড',
    uploading: 'আপলোড হচ্ছে…',
    logoUrl: 'লোগো URL',
    save: 'প্রোফাইল সংরক্ষণ',
    saving: 'সংরক্ষণ হচ্ছে…',
    saved: 'কোম্পানি প্রোফাইল সংরক্ষিত। এখন থেকে সব প্রিন্ট ও এক্সপোর্টে এটি ব্যবহার হবে।',
    reset: 'ডিফল্টে ফেরান',
    resetConfirm: 'এই এজেন্সিকে বিল্ট-ইন লেটারহেডে ফেরাবেন? আপনার সম্পাদনা মুছে যাবে।',
    resetDone: 'কোম্পানি প্রোফাইল ডিফল্টে ফেরানো হয়েছে।',
    preview: 'প্রিন্ট প্রিভিউ',
    previewTitle: 'নমুনা বিবরণী',
    failed: 'কোম্পানি প্রোফাইল সংরক্ষণ করা যায়নি।',
    uploadFailed: 'লোগো আপলোড করা যায়নি।',
    previewHint: 'প্রিন্ট হেডারের লাইভ প্রিভিউ',
    signatures: 'স্বাক্ষর',
    signaturesHint:
      'প্রতিটি রসিদ, বিবরণী ও এক্সপোর্টের নিচে প্রিন্ট হয়: বামে "প্রস্তুতকারী", ডানে "অনুমোদিত স্বাক্ষর" — রেখার উপরে স্বাক্ষর, নিচে নাম।',
    preparedByName: 'প্রস্তুতকারী — নাম',
    authorizedName: 'অনুমোদিত স্বাক্ষরকারী — নাম / পদবি',
    preparedBySig: 'প্রস্তুতকারীর স্বাক্ষর',
    authorizedSig: 'অনুমোদিত স্বাক্ষর',
    signatureHint:
      'সাদা কাগজে গাঢ় কালিতে স্বাক্ষর করে ছবি তুলুন বা স্ক্যান করে আপলোড করুন। কাগজের ব্যাকগ্রাউন্ড নিজে থেকে মুছে শুধু স্বাক্ষরটুকু থাকে (স্বচ্ছ PNG)।',
    uploadSignature: 'স্বাক্ষর আপলোড',
    processing: 'প্রসেস হচ্ছে…',
    removeSignature: 'মুছুন',
    noSignature: 'কোনো স্বাক্ষর আপলোড হয়নি',
    signatureFailed: 'স্বাক্ষরের ছবিটি প্রসেস করা যায়নি।',
  },
};

type SignatureKind = 'prepared' | 'authorized';

export function CompanyProfileForm({ branch, initial }: { branch: string; initial: CompanyProfile }) {
  const router = useRouter();
  const locale = useLocale();
  const t = L[locale];
  const [form, setForm] = useState<CompanyProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sigBusy, setSigBusy] = useState<SignatureKind | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const prepSigRef = useRef<HTMLInputElement>(null);
  const authSigRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch,
          profile: {
            name: form.name,
            license: form.license,
            headOffice: form.headOffice,
            branchOffice: form.branchOffice,
            phone: form.phone,
            email: form.email,
            logo: form.logo,
            preparedByName: form.preparedByName,
            preparedBySignature: form.preparedBySignature,
            authorizedName: form.authorizedName,
            authorizedSignature: form.authorizedSignature,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.failed);
        return;
      }
      toast.success(t.saved);
      router.refresh();
    } catch {
      toast.error(t.failed);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!window.confirm(t.resetConfirm)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/company?branch=${encodeURIComponent(branch)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.failed);
        return;
      }
      if (data.profile) setForm(data.profile as CompanyProfile);
      toast.success(t.resetDone);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('branch', branch);
      const res = await fetch('/api/admin/company/logo', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.url) {
        toast.error(data?.error ?? t.uploadFailed);
        return;
      }
      setForm((f) => ({ ...f, logo: data.url as string }));
    } catch {
      toast.error(t.uploadFailed);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function uploadSignature(kind: SignatureKind, file: File) {
    setSigBusy(kind);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('branch', branch);
      body.append('kind', kind);
      const res = await fetch('/api/admin/company/signature', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.url) {
        toast.error(data?.error ?? t.signatureFailed);
        return;
      }
      setForm((f) => (kind === 'prepared' ? { ...f, preparedBySignature: data.url as string } : { ...f, authorizedSignature: data.url as string }));
    } catch {
      toast.error(t.signatureFailed);
    } finally {
      setSigBusy(null);
      const ref = kind === 'prepared' ? prepSigRef : authSigRef;
      if (ref.current) ref.current.value = '';
    }
  }

  // A render function, not a nested component: a component defined inside
  // render remounts on every keystroke and the name input would lose focus.
  const signatureField = (kind: SignatureKind) => {
    const image = kind === 'prepared' ? form.preparedBySignature : form.authorizedSignature;
    const ref = kind === 'prepared' ? prepSigRef : authSigRef;
    const busy = sigBusy === kind;
    return (
      <div className="space-y-2">
        <Field label={kind === 'prepared' ? t.preparedByName : t.authorizedName}>
          <input
            className={inputClass}
            value={kind === 'prepared' ? form.preparedByName : form.authorizedName}
            maxLength={120}
            onChange={set(kind === 'prepared' ? 'preparedByName' : 'authorizedName')}
          />
        </Field>
        <p className="text-sm font-medium text-ink">{kind === 'prepared' ? t.preparedBySig : t.authorizedSig}</p>
        <div
          className="flex h-24 items-end justify-center rounded-xl border border-border px-3 pb-2"
          style={{
            backgroundImage:
              'linear-gradient(45deg,#f1efe6 25%,transparent 25%),linear-gradient(-45deg,#f1efe6 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f1efe6 75%),linear-gradient(-45deg,transparent 75%,#f1efe6 75%)',
            backgroundSize: '14px 14px',
            backgroundPosition: '0 0,0 7px,7px -7px,-7px 0',
          }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="max-h-20 max-w-full object-contain" />
          ) : (
            <span className="pb-6 text-xs text-ink-muted">{t.noSignature}</span>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadSignature(kind, f);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
            {busy ? t.processing : t.uploadSignature}
          </Button>
          {image && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                setForm((f) => (kind === 'prepared' ? { ...f, preparedBySignature: '' } : { ...f, authorizedSignature: '' }))
              }
            >
              <Trash2 className="h-4 w-4" /> {t.removeSignature}
            </Button>
          )}
        </div>
      </div>
    );
  };

  function preview() {
    printTable({
      title: t.previewTitle,
      subtitle: form.name,
      headers: locale === 'bn' ? ['তারিখ', 'বিবরণ', 'ডেবিট', 'ক্রেডিট'] : ['Date', 'Particulars', 'Debit', 'Credit'],
      rows: [['—', '—', '0', '0']],
      company: form,
      period: { from: null, to: null },
      locale,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{t.letterhead}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.letterheadHint}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.name} required className="sm:col-span-2">
            <input className={inputClass} value={form.name} maxLength={120} onChange={set('name')} />
          </Field>
          <Field label={t.license} className="sm:col-span-2">
            <input className={inputClass} value={form.license} maxLength={160} placeholder={t.licensePlaceholder} onChange={set('license')} />
          </Field>
          <Field label={t.headOffice} className="sm:col-span-2">
            <input className={inputClass} value={form.headOffice} maxLength={300} onChange={set('headOffice')} />
          </Field>
          <Field label={t.branchOffice} className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.branchOffice}
              maxLength={300}
              placeholder={t.branchOfficePlaceholder}
              onChange={set('branchOffice')}
            />
          </Field>
          <Field label={t.phone}>
            <input className={inputClass} value={form.phone} maxLength={160} placeholder={t.phonePlaceholder} onChange={set('phone')} />
          </Field>
          <Field label={t.email}>
            <input className={inputClass} type="email" value={form.email} maxLength={160} onChange={set('email')} />
          </Field>

          <Field label={t.logo} hint={t.logoHint} className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white">
                {form.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-xs text-ink-muted">—</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  className={inputClass}
                  value={form.logo}
                  placeholder={t.logoUrl}
                  maxLength={600}
                  onChange={set('logo')}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploading ? t.uploading : t.upload}
                </Button>
              </div>
            </div>
          </Field>
        </div>

        {/* Signatures — printed at the bottom of every receipt / statement / export */}
        <div className="border-t border-border pt-5">
          <h2 className="font-display text-base font-semibold text-ink">{t.signatures}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.signaturesHint}</p>
          <p className="mt-1 text-xs text-ink-muted">{t.signatureHint}</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {signatureField('prepared')}
            {signatureField('authorized')}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={preview}>
              <Printer className="h-4 w-4" /> {t.preview}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={reset}>
              <RotateCcw className="h-4 w-4" /> {t.reset}
            </Button>
          </div>
          <Button type="button" onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </Card>

      {/* Live letterhead preview */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.previewHint}</p>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-soft">
          {form.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.logo}
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 select-none"
              style={{ opacity: 0.16, filter: 'grayscale(1) brightness(0.45)' }}
            />
          )}
          <div className="relative flex items-start gap-3 border-b-2 border-emerald-700 pb-3">
            {form.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logo} alt="" className="h-14 w-14 shrink-0 object-contain" />
            )}
            <div className="min-w-0 text-black">
              <p className="text-base font-bold leading-tight text-emerald-800">{form.name || '—'}</p>
              {form.license && <p className="text-[0.65rem] font-semibold text-gray-500">{form.license}</p>}
              <div className="mt-1 space-y-0.5 text-[0.68rem] leading-snug text-gray-700">
                {form.headOffice && (
                  <p>
                    <b>{t.headOffice}:</b> {form.headOffice}
                  </p>
                )}
                {form.branchOffice && (
                  <p>
                    <b>{t.branchOffice}:</b> {form.branchOffice}
                  </p>
                )}
                {(form.phone || form.email) && (
                  <p>
                    {form.phone && (
                      <>
                        <b>{locale === 'bn' ? 'মোবাইল' : 'Mobile'}:</b> {form.phone}
                      </>
                    )}
                    {form.phone && form.email && ' · '}
                    {form.email && (
                      <>
                        <b>{t.email}:</b> {form.email}
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="relative mt-3 space-y-1.5">
            <div className="h-2 w-2/3 rounded bg-gray-200" />
            <div className="h-2 w-1/2 rounded bg-gray-100" />
            <div className="mt-3 h-16 rounded border border-dashed border-gray-200" />
          </div>
          {/* Footer preview: the two signature blocks exactly as printed */}
          <div className="relative mt-5 flex items-end justify-between gap-4 text-black">
            {(
              [
                { image: form.preparedBySignature, name: form.preparedByName, label: locale === 'bn' ? 'প্রস্তুতকারী' : 'Prepared by' },
                { image: form.authorizedSignature, name: form.authorizedName, label: locale === 'bn' ? 'অনুমোদিত স্বাক্ষর' : 'Authorized Signature' },
              ] as const
            ).map((b) => (
              <div key={b.label} className="w-[45%] text-center">
                <div className="flex h-10 items-end justify-center">
                  {b.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image} alt="" className="max-h-10 max-w-full object-contain" />
                  )}
                </div>
                <div className="border-t border-gray-600 pt-0.5">
                  {b.name && <p className="text-[0.62rem] font-semibold leading-tight text-gray-900">{b.name}</p>}
                  <p className="text-[0.56rem] text-gray-600">{b.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
