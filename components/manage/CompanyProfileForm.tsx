'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw, UploadCloud, Printer } from 'lucide-react';
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
  },
};

export function CompanyProfileForm({ branch, initial }: { branch: string; initial: CompanyProfile }) {
  const router = useRouter();
  const locale = useLocale();
  const t = L[locale];
  const [form, setForm] = useState<CompanyProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
        </div>
      </div>
    </div>
  );
}
