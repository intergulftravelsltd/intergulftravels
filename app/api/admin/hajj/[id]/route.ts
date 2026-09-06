import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mgmtDb, chargeParty, getSystemHead, INCOME_HEAD, logActivity } from '@/lib/management/server';
import { requireStaff } from '@/lib/management/guard';
import { resolveReferenceableAffiliate } from '@/lib/management/affiliates';
import { DOC_STATUS_KEYS } from '@/lib/management/doc-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  action: z.enum(['assign-package', 'status', 'edit']),
  // assign-package
  package_id: z.string().uuid().optional().nullable(),
  // status
  status: z.enum(['active', 'cancelled', 'completed']).optional(),
  // care-of + document status
  affiliate_id: z.string().uuid().optional().nullable(),
  doc_status: z.array(z.enum(DOC_STATUS_KEYS)).optional(),
  // edit (a curated, safe subset)
  name: z.string().trim().min(1).optional(),
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
  pre_reg_no: z.string().trim().optional().nullable(),
  govt_serial: z.string().trim().optional().nullable(),
  photo_url: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

const clean = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : v;
  return s === '' || s === undefined ? null : s;
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

    const { data: pilgrim, error: loadErr } = await db
      .from('hajj_pilgrims')
      .select('id, account_head_id, branch, package_id')
      .eq('id', params.id)
      .maybeSingle();

    if (loadErr || !pilgrim) {
      return NextResponse.json({ ok: false, error: 'Pilgrim not found.' }, { status: 404 });
    }

    // -------------------------------------------------------- assign package
    if (d.action === 'assign-package') {
      if (!d.package_id) {
        return NextResponse.json({ ok: false, error: 'Select a package.' }, { status: 400 });
      }

      const { data: pkg } = await db
        .from('mgmt_packages')
        .select('id, name, price, type')
        .eq('id', d.package_id)
        .maybeSingle();

      if (!pkg) {
        return NextResponse.json({ ok: false, error: 'Package not found.' }, { status: 404 });
      }

      // Assigning a package only links the package + posts the charge; the
      // registration type stays as staff set it (pre-registered by default).
      const { error: upErr } = await db
        .from('hajj_pilgrims')
        .update({ package_id: pkg.id })
        .eq('id', pilgrim.id);

      if (upErr) {
        console.error('[admin/hajj/:id] assign update failed:', upErr.message);
        return NextResponse.json({ ok: false, error: 'Could not assign the package.' }, { status: 500 });
      }

      // Charge the price once. Guard against a double-charge: only charge when
      // no package-income journal already exists for this pilgrim.
      const price = Number(pkg.price ?? 0);
      if (price > 0 && pilgrim.account_head_id) {
        const incomeHead = await getSystemHead(INCOME_HEAD.hajj, pilgrim.branch);
        let alreadyCharged = false;
        if (incomeHead) {
          const { data: existing } = await db
            .from('transactions')
            .select('id')
            .eq('ref_table', 'hajj_pilgrims')
            .eq('ref_id', pilgrim.id)
            .eq('credit_account_id', incomeHead.id)
            .limit(1);
          alreadyCharged = (existing?.length ?? 0) > 0;
        }

        if (!alreadyCharged) {
          await chargeParty({
            customer_head_id: pilgrim.account_head_id,
            packageType: 'hajj',
            amount: price,
            branch: pilgrim.branch,
            narration: `Hajj package — ${pkg.name}`,
            ref_table: 'hajj_pilgrims',
            ref_id: pilgrim.id,
            created_by: guard.user.id,
          });
        }
      }

      await logActivity({
        user_id: guard.user.id,
        user_email: guard.user.email,
        action: 'assign-package',
        entity: 'hajj_pilgrim',
        entity_id: pilgrim.id,
        detail: { package_id: pkg.id, package: pkg.name },
        branch: pilgrim.branch,
      });

      return NextResponse.json({ ok: true });
    }

    // ----------------------------------------------------------- status change
    if (d.action === 'status') {
      if (!d.status) {
        return NextResponse.json({ ok: false, error: 'Select a status.' }, { status: 400 });
      }
      const { error: upErr } = await db
        .from('hajj_pilgrims')
        .update({ status: d.status })
        .eq('id', pilgrim.id);
      if (upErr) {
        console.error('[admin/hajj/:id] status update failed:', upErr.message);
        return NextResponse.json({ ok: false, error: 'Could not update status.' }, { status: 500 });
      }
      await logActivity({
        user_id: guard.user.id,
        user_email: guard.user.email,
        action: 'status',
        entity: 'hajj_pilgrim',
        entity_id: pilgrim.id,
        detail: { status: d.status },
        branch: pilgrim.branch,
      });
      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------- edit
    const fields = [
      'name', 'name_bn', 'father_name', 'mother_name', 'nid', 'passport_no',
      'dob', 'gender', 'phone', 'address', 'district', 'pre_reg_no',
      'govt_serial', 'photo_url', 'note',
    ] as const;

    const update: Record<string, unknown> = {};
    for (const f of fields) {
      if (f in (payload as object)) update[f] = f === 'name' ? d.name : clean((d as Record<string, unknown>)[f]);
    }
    const hasCareOf = 'affiliate_id' in (payload as object);
    const hasDocs = 'doc_status' in (payload as object);

    if (Object.keys(update).length === 0 && !hasCareOf && !hasDocs) {
      return NextResponse.json({ ok: false, error: 'Nothing to update.' }, { status: 400 });
    }

    if (Object.keys(update).length > 0) {
      const { error: upErr } = await db.from('hajj_pilgrims').update(update).eq('id', pilgrim.id);
      if (upErr) {
        console.error('[admin/hajj/:id] edit update failed:', upErr.message);
        return NextResponse.json({ ok: false, error: 'Could not save changes.' }, { status: 500 });
      }
    }

    // Care-of + document status written best-effort in a separate update so a
    // pre-migration schema never blocks the core profile edit.
    if (hasCareOf || hasDocs) {
      const meta: Record<string, unknown> = {};
      if (hasCareOf) meta.affiliate_id = await resolveReferenceableAffiliate(d.affiliate_id);
      if (hasDocs) meta.doc_status = Array.isArray(d.doc_status) ? d.doc_status : [];
      const { error: metaErr } = await db.from('hajj_pilgrims').update(meta).eq('id', pilgrim.id);
      if (metaErr) console.error('[admin/hajj/:id] care-of/doc_status skipped:', metaErr.message);
    }
    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'edit',
      entity: 'hajj_pilgrim',
      entity_id: pilgrim.id,
      branch: pilgrim.branch,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/hajj/:id] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = await requireStaff();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.status === 401 ? 'Not signed in.' : 'Staff access required.' },
      { status: guard.status },
    );
  }

  try {
    const db = mgmtDb();
    const { data: pilgrim } = await db
      .from('hajj_pilgrims')
      .select('id, account_head_id, branch, name')
      .eq('id', params.id)
      .maybeSingle();
    if (!pilgrim) return NextResponse.json({ ok: false, error: 'Pilgrim not found.' }, { status: 404 });

    // Collect the receipt vouchers tied to this pilgrim's payments.
    const { data: pays } = await db
      .from('payments')
      .select('transaction_id')
      .eq('party_table', 'hajj_pilgrims')
      .eq('party_id', params.id);
    const txIds = (pays ?? [])
      .map((p: { transaction_id: string | null }) => p.transaction_id)
      .filter(Boolean) as string[];

    // Delete payments first (their FK points at the receipt transactions).
    await db.from('payments').delete().eq('party_table', 'hajj_pilgrims').eq('party_id', params.id);

    // Delete the package-charge journal(s) + the receipt vouchers — the delete
    // trigger reverses both account balances automatically.
    await db.from('transactions').delete().eq('ref_table', 'hajj_pilgrims').eq('ref_id', params.id);
    if (txIds.length) await db.from('transactions').delete().in('id', txIds);

    // Delete the pilgrim, then its auto-created customer ledger head.
    const { error: delErr } = await db.from('hajj_pilgrims').delete().eq('id', params.id);
    if (delErr) {
      console.error('[admin/hajj/:id] delete failed:', delErr.message);
      return NextResponse.json({ ok: false, error: 'Could not delete the pilgrim.' }, { status: 500 });
    }
    if (pilgrim.account_head_id) {
      await db.from('account_heads').delete().eq('id', pilgrim.account_head_id).eq('ref_table', 'hajj_pilgrims');
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'delete',
      entity: 'hajj_pilgrim',
      entity_id: params.id,
      detail: { name: pilgrim.name },
      branch: pilgrim.branch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/hajj/:id] delete error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
