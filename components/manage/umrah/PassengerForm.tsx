'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UploadCloud, Loader2, X, CheckCircle2, User } from 'lucide-react';
import { Card, Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { BRANCHES } from '@/lib/management/branches';
import type { MgmtPackage, UmrahPassenger } from '@/lib/management/types';
import type { AffiliateOption } from '@/lib/management/affiliates';
import { normalizeDocStatus, type DocStatusKey } from '@/lib/management/doc-status';
import { money } from '@/lib/management/format';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/LocaleProvider';
import { useLockedBranch } from '@/components/providers/BranchScope';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';
import { getDict as getCareDict } from '@/lib/dictionaries/areas/careof';
import { CareOfSelect } from '@/components/manage/CareOfSelect';
import { DocStatusSelect } from '@/components/manage/DocStatusSelect';
import { localizedPath } from '@/lib/i18n';

type PackageOption = Pick<MgmtPackage, 'id' | 'name' | 'price' | 'year'>;

export function PassengerForm({
  packages,
  affiliates = [],
  mode = 'create',
  passengerId,
  initial,
}: {
  packages: PackageOption[];
  affiliates?: AffiliateOption[];
  mode?: 'create' | 'edit';
  passengerId?: string;
  initial?: Partial<UmrahPassenger>;
}) {
  const locale = useLocale();
  const t = getDict(locale);
  const ct = getCareDict(locale);
  const lockedBranch = useLockedBranch();
  const router = useRouter();
  const isEdit = mode === 'edit';
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null);
  const [affiliateId, setAffiliateId] = useState<string | null>(initial?.affiliate_id ?? null);
  const [docStatus, setDocStatus] = useState<DocStatusKey[]>(normalizeDocStatus(initial?.doc_status));
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    name_bn: initial?.name_bn ?? '',
    passport_no: initial?.passport_no ?? '',
    passport_issue: initial?.passport_issue ?? '',
    passport_expiry: initial?.passport_expiry ?? '',
    dob: initial?.dob ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    branch: initial?.branch ?? 'inter-gulf-travels',
    package_id: initial?.package_id ?? '',
    token_money: '',
    note: initial?.note ?? '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error(t.toastChooseImage);
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'media');
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.url) {
        toast.error(data?.error ?? t.toastUploadFail);
        return;
      }
      setPhotoUrl(data.url as string);
      toast.success(t.toastPhotoUploaded);
    } catch {
      toast.error(t.toastUploadNetwork);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t.toastNameRequired);
      return;
    }
    setSaving(true);
    try {
      // On edit we PATCH only the profile fields. Package + branch are managed
      // from the profile so the ledger charge stays correct.
      const editPayload = {
        name: form.name,
        name_bn: form.name_bn,
        passport_no: form.passport_no,
        passport_issue: form.passport_issue,
        passport_expiry: form.passport_expiry,
        dob: form.dob,
        phone: form.phone,
        address: form.address,
        note: form.note,
        photo_url: photoUrl,
        affiliate_id: affiliateId,
        doc_status: docStatus,
      };

      const res = await fetch(isEdit ? `/api/admin/umrah/${passengerId}` : '/api/admin/umrah', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? editPayload
            : {
                ...form,
                token_money: form.token_money ? Number(form.token_money) : 0,
                photo_url: photoUrl,
                affiliate_id: affiliateId,
                doc_status: docStatus,
              },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.toastSaveFail);
        return;
      }
      toast.success(isEdit ? t.toastPassengerUpdated : t.toastPassengerAdded);
      router.push(localizedPath(locale, `/admin/umrah/${isEdit ? passengerId : data.id}`));
      router.refresh();
    } catch {
      toast.error(t.toastNetwork);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="space-y-5">
          <h2 className="font-display text-lg font-semibold text-ink">{t.passengerDetails}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.fullNameEnglish} required>
              <input className={inputClass} value={form.name} onChange={set('name')} placeholder={t.asInPassport} />
            </Field>
            <Field label={t.nameBangla}>
              <input className={inputClass} value={form.name_bn} onChange={set('name_bn')} placeholder={t.nameBanglaPlaceholder} />
            </Field>
            <Field label={t.phone}>
              <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder={t.phonePlaceholder} />
            </Field>
            <Field label={t.dateOfBirth}>
              <input type="date" className={inputClass} value={form.dob} onChange={set('dob')} />
            </Field>
            <Field label={t.address} className="sm:col-span-2">
              <textarea className={inputClass} rows={2} value={form.address} onChange={set('address')} placeholder={t.addressPlaceholder} />
            </Field>
          </div>

          <h3 className="border-t border-border pt-4 font-display text-base font-semibold text-ink">
            {t.passportInformation}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t.passportNo}>
              <input className={inputClass} value={form.passport_no} onChange={set('passport_no')} placeholder={t.passportNoPlaceholder} />
            </Field>
            <Field label={t.issueDate}>
              <input type="date" className={inputClass} value={form.passport_issue} onChange={set('passport_issue')} />
            </Field>
            <Field label={t.expiryDate}>
              <input type="date" className={inputClass} value={form.passport_expiry} onChange={set('passport_expiry')} />
            </Field>
          </div>

          <h3 className="border-t border-border pt-4 font-display text-base font-semibold text-ink">
            {t.booking}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {lockedBranch ? (
              <input type="hidden" name="branch" value={lockedBranch} />
            ) : (
              <Field label={t.branchConcern} required>
                <select className={inputClass} value={form.branch} onChange={set('branch')} disabled={isEdit}>
                  {BRANCHES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </Field>
            )}
            {!isEdit && (
              <Field label={t.umrahPackage} hint={t.packageOptionalHint}>
                <select className={inputClass} value={form.package_id} onChange={set('package_id')}>
                  <option value="">{t.notAssignedYet}</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.year ? ` (${p.year})` : ''} — {money(p.price)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {!isEdit && (
              <Field label={t.tokenMoney} hint={t.tokenMoneyHint}>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={form.token_money}
                  onChange={set('token_money')}
                  placeholder="0"
                />
              </Field>
            )}
            <Field label={ct.careOf} hint={ct.careOfHint} className="sm:col-span-2">
              <CareOfSelect
                affiliates={affiliates}
                value={affiliateId}
                onChange={setAffiliateId}
                branch={lockedBranch ?? form.branch}
              />
            </Field>
            <Field label={ct.docStatus} hint={ct.docStatusHint} className="sm:col-span-2">
              <DocStatusSelect value={docStatus} onChange={setDocStatus} />
            </Field>
            <Field label={t.note} className="sm:col-span-2">
              <textarea className={inputClass} rows={2} value={form.note} onChange={set('note')} placeholder={t.notePlaceholder} />
            </Field>
            {isEdit && (
              <p className="sm:col-span-2 text-xs text-ink-muted">
                {t.editPackageHint}
              </p>
            )}
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">{t.photo}</h2>
          {photoUrl ? (
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt={t.passengerAlt} className="aspect-[3/4] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink/80 to-transparent p-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gold-300" /> {t.stored}
                </span>
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-rose-600 transition hover:bg-white"
                  aria-label={t.removePhoto}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <label
              className={cn(
                'flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/40 px-4 text-center transition hover:border-brand-600/50 hover:bg-brand-50/50',
                uploading && 'pointer-events-none opacity-70',
              )}
            >
              {uploading ? (
                <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <UploadCloud className="h-6 w-6" />
                </span>
              )}
              <span className="text-sm font-semibold text-ink">
                {uploading ? t.uploadingEllipsis : t.uploadPhoto}
              </span>
              <span className="text-xs text-ink-muted">{t.photoFormatHint}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhoto(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}
          <p className="flex items-start gap-1.5 text-xs text-ink-muted">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t.ledgerAutoHint}
          </p>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
          {t.cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? t.savingEllipsis : isEdit ? t.saveChanges : t.savePassenger}
        </Button>
      </div>
    </form>
  );
}
