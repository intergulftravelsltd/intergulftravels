import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { chargeParty, recordPayment, logActivity } from '@/lib/management/server';
import { enforceBranch } from '@/lib/management/scope';
import { resolveReferenceableAffiliate, resolveChargeTarget } from '@/lib/management/affiliates';
import { BRANCHES } from '@/lib/management/branches';
import { DOC_STATUS_KEYS } from '@/lib/management/doc-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BRANCH_VALUES = BRANCHES.map((b) => b.value) as [string, ...string[]];

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const passengerSchema = z.object({
  name: z.string().trim().min(1, 'Passenger name is required.').max(160),
  name_bn: z.preprocess(emptyToNull, z.string().trim().max(160).nullable().optional()),
  passport_no: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().optional()),
  passport_issue: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  passport_expiry: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  dob: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  gender: z.preprocess(emptyToNull, z.enum(['male', 'female']).nullable().optional()),
  phone: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().optional()),
  address: z.preprocess(emptyToNull, z.string().trim().max(400).nullable().optional()),
  branch: z.enum(BRANCH_VALUES).default('inter-gulf-travels'),
  package_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  token_money: z.coerce.number().min(0).default(0),
  photo_url: z.preprocess(emptyToNull, z.string().trim().url().nullable().optional()),
  note: z.preprocess(emptyToNull, z.string().trim().max(1000).nullable().optional()),
  affiliate_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  doc_status: z.array(z.enum(DOC_STATUS_KEYS)).optional().default([]),
});

export async function POST(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.status === 401 ? 'Not signed in.' : 'Staff access required.' },
      { status: guard.status },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = passengerSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the passenger details.' },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const supabase = createAdminClient();

    // Insert the passenger. A DB trigger auto-creates the customer account head.
    const { data: passenger, error } = await supabase
      .from('umrah_passengers')
      .insert({
        name: d.name,
        name_bn: d.name_bn ?? null,
        passport_no: d.passport_no ?? null,
        passport_issue: d.passport_issue ?? null,
        passport_expiry: d.passport_expiry ?? null,
        dob: d.dob ?? null,
        phone: d.phone ?? null,
        address: d.address ?? null,
        branch: await enforceBranch(d.branch),
        package_id: d.package_id ?? null,
        token_money: d.token_money ?? 0,
        photo_url: d.photo_url ?? null,
        note: d.note ?? null,
        status: 'active',
        created_by: guard.user.id,
      })
      .select('id, account_head_id, branch')
      .single();

    if (error || !passenger) {
      console.error('[admin/umrah] insert failed:', error?.message);
      return NextResponse.json(
        { ok: false, error: 'Could not save the passenger. The management tables may not be set up yet.' },
        { status: 500 },
      );
    }

    // Care-of, gender + document status are optional add-ons written
    // best-effort, so a pre-migration schema (columns not yet added) never
    // blocks passenger entry.
    const affiliateId = await resolveReferenceableAffiliate(d.affiliate_id);
    if (affiliateId || (d.doc_status && d.doc_status.length)) {
      const { error: metaErr } = await supabase
        .from('umrah_passengers')
        .update({
          affiliate_id: affiliateId,
          doc_status: d.doc_status ?? [],
        })
        .eq('id', passenger.id);
      if (metaErr) console.error('[admin/umrah] care-of/doc_status skipped:', metaErr.message);
    }
    if (d.gender) {
      const { error: gErr } = await supabase.from('umrah_passengers').update({ gender: d.gender }).eq('id', passenger.id);
      if (gErr) console.error('[admin/umrah] gender skipped (run migration 0012):', gErr.message);
    }

    // Under a Group Fund care-of the leader's fund head carries the money.
    const target = await resolveChargeTarget(passenger.account_head_id as string | null, affiliateId);
    const headId = target.headId;

    // If assigned to a package at creation, charge the package price once.
    if (d.package_id && headId) {
      try {
        const { data: pkg } = await supabase
          .from('mgmt_packages')
          .select('id, price, name')
          .eq('id', d.package_id)
          .maybeSingle();
        if (pkg && Number(pkg.price) > 0) {
          await chargeParty({
            customer_head_id: headId,
            packageType: 'umrah',
            amount: Number(pkg.price),
            branch: passenger.branch,
            narration: target.groupFund
              ? `Umrah package charge — ${pkg.name} · ${d.name}`
              : `Umrah package charge — ${pkg.name}`,
            ref_table: 'umrah_passengers',
            ref_id: passenger.id,
            created_by: guard.user.id,
          });
        }
      } catch (err) {
        console.error('[admin/umrah] package charge failed:', err);
      }
    }

    // Record the token money as a received payment (into the fund head when
    // the passenger sits under a Group Fund leader).
    if (d.token_money && d.token_money > 0 && headId) {
      try {
        await recordPayment({
          party_table: target.groupFund ? 'affiliates' : 'umrah_passengers',
          party_id: target.groupFund ? target.groupFund.affiliateId : passenger.id,
          account_head_id: headId,
          amount: d.token_money,
          method: 'cash',
          type: 'token',
          narration: target.groupFund ? `Token money — ${d.name}` : 'Token money received',
          branch: passenger.branch,
          created_by: guard.user.id,
        });
      } catch (err) {
        console.error('[admin/umrah] token payment failed:', err);
      }
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'umrah.passenger.create',
      entity: 'umrah_passengers',
      entity_id: passenger.id,
      detail: { name: d.name, package_id: d.package_id ?? null },
      branch: passenger.branch,
    });

    return NextResponse.json({ ok: true, id: passenger.id });
  } catch (err) {
    console.error('[admin/umrah] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}
