import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mgmtDb, nextCounter, chargeParty, recordPayment, logActivity } from '@/lib/management/server';
import { requireStaff } from '@/lib/management/guard';
import { enforceBranch } from '@/lib/management/scope';
import { resolveReferenceableAffiliate } from '@/lib/management/affiliates';
import { DOC_STATUS_KEYS } from '@/lib/management/doc-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  name_bn: z.string().trim().optional().nullable(),
  father_name: z.string().trim().optional().nullable(),
  mother_name: z.string().trim().optional().nullable(),
  nid: z.string().trim().optional().nullable(),
  passport_no: z.string().trim().optional().nullable(),
  dob: z.string().trim().optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  district: z.string().trim().optional().nullable(),
  year: z.coerce.number().int().min(2000).max(2100),
  reg_type: z.enum(['pre-registration', 'registered']).default('pre-registration'),
  pre_reg_no: z.string().trim().optional().nullable(),
  govt_serial: z.string().trim().optional().nullable(),
  branch: z.string().trim().min(1).default('general'),
  package_id: z.string().uuid().optional().nullable(),
  token_money: z.coerce.number().min(0).default(0),
  photo_url: z.string().trim().url().optional().nullable().or(z.literal('')),
  note: z.string().trim().optional().nullable(),
  affiliate_id: z.string().uuid().optional().nullable(),
  doc_status: z.array(z.enum(DOC_STATUS_KEYS)).optional().default([]),
});

const clean = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : v;
  return s === '' || s === undefined ? null : s;
};

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

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const db = mgmtDb();

    // tracking_no = H{year}-{padded counter}
    const counter = await nextCounter(`hajj_${d.year}`);
    const tracking_no = `H${d.year}-${String(counter).padStart(4, '0')}`;

    // If a package is chosen the pilgrim is effectively registered.
    const hasPackage = Boolean(d.package_id);
    const reg_type = hasPackage ? 'registered' : d.reg_type;

    const { data: pilgrim, error } = await db
      .from('hajj_pilgrims')
      .insert({
        tracking_no,
        name: d.name,
        name_bn: clean(d.name_bn),
        father_name: clean(d.father_name),
        mother_name: clean(d.mother_name),
        nid: clean(d.nid),
        passport_no: clean(d.passport_no),
        dob: clean(d.dob),
        gender: clean(d.gender),
        phone: clean(d.phone),
        address: clean(d.address),
        district: clean(d.district),
        year: d.year,
        reg_type,
        pre_reg_no: clean(d.pre_reg_no),
        govt_serial: clean(d.govt_serial),
        package_id: d.package_id ?? null,
        branch: await enforceBranch(d.branch),
        token_money: d.token_money,
        photo_url: clean(d.photo_url),
        note: clean(d.note),
        created_by: guard.user.id,
      })
      .select('id, account_head_id, branch')
      .single();

    if (error || !pilgrim) {
      console.error('[admin/hajj] insert failed:', error?.message);
      return NextResponse.json({ ok: false, error: 'Could not save the pilgrim.' }, { status: 500 });
    }

    // Care-of + document status are optional add-ons written best-effort, so a
    // pre-migration schema (columns not yet added) never blocks pilgrim entry.
    if (d.affiliate_id || (d.doc_status && d.doc_status.length)) {
      const { error: metaErr } = await db
        .from('hajj_pilgrims')
        .update({
          affiliate_id: await resolveReferenceableAffiliate(d.affiliate_id),
          doc_status: d.doc_status ?? [],
        })
        .eq('id', pilgrim.id);
      if (metaErr) console.error('[admin/hajj] care-of/doc_status skipped:', metaErr.message);
    }

    // The DB trigger creates + links the customer account head on insert.
    const headId: string | null = pilgrim.account_head_id;

    // Charge the package price once (creates the due) when a package is assigned.
    if (hasPackage && headId) {
      const { data: pkg } = await db
        .from('mgmt_packages')
        .select('price, name')
        .eq('id', d.package_id)
        .maybeSingle();
      const price = Number(pkg?.price ?? 0);
      if (price > 0) {
        await chargeParty({
          customer_head_id: headId,
          packageType: 'hajj',
          amount: price,
          branch: pilgrim.branch,
          narration: `Hajj package — ${pkg?.name ?? ''}`.trim(),
          ref_table: 'hajj_pilgrims',
          ref_id: pilgrim.id,
          created_by: guard.user.id,
        });
      }
    }

    // Token money received → record it as a payment against their head.
    if (d.token_money > 0 && headId) {
      await recordPayment({
        party_table: 'hajj_pilgrims',
        party_id: pilgrim.id,
        account_head_id: headId,
        amount: d.token_money,
        method: 'cash',
        type: 'token',
        branch: pilgrim.branch,
        narration: 'Token money received',
        created_by: guard.user.id,
      });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'create',
      entity: 'hajj_pilgrim',
      entity_id: pilgrim.id,
      detail: { tracking_no, name: d.name, reg_type },
      branch: pilgrim.branch,
    });

    return NextResponse.json({ ok: true, id: pilgrim.id, tracking_no });
  } catch (err) {
    console.error('[admin/hajj] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
