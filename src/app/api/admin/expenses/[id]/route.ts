import { NextRequest, NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCaption';

/*
 * Editing and removing an expense. Office only, which is also what the RLS
 * policies say (0050): a monteur may read their own and insert their own, and
 * has no update or delete policy at all. The check here is the fast one; the
 * policy is the real guard, and both have to pass.
 */

const STATUSES = new Set(['pending', 'approved', 'rejected', 'paid']);
const ID = /^[0-9a-f-]{32,40}$/i;

const text = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });

  const user = await requireCrmUser();
  if (user.role === 'monteur') return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  /*
   * Built key by key rather than as one object literal. The previous version
   * wrote `{ status: body.status, approved_by: user.id }` on every call, so
   * correcting an amount also stamped the caller as the approver — a small
   * lie in an audit column that nothing else would ever correct.
   */
  const patch: Record<string, unknown> = {};

  if ('status' in body) {
    const status = String(body.status);
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: 'Onbekende status' }, { status: 400 });
    }
    patch.status = status;
    /* Only an approval records who approved it. Sending it back to pending
       clears the name rather than leaving a stale one attached. */
    patch.approved_by = status === 'approved' || status === 'paid' ? user.id : null;
  }

  if ('amount' in body) {
    const amount = Number(String(body.amount).replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Bedrag moet groter dan nul zijn' }, { status: 400 });
    }
    patch.amount = Math.round(amount * 100) / 100;
  }

  if ('category' in body) {
    const category = String(body.category);
    if (!(category in EXPENSE_CATEGORIES)) {
      return NextResponse.json({ error: 'Onbekende categorie' }, { status: 400 });
    }
    patch.category = category;
  }

  if ('description' in body) {
    const description = text(body.description, 300);
    if (!description) return NextResponse.json({ error: 'Omschrijving is verplicht' }, { status: 400 });
    patch.description = description;
  }

  if ('date_incurred' in body) {
    const date = text(body.date_incurred, 10);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Datum moet JJJJ-MM-DD zijn' }, { status: 400 });
    }
    patch.date_incurred = date;
  }

  if ('supplier_name' in body) patch.supplier_name = text(body.supplier_name, 200);
  if ('is_reimbursable' in body) patch.is_reimbursable = body.is_reimbursable === true;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Niets om te wijzigen' }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('expenses').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });

  const user = await requireCrmUser();
  if (user.role === 'monteur') return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const supabase = await createSupabaseServerClient();

  /* Read the receipt path first: once the row is gone there is nothing left
     pointing at the file, and a private bucket full of orphans nobody can
     trace back to an expense is its own small mess. */
  const { data: existing } = await supabase
    .from('expenses')
    .select('receipt_url')
    .eq('id', id)
    .maybeSingle<{ receipt_url: string | null }>();

  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing?.receipt_url) {
    /* Best effort. The expense is already gone and the caller should not see
       a failure because a storage object outlived it. */
    const { error: storageError } = await supabase.storage.from('facturen').remove([existing.receipt_url]);
    if (storageError) console.error('Bon kon niet worden verwijderd:', storageError.message);
  }

  return NextResponse.json({ ok: true });
}
